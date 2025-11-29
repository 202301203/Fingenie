# apps/dataprocessor/tests/test_models_extra.py
import pytest
from apps.dataprocessor.models import FinancialReport


@pytest.mark.django_db
def test_financial_report_defaults_and_str():
    fr = FinancialReport.objects.create(company_name="Zed Ltd", ticker_symbol="ZED")
    assert fr.report_id  # UUID exists
    assert str(fr)  # __str__ (if implemented) should not crash


@pytest.mark.django_db
def test_financial_report_summary_and_ratios_accessors_exist():
    fr = FinancialReport.objects.create(company_name="Foo")
    # These methods are used in views; ensure they exist & return correct shapes
    summary = fr.get_summary()
    ratios = fr.get_ratios()
    assert isinstance(summary, dict)
    assert isinstance(ratios, (list, dict))  # depending on your implementation


@pytest.mark.django_db
def test_financial_report_update_and_save_roundtrip():
    fr = FinancialReport.objects.create(company_name="Init")
    fr.company_name = "Changed"
    fr.save()
    fr.refresh_from_db()
    assert fr.company_name == "Changed"
