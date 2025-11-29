import pytest
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.company_search.models import (
    CompanySearch,
    FinancialStatementCache,
    APIUsageLog,
)

# Mark all tests to allow database usage
pytestmark = pytest.mark.django_db

class TestCompanySearchModel:
    def test_01_create_valid_company_search(self):
        """Test creating a basic valid CompanySearch entry."""
        search = CompanySearch.objects.create(symbol="AAPL", name="Apple Inc.")
        assert search.symbol == "AAPL"
        assert search.search_count == 0
        assert str(search) == "AAPL - Apple Inc."

    def test_02_symbol_regex_validation_valid(self):
        """Test that valid symbols (dots, hyphens allowed) pass validation."""
        valid_symbols = ["BRK.B", "T", "GOOGL", "005930.KS", "A-B"]
        for sym in valid_symbols:
            company = CompanySearch(symbol=sym, name="Test")
            company.full_clean()  # Should not raise

    def test_03_symbol_regex_validation_invalid(self):
        """Test that symbols with special chars or spaces fail validation."""
        invalid_symbols = ["AAPL$", "GOOG L", "MSFT!", ""]
        for sym in invalid_symbols:
            company = CompanySearch(symbol=sym, name="Test")
            with pytest.raises(ValidationError):
                company.full_clean()

    def test_04_increment_search_count(self):
        """Test the custom increment method updates count and timestamp."""
        company = CompanySearch.objects.create(symbol="MSFT", name="Microsoft")
        initial_time = company.last_searched
        
        company.increment_search_count()
        company.refresh_from_db()
        
        assert company.search_count == 1
        assert company.last_searched >= initial_time

    def test_05_get_popular_searches(self):
        """Test retrieving top searches ordered by count."""
        CompanySearch.objects.create(symbol="A", name="A", search_count=10)
        CompanySearch.objects.create(symbol="B", name="B", search_count=50)
        CompanySearch.objects.create(symbol="C", name="C", search_count=5)
        
        popular = CompanySearch.get_popular_searches(limit=2)
        assert len(popular) == 2
        assert popular[0].symbol == "B"  # Highest count first
        assert popular[1].symbol == "A"

    def test_06_cleanup_old_searches(self):
        """Test deactivating old, infrequently searched records."""
        old_date = timezone.now() - timezone.timedelta(days=400)
        
        # Create an old record manually
        old_obj = CompanySearch.objects.create(symbol="OLD", name="Old")
        CompanySearch.objects.filter(pk=old_obj.pk).update(last_searched=old_date, search_count=1)
        
        # Create a fresh record
        active_obj = CompanySearch.objects.create(symbol="NEW", name="New")
        
        count = CompanySearch.cleanup_old_searches(days_old=365)
        
        old_obj.refresh_from_db()
        active_obj.refresh_from_db()
        
        assert count == 1
        assert old_obj.is_active is False
        assert active_obj.is_active is True

    def test_07_days_since_last_search(self):
        """Test the days_since_last_search property calculation."""
        company = CompanySearch.objects.create(symbol="TEST", name="Test")
        past = timezone.now() - timezone.timedelta(days=5)
        CompanySearch.objects.filter(pk=company.pk).update(last_searched=past)
        company.refresh_from_db()
        
        assert company.days_since_last_search == 5


