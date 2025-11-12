from django.db import models
import uuid
import json
from typing import Dict, List, Any

class FinancialReport(models.Model):
    report_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company_name = models.CharField(max_length=255, default="Unknown Company")
    ticker_symbol = models.CharField(max_length=50, blank=True, default="")
    summary = models.JSONField(default=dict, blank=True)  # Changed to JSONField
    ratios = models.JSONField(default=list, blank=True)   # Changed to JSONField
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'financial_reports'
        ordering = ['-created_at']
        verbose_name = 'Financial Report'
        verbose_name_plural = 'Financial Reports'

    def get_summary(self) -> Dict[str, Any]:
        """Convert summary to Python dict with safe defaults"""
        if isinstance(self.summary, dict):
            return self.summary
        
        try:
            if isinstance(self.summary, str):
                return json.loads(self.summary)
            return self.summary
        except (json.JSONDecodeError, TypeError, ValueError):
            return {"pros": [], "cons": [], "financial_health_summary": ""}

    def get_ratios(self) -> List[Dict[str, Any]]:
        """Convert ratios to Python list with safe defaults"""
        if isinstance(self.ratios, list):
            return self.ratios
        
        try:
            if isinstance(self.ratios, str):
                return json.loads(self.ratios)
            return self.ratios
        except (json.JSONDecodeError, TypeError, ValueError):
            return []

    def set_summary(self, data: Dict[str, Any]) -> None:
        """Set summary data with validation"""
        if isinstance(data, dict):
            # Ensure required structure
            default_structure = {"pros": [], "cons": [], "financial_health_summary": ""}
            self.summary = {**default_structure, **data}
        else:
            self.summary = {"pros": [], "cons": [], "financial_health_summary": ""}

    def set_ratios(self, data: List[Dict[str, Any]]) -> None:
        """Set ratios data with validation"""
        if isinstance(data, list):
            self.ratios = data
        else:
            self.ratios = []

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

    def __str__(self):
        symbol = f" ({self.ticker_symbol})" if self.ticker_symbol else ""
        return f"{self.company_name}{symbol} - {self.created_at.strftime('%Y-%m-%d')}"