from django.db import models
from django.core.validators import MinLengthValidator, RegexValidator
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


class CompanySearch(models.Model):
    """
    Model to track company searches and their popularity
    """
    # Validators for symbol field
    symbol_validator = RegexValidator(
        regex=r'^[A-Z0-9.-]+$',
        message='Symbol can only contain uppercase letters, numbers, dots, and hyphens',
        code='invalid_symbol'
    )
    
    symbol = models.CharField(
        max_length=20,
        unique=True,
        validators=[
            MinLengthValidator(1),
            symbol_validator
        ],
        help_text="Stock ticker symbol (e.g., AAPL, MSFT)"
    )
    
    name = models.CharField(
        max_length=200,
        help_text="Full company name"
    )
    
    search_count = models.IntegerField(
        default=0,
        help_text="Number of times this company has been searched"
    )
    
    last_searched = models.DateTimeField(
        auto_now=True,
        help_text="Last time this company was searched"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this record was first created"
    )
    
    # Additional fields for enhanced functionality
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this company is still actively traded"
    )
    
    exchange = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Stock exchange (e.g., NASDAQ, NYSE)"
    )
    
    currency = models.CharField(
        max_length=10,
        default='USD',
        help_text="Trading currency"
    )
    
    last_data_refresh = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When financial data was last refreshed for this company"
    )
    
    class Meta:
        db_table = 'company_searches'
        ordering = ['-search_count', 'symbol']
        verbose_name = 'Company Search'
        verbose_name_plural = 'Company Searches'
        indexes = [
            models.Index(fields=['symbol']),
            models.Index(fields=['search_count']),
            models.Index(fields=['last_searched']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.symbol} - {self.name}"
    
    def increment_search_count(self):
        """Increment search count and update last_searched"""
        self.search_count += 1
        self.last_searched = timezone.now()
        self.save(update_fields=['search_count', 'last_searched'])
    
    @property
    def days_since_last_search(self):
        """Calculate days since last search"""
        if self.last_searched:
            return (timezone.now() - self.last_searched).days
        return None
    
    @classmethod
    def get_popular_searches(cls, limit=10):
        """Get most popular searches"""
        return cls.objects.filter(is_active=True).order_by('-search_count')[:limit]
    
    @classmethod
    def cleanup_old_searches(cls, days_old=365):
        """Mark old, infrequently searched companies as inactive"""
        cutoff_date = timezone.now() - timezone.timedelta(days=days_old)
        old_searches = cls.objects.filter(
            last_searched__lt=cutoff_date,
            search_count__lt=5,
            is_active=True
        )
        count = old_searches.update(is_active=False)
        logger.info(f"Marked {count} old searches as inactive")
        return count


class FinancialStatementCache(models.Model):
    """
    Model to cache financial statements for performance
    """
    # Statement type choices
    BALANCE_SHEET = 'balance_sheet'
    INCOME_STATEMENT = 'income_statement'
    CASH_FLOW = 'cash_flow'
    STATEMENT_TYPE_CHOICES = [
        (BALANCE_SHEET, 'Balance Sheet'),
        (INCOME_STATEMENT, 'Income Statement'),
        (CASH_FLOW, 'Cash Flow Statement'),
    ]
    
    # Validators
    symbol_validator = RegexValidator(
        regex=r'^[A-Z0-9.-]+$',
        message='Symbol can only contain uppercase letters, numbers, dots, and hyphens',
        code='invalid_symbol'
    )
    
    symbol = models.CharField(
        max_length=20,
        validators=[symbol_validator],
        help_text="Stock ticker symbol"
    )
    
    statement_type = models.CharField(
        max_length=50,
        choices=STATEMENT_TYPE_CHOICES,
        help_text="Type of financial statement"
    )
    
    period = models.DateField(
        help_text="Financial period/date for this statement"
    )
    
    data = models.JSONField(
        help_text="Complete financial data in JSON format"
    )
    
    last_updated = models.DateTimeField(
        auto_now=True,
        help_text="When this cache entry was last updated"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this cache entry was created"
    )
    
    # Cache management fields
    is_valid = models.BooleanField(
        default=True,
        help_text="Whether this cache entry is still valid"
    )
    
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this cache entry expires"
    )
    
    data_source = models.CharField(
        max_length=100,
        default='yfinance',
        help_text="Source of the financial data"
    )
    
    data_version = models.CharField(
        max_length=20,
        default='1.0',
        help_text="Version of data structure"
    )
    
    class Meta:
        db_table = 'financial_statement_cache'
        unique_together = ['symbol', 'statement_type', 'period']
        ordering = ['symbol', 'statement_type', '-period']
        verbose_name = 'Financial Statement Cache'
        verbose_name_plural = 'Financial Statement Caches'
        indexes = [
            models.Index(fields=['symbol', 'statement_type']),
            models.Index(fields=['symbol', 'statement_type', 'period']),
            models.Index(fields=['last_updated']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['is_valid']),
        ]
    
    def __str__(self):
        return f"{self.symbol} - {self.get_statement_type_display()} - {self.period}"
    
    def save(self, *args, **kwargs):
        """Override save to set expiration if not set"""
        if not self.expires_at:
            # Default expiration: 24 hours for financial data
            self.expires_at = timezone.now() + timezone.timedelta(hours=24)
        super().save(*args, **kwargs)
    
    @property
    def is_expired(self):
        """Check if cache entry has expired"""
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False
    
    @property
    def should_refresh(self):
        """Determine if data should be refreshed"""
        return not self.is_valid or self.is_expired
    
    def mark_invalid(self):
        """Mark cache entry as invalid"""
        self.is_valid = False
        self.save(update_fields=['is_valid'])
    
    @classmethod
    def get_latest_cached_data(cls, symbol, statement_type):
        """Get latest cached data for a symbol and statement type"""
        return cls.objects.filter(
            symbol=symbol,
            statement_type=statement_type,
            is_valid=True
        ).exclude(
            expires_at__lt=timezone.now()
        ).order_by('-period').first()
    
    @classmethod
    def cleanup_expired_entries(cls):
        """Remove or invalidate expired cache entries"""
        expired_count = cls.objects.filter(
            expires_at__lt=timezone.now()
        ).update(is_valid=False)
        
        # Optional: Actually delete very old entries
        old_cutoff = timezone.now() - timezone.timedelta(days=30)
        deleted_count, _ = cls.objects.filter(
            last_updated__lt=old_cutoff
        ).delete()
        
        logger.info(f"Invalidated {expired_count} expired cache entries, deleted {deleted_count} old entries")
        return expired_count + deleted_count
    
    @classmethod
    def invalidate_symbol_cache(cls, symbol):
        """Invalidate all cache entries for a symbol"""
        count = cls.objects.filter(symbol=symbol).update(is_valid=False)
        logger.info(f"Invalidated {count} cache entries for {symbol}")
        return count


# Optional: Additional model for API usage tracking
class APIUsageLog(models.Model):
    """
    Model to track API usage for analytics and rate limiting
    """
    endpoint = models.CharField(max_length=100)
    symbol = models.CharField(max_length=20, blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    response_time = models.FloatField(help_text="Response time in milliseconds")
    status_code = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'api_usage_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['endpoint']),
            models.Index(fields=['symbol']),
            models.Index(fields=['created_at']),
            models.Index(fields=['ip_address']),
        ]
    
    def __str__(self):
        return f"{self.endpoint} - {self.symbol} - {self.status_code}"


# Signal handlers for cache management
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=FinancialStatementCache)
def update_company_search_refresh_time(sender, instance, created, **kwargs):
    """
    Update the last_data_refresh time in CompanySearch when new cache is saved
    """
    if created:
        try:
            company_search = CompanySearch.objects.get(symbol=instance.symbol)
            company_search.last_data_refresh = timezone.now()
            company_search.save(update_fields=['last_data_refresh'])
        except CompanySearch.DoesNotExist:
            # CompanySearch entry might not exist yet, that's ok
            pass