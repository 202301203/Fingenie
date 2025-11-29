# dataprocessor/models.py
from django.db import models
import uuid
import json
from typing import Dict, List, Any
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.accounts.models import UserActivity  # Add this import


class FinancialReport(models.Model):
    report_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company_name = models.CharField(max_length=255, default="Unknown Company")
    ticker_symbol = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        default=""
    )
    
    # Add user relationship - CRITICAL FOR PROFILE INTEGRATION
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='financial_reports',
        null=True,  # Allow null for existing reports
        blank=True
    )
    
    # Add file upload field for balance sheet PDFs
    uploaded_pdf = models.FileField(
        upload_to='balance_sheets/', 
        blank=True, 
        null=True,
        help_text="Uploaded balance sheet PDF file"
    )
    pdf_original_name = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text="Original filename of the uploaded PDF"
    )
    
    summary = models.JSONField(default=dict, blank=True)
    ratios = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'financial_reports'
        ordering = ['-created_at']
        verbose_name = 'Financial Report'
        verbose_name_plural = 'Financial Reports'

    def get_summary(self) -> Dict[str, Any]:
        """Get summary data with safe defaults"""
        try:
            if isinstance(self.summary, dict):
                data = self.summary
            elif isinstance(self.summary, str):
                data = json.loads(self.summary)
            else:
                data = self.summary or {}
            
            # Ensure all required fields exist with proper types
            return {
                "pros": list(data.get("pros", [])),
                "cons": list(data.get("cons", [])),
                "financial_health_summary": str(data.get("financial_health_summary", ""))
            }
        except (json.JSONDecodeError, TypeError, ValueError) as e:
            print(f"Error parsing summary: {e}")
            return {
                "pros": [],
                "cons": [], 
                "financial_health_summary": "Summary not available"
            }

    def get_ratios(self) -> List[Dict[str, Any]]:
        """Get ratios data with safe defaults"""
        try:
            if isinstance(self.ratios, list):
                data = self.ratios
            elif isinstance(self.ratios, str):
                data = json.loads(self.ratios)
            else:
                data = self.ratios or []
            
            # Ensure each ratio has the proper structure
            validated_ratios = []
            for ratio in data:
                if isinstance(ratio, dict):
                    validated_ratios.append({
                        "ratio_name": str(ratio.get("ratio_name", "Unknown Ratio")),
                        "formula": str(ratio.get("formula", "")),
                        "calculation": str(ratio.get("calculation", "")),
                        "result": float(ratio.get("result", 0)) if ratio.get("result") is not None else 0,
                        "interpretation": str(ratio.get("interpretation", ""))
                    })
            return validated_ratios
            
        except (json.JSONDecodeError, TypeError, ValueError) as e:
            print(f"Error parsing ratios: {e}")
            return []

    def set_summary(self, data: Dict[str, Any]) -> None:
        """Set summary data with validation"""
        if isinstance(data, dict):
            # Ensure required structure exists
            default_structure = {
                "pros": data.get("pros", []),
                "cons": data.get("cons", []),
                "financial_health_summary": data.get("financial_health_summary", "")
            }
            self.summary = default_structure
        else:
            self.summary = {"pros": [], "cons": [], "financial_health_summary": ""}
        self.save()

    def set_ratios(self, data: List[Dict[str, Any]]) -> None:
        """Set ratios data with validation"""
        if isinstance(data, list):
            # Ensure each ratio has the expected structure
            validated_ratios = []
            for ratio in data:
                if isinstance(ratio, dict):
                    validated_ratios.append({
                        "ratio_name": ratio.get("ratio_name", "Unknown Ratio"),
                        "formula": ratio.get("formula", ""),
                        "calculation": ratio.get("calculation", ""),
                        "result": ratio.get("result", 0),
                        "interpretation": ratio.get("interpretation", "")
                    })
            self.ratios = validated_ratios
        else:
            self.ratios = []
        self.save()

    # Property accessors for convenience
    @property
    def pros(self) -> List[str]:
        """Quick access to pros"""
        return self.get_summary().get("pros", [])

    @property
    def cons(self) -> List[str]:
        """Quick access to cons"""
        return self.get_summary().get("cons", [])

    @property
    def financial_health_summary(self) -> str:
        """Quick access to financial health summary"""
        return self.get_summary().get("financial_health_summary", "")

    # New methods for profile integration
    @property
    def has_uploaded_pdf(self) -> bool:
        """Check if report has an uploaded PDF"""
        return bool(self.uploaded_pdf)
    
    @property
    def display_name(self) -> str:
        """Get display name for activity logs"""
        if self.ticker_symbol:
            return f"{self.company_name} ({self.ticker_symbol})"
        return self.company_name
    
    @property
    def time_ago(self) -> str:
        """Get human-readable time ago string"""
        from django.utils import timezone
        from django.utils.timesince import timesince
        
        now = timezone.now()
        diff = now - self.created_at
        
        if diff.days == 0:
            return "Today"
        elif diff.days == 1:
            return "Yesterday"
        elif diff.days < 7:
            return f"{diff.days} days ago"
        elif diff.days < 30:
            weeks = diff.days // 7
            return f"{weeks} week{'s' if weeks > 1 else ''} ago"
        else:
            return self.created_at.strftime('%b %d, %Y')

    def __str__(self):
        symbol = f" ({self.ticker_symbol})" if self.ticker_symbol else ""
        user_info = f" by {self.user.username}" if self.user else ""
        return f"{self.company_name}{symbol}{user_info} - {self.created_at.strftime('%Y-%m-%d')}"

    def to_api_response(self) -> Dict[str, Any]:
        """Convert model instance to API response format"""
        return {
            "success": True,
            "report_id": str(self.report_id),
            "company_name": self.company_name,
            "ticker_symbol": self.ticker_symbol or "",
            "user": self.user.username if self.user else None,
            "summary": self.get_summary(),
            "ratios": self.get_ratios(),
            "created_at": self.created_at.isoformat(),
            "time_ago": self.time_ago,
            "has_uploaded_pdf": self.has_uploaded_pdf,
            "uploaded_pdf_name": self.pdf_original_name,
        }


# ============================================
# ACTIVITY LOGGING SIGNAL
# ============================================

@receiver(post_save, sender=FinancialReport)
def create_analysis_activity(sender, instance, created, **kwargs):
    """
    Create activity log when a financial analysis is created
    """
    if created and instance.user:
        UserActivity.objects.create(
            user=instance.user,
            activity_type='analysis',
            title=f'Analyzed {instance.display_name}',
            description=f'Financial analysis completed for {instance.display_name}',
            content_type='analysis',
            object_id=instance.report_id
        )
        print(f"✅ Activity log created for financial analysis: {instance.display_name}")


# ============================================
# MIGRATION INSTRUCTIONS
# ============================================
"""
After adding these changes, run:

python manage.py makemigrations dataprocessor
python manage.py migrate

This will:
1. Add the user foreign key to FinancialReport
2. Add PDF upload fields
3. Create the activity logging signal
"""
