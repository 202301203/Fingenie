# apps/dataprocessor/tests/test_models_financial_report.py
import json
from datetime import timedelta

import pytest
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

from apps.dataprocessor.models import FinancialReport
from apps.accounts.models import UserActivity


@pytest.mark.django_db
def test_get_summary_accepts_dict_string_and_handles_bad_json():
    # dict input
    r1 = FinancialReport.objects.create(
        company_name="Acme Corp",
        summary={"pros": ["A"], "cons": ["B"], "financial_health_summary": "ok"},
    )
    s1 = r1.get_summary()
    assert s1["pros"] == ["A"] and s1["cons"] == ["B"] and s1["financial_health_summary"] == "ok"

    # JSON string
    r2 = FinancialReport.objects.create(
        company_name="Beta Inc",
        summary=json.dumps({"pros": ["P"], "cons": [], "financial_health_summary": "solid"}),
    )
    s2 = r2.get_summary()
    assert s2["pros"] == ["P"] and s2["cons"] == [] and "solid" in s2["financial_health_summary"]

    # bad JSON string -> safe fallback
    r3 = FinancialReport.objects.create(company_name="Gamma Ltd", summary="{bad json")
    s3 = r3.get_summary()
    assert s3["pros"] == [] and s3["cons"] == [] and "Summary not available" in s3["financial_health_summary"]


@pytest.mark.django_db
def test_get_ratios_accepts_list_string_and_handles_bad_json():
    ratios = [
        {
            "ratio_name": "Current Ratio",
            "formula": "CA/CL",
            "calculation": "200/100",
            "result": 2,
            "interpretation": "Healthy",
        }
    ]
    r1 = FinancialReport.objects.create(company_name="Acme", ratios=ratios)
    out1 = r1.get_ratios()
    assert isinstance(out1, list) and out1[0]["ratio_name"] == "Current Ratio" and out1[0]["result"] == 2.0

    r2 = FinancialReport.objects.create(company_name="Acme2", ratios=json.dumps(ratios))
    out2 = r2.get_ratios()
    assert out2 and out2[0]["formula"] == "CA/CL"

    r3 = FinancialReport.objects.create(company_name="Acme3", ratios="{oops")
    out3 = r3.get_ratios()
    assert out3 == []


@pytest.mark.django_db
def test_setters_normalize_and_persist():
    r = FinancialReport.objects.create(company_name="SetterCo")

    r.set_summary({"pros": ["x"], "cons": [], "financial_health_summary": "fine"})
    r.refresh_from_db()
    s = r.get_summary()
    assert s["pros"] == ["x"] and s["cons"] == [] and s["financial_health_summary"] == "fine"

    r.set_ratios(
        [
            {
                "ratio_name": "ROE",
                "formula": "NI/Equity",
                "calculation": "10/50",
                "result": 0.2,
                "interpretation": "ok",
            },
            {"ratio_name": "Weird", "extra": "ignored"},
        ]
    )
    r.refresh_from_db()
    rr = r.get_ratios()
    names = [x["ratio_name"] for x in rr]
    assert "ROE" in names and "Weird" in names  # normalized with default fields present
    # make sure required keys exist
    for item in rr:
        assert {"ratio_name", "formula", "calculation", "result", "interpretation"} <= set(item.keys())


@pytest.mark.django_db
def test_properties_and_display_name_and_fileflag(tmp_path):
    # fake upload
    content = b"%PDF-1.4 fake"
    up = SimpleUploadedFile("report.pdf", content, content_type="application/pdf")
    r = FinancialReport.objects.create(
        company_name="Zeta", ticker_symbol="ZETA.NS", uploaded_pdf=up, pdf_original_name="report.pdf"
    )
    # properties backed by summary
    r.set_summary({"pros": ["fast"], "cons": ["costly"], "financial_health_summary": "mixed"})
    r.refresh_from_db()

    assert r.has_uploaded_pdf is True
    assert r.display_name == "Zeta (ZETA.NS)"
    assert r.pros == ["fast"]
    assert r.cons == ["costly"]
    assert r.financial_health_summary == "mixed"

    # no ticker fallback
    r2 = FinancialReport.objects.create(company_name="NoTicker")
    assert r2.display_name == "NoTicker"
    assert r2.has_uploaded_pdf is False


@pytest.mark.django_db
@pytest.mark.parametrize(
    "days,expected",
    [
        (0, "Today"),
        (1, "Yesterday"),
        (3, "3 days ago"),
        (10, "1 week ago"),  # floor(10/7) = 1
    ],
)
def test_time_ago_common_branches(days, expected):
    r = FinancialReport.objects.create(company_name="TimeCo")
    earlier = timezone.now() - timedelta(days=days)
    # update created_at directly
    FinancialReport.objects.filter(pk=r.pk).update(created_at=earlier)
    r.refresh_from_db()
    assert r.time_ago == expected


@pytest.mark.django_db
def test_time_ago_over_30_days_formats_date():
    r = FinancialReport.objects.create(company_name="OldCo")
    older = timezone.now() - timedelta(days=40)
    FinancialReport.objects.filter(pk=r.pk).update(created_at=older)
    r.refresh_from_db()
    assert r.time_ago == older.strftime("%b %d, %Y")


@pytest.mark.django_db
def test_str_contains_user_ticker_and_date():
    user = User.objects.create_user(username="alice", password="x")
    r = FinancialReport.objects.create(company_name="NiceCo", ticker_symbol="NCO", user=user)
    s = str(r)
    assert "NiceCo (NCO)" in s and "alice" in s and r.created_at.strftime("%Y-%m-%d") in s


@pytest.mark.django_db
def test_to_api_response_shape_and_values():
    user = User.objects.create_user(username="bob", password="x")
    r = FinancialReport.objects.create(
        company_name="ApiCo", ticker_symbol="APC", user=user, pdf_original_name="orig.pdf"
    )
    r.set_summary({"pros": ["+a"], "cons": ["-b"], "financial_health_summary": "ok"})
    r.set_ratios(
        [
            {
                "ratio_name": "Current Ratio",
                "formula": "CA/CL",
                "calculation": "2/1",
                "result": 2,
                "interpretation": "good",
            }
        ]
    )
    data = r.to_api_response()
    assert data["success"] is True
    assert data["company_name"] == "ApiCo" and data["ticker_symbol"] == "APC"
    assert data["user"] == "bob"
    assert isinstance(data["summary"]["pros"], list) and isinstance(data["ratios"], list)
    assert data["uploaded_pdf_name"] == "orig.pdf"
    # created_at isoformat
    assert "T" in data["created_at"]


@pytest.mark.django_db
def test_post_save_signal_creates_analysis_activity_record():
    user = User.objects.create_user(username="signaluser", password="x")

    # there may already be a "login/Account Created" activity from accounts' signal
    before = UserActivity.objects.filter(user=user, activity_type="analysis").count()

    r = FinancialReport.objects.create(company_name="Signal Co", ticker_symbol="SIG", user=user)

    after = UserActivity.objects.filter(user=user, activity_type="analysis").count()
    assert after == before + 1

    act = UserActivity.objects.filter(user=user, activity_type="analysis").latest("created_at")
    assert "Analyzed" in act.title and "Signal Co (SIG)" in act.title
    # object_id equals report_id
    assert str(act.object_id) == str(r.report_id)