class TestFinancialStatementCacheModel:
    def test_08_default_expiration(self):
        """Test that a new cache gets a default expiration date (24h)."""
        cache = FinancialStatementCache.objects.create(
            symbol="MSFT", statement_type="balance_sheet", period="2023-01-01", data={}
        )
        assert cache.expires_at is not None
        assert cache.expires_at > timezone.now()

    def test_09_is_expired_logic(self):
        """Test is_expired returns True for past dates."""
        past = timezone.now() - timezone.timedelta(minutes=1)
        cache = FinancialStatementCache.objects.create(
            symbol="EXP", statement_type="bs", period="2022-01-01", 
            data={}, expires_at=past
        )
        assert cache.is_expired is True
        assert cache.should_refresh is True

    def test_10_mark_invalid(self):
        """Test manual invalidation."""
        cache = FinancialStatementCache.objects.create(
            symbol="VAL", statement_type="bs", period="2022-01-01", data={}
        )
        assert cache.is_valid is True
        cache.mark_invalid()
        assert cache.is_valid is False

    def test_11_get_latest_cached_data(self):
        """Test fetching the most recent valid cache entry."""
        # Older entry
        FinancialStatementCache.objects.create(
            symbol="TEST", statement_type="bs", period="2020-01-01", data={"v": 1}
        )
        # Newer entry
        FinancialStatementCache.objects.create(
            symbol="TEST", statement_type="bs", period="2021-01-01", data={"v": 2}
        )
        
        latest = FinancialStatementCache.get_latest_cached_data("TEST", "bs")
        assert latest.data['v'] == 2

    def test_12_signal_updates_company_refresh(self):
        """Test that saving cache updates the parent CompanySearch last_refresh."""
        company = CompanySearch.objects.create(symbol="SIG", name="Signal Test")
        assert company.last_data_refresh is None
        
        FinancialStatementCache.objects.create(
            symbol="SIG", statement_type="bs", period="2023-01-01", data={}
        )
        
        company.refresh_from_db()
        assert company.last_data_refresh is not None

    def test_13_cache_should_refresh_false(self):
        """Valid, not expired cache should not need refresh."""
        cache = FinancialStatementCache.objects.create(
            symbol="FRESH", statement_type="bs", period="2024-01-01", data={}
        )
        assert cache.is_expired is False
        assert cache.is_valid is True
        assert cache.should_refresh is False

    def test_14_cache_should_refresh_invalid(self):
        """Invalidated cache (not expired) should refresh."""
        cache = FinancialStatementCache.objects.create(
            symbol="INVAL", statement_type="bs", period="2024-02-01", data={}
        )
        cache.mark_invalid()
        cache.refresh_from_db()
        assert cache.is_expired is False
        assert cache.is_valid is False
        assert cache.should_refresh is True

    def test_15_get_latest_skips_expired_newer(self):
        """Ensure expired newer entry is skipped in favor of older valid one."""
        older = FinancialStatementCache.objects.create(
            symbol="SKIP", statement_type="bs", period="2023-01-01", data={"v": 1}
        )
        past = timezone.now() - timezone.timedelta(hours=1)
        FinancialStatementCache.objects.create(
            symbol="SKIP", statement_type="bs", period="2024-01-01", data={"v": 2}, expires_at=past
        )
        latest = FinancialStatementCache.get_latest_cached_data("SKIP", "bs")
        # Some Django conversions may return str vs date objects in test env; compare string forms
        assert str(latest.period) == str(older.period)
        assert latest.data["v"] == 1

    def test_16_cleanup_expired_entries(self):
        """Expired and old entries become invalid or deleted; counts add up."""
        # expired & old
        expired_old = FinancialStatementCache.objects.create(
            symbol="OLD1", statement_type="bs", period="2022-01-01", data={}, expires_at=timezone.now() - timezone.timedelta(days=1)
        )
        # unexpired but old (set future expiration) - will be deleted due to old last_updated
        old_unexpired = FinancialStatementCache.objects.create(
            symbol="OLD2", statement_type="bs", period="2022-02-01", data={}, expires_at=timezone.now() + timezone.timedelta(days=10)
        )
        # Make their last_updated older than 30 days
        thirty_one_days = timezone.now() - timezone.timedelta(days=31)
        FinancialStatementCache.objects.filter(pk__in=[expired_old.pk, old_unexpired.pk]).update(last_updated=thirty_one_days)
        result_count = FinancialStatementCache.cleanup_expired_entries()
        # expired_count=1 (OLD1), deleted_count=2 (both old entries) => total 3
        assert result_count == 3
        assert FinancialStatementCache.objects.filter(symbol__in=["OLD1", "OLD2"]).count() == 0

    def test_17_invalidate_symbol_cache(self):
        """Invalidate all cache entries for a symbol."""
        FinancialStatementCache.objects.create(symbol="INV", statement_type="bs", period="2023-01-01", data={})
        FinancialStatementCache.objects.create(symbol="INV", statement_type="income_statement", period="2023-01-01", data={})
        count = FinancialStatementCache.invalidate_symbol_cache("INV")
        assert count == 2
        assert FinancialStatementCache.objects.filter(symbol="INV", is_valid=False).count() == 2

    def test_18_signal_no_company_entry(self):
        """Creating cache for symbol without CompanySearch should silently pass."""
        FinancialStatementCache.objects.create(symbol="NOSYM", statement_type="bs", period="2024-03-01", data={})
        assert CompanySearch.objects.filter(symbol="NOSYM").exists() is False

    def test_19_api_usage_log_str(self):
        """APIUsageLog __str__ formatting."""
        log = APIUsageLog.objects.create(endpoint="/api/test", symbol="AAPL", status_code=200, response_time=12.3)
        assert "/api/test" in str(log)
        assert "AAPL" in str(log)
        assert "200" in str(log)

    def test_20_company_cleanup_threshold(self):
        """Company with search_count >=5 should not deactivate during cleanup."""
        old_date = timezone.now() - timezone.timedelta(days=400)
        active_company = CompanySearch.objects.create(symbol="THRESH", name="Threshold", search_count=5)
        CompanySearch.objects.filter(pk=active_company.pk).update(last_searched=old_date)
        CompanySearch.cleanup_old_searches(days_old=365)
        active_company.refresh_from_db()
        assert active_company.is_active is True

    def test_21_financial_statement_cache_str(self):
        """Cover __str__ for FinancialStatementCache."""
        # Use a valid choice value so display label renders
        cache = FinancialStatementCache.objects.create(
            symbol="STR", statement_type="balance_sheet", period="2024-05-01", data={}
        )
        rep = str(cache)
        # Accept either verbose label or raw choice (defensive if choices altered)
        assert "STR" in rep and "2024-05-01" in rep
        assert ("Balance Sheet" in rep) or ("balance_sheet" in rep) or ("bs" in rep)

    def test_22_expiration_preserved_when_provided(self):
        """If expires_at provided explicitly, save() must not override it."""
        custom_expiry = timezone.now() + timezone.timedelta(hours=6)
        cache = FinancialStatementCache.objects.create(
            symbol="MANUAL", statement_type="balance_sheet", period="2024-06-01", data={}, expires_at=custom_expiry
        )
        assert abs((cache.expires_at - custom_expiry).total_seconds()) < 1, "expires_at overridden unexpectedly"