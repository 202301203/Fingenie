import pytest
from apps.balance_sheet_comparator.models import BalanceSheetComparison
import uuid

@pytest.mark.django_db
def test_balance_sheet_comparison_creation():
    comparison = BalanceSheetComparison.objects.create(
        company1_name="Comp A",
        company2_name="Comp B",
        comparison_result={"test": "data"}
    )
    
    assert isinstance(comparison.comparison_id, uuid.UUID)
    assert comparison.company1_name == "Comp A"
    assert comparison.company2_name == "Comp B"
    assert comparison.comparison_result == {"test": "data"}
    assert comparison.company1_metrics == {}
    assert comparison.company2_metrics == {}
    assert comparison.evaluation == {}

@pytest.mark.django_db
def test_balance_sheet_comparison_str():
    comparison = BalanceSheetComparison.objects.create(
        company1_name="Comp A",
        company2_name="Comp B"
    )
    
    str_rep = str(comparison)
    assert "Comp A vs Comp B" in str_rep
    assert comparison.created_at.strftime('%Y-%m-%d') in str_rep

@pytest.mark.django_db
def test_balance_sheet_comparison_defaults():
    comparison = BalanceSheetComparison.objects.create()
    assert comparison.company1_name == "Company 1"
    assert comparison.company2_name == "Company 2"
    assert isinstance(comparison.comparison_id, uuid.UUID)


@pytest.mark.django_db
def test_defaults_are_independent_and_mutable_behavior():
    # Ensure default dict fields are independent per instance (no shared mutable default)
    c1 = BalanceSheetComparison.objects.create()
    c2 = BalanceSheetComparison.objects.create()

    # mutate c1's comparison_result and ensure c2 unaffected
    c1.comparison_result['new_key'] = 'value'
    c1.save()
    c2.refresh_from_db()
    assert c2.comparison_result == {}


@pytest.mark.django_db
def test_updated_at_changes_on_save():
    c = BalanceSheetComparison.objects.create()
    created = c.created_at
    updated = c.updated_at
    # modify and save
    c.company1_name = "Modified"
    c.save()
    c.refresh_from_db()
    assert c.updated_at >= updated
    assert c.created_at == created


@pytest.mark.django_db
def test_model_meta_and_str_exact():
    c = BalanceSheetComparison.objects.create(company1_name="A", company2_name="B")
    # __str__ exact format
    expected = f"A vs B ({c.created_at.strftime('%Y-%m-%d')})"
    assert str(c) == expected

    # Meta checks
    meta = BalanceSheetComparison._meta
    assert meta.db_table == 'balance_sheet_comparisons'
    assert meta.ordering == ['-created_at']
    assert meta.verbose_name == 'Balance Sheet Comparison'
    assert meta.verbose_name_plural == 'Balance Sheet Comparisons'

