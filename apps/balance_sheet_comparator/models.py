from django.db import models
import uuid
import json
from typing import Dict, Any, List


class BalanceSheetComparison(models.Model):
    comparison_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company1_name = models.CharField(max_length=255, default="Company 1")
    company2_name = models.CharField(max_length=255, default="Company 2")
    
    # Store Comparison results as JSON
    comparison_result = models.JSONField(default=dict, blank=True)  # Detailed comparison data
    company1_metrics = models.JSONField(default=dict, blank=True)   # Company 1 financial metrics
    company2_metrics = models.JSONField(default=dict, blank=True)   # Company 2 financial metrics
    evaluation = models.JSONField(default=dict, blank=True)         # Which company is better
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'balance_sheet_comparisons'
        ordering = ['-created_at']
        verbose_name = 'Balance Sheet Comparison'
        verbose_name_plural = 'Balance Sheet Comparisons'

    def __str__(self):
        return f"{self.company1_name} vs {self.company2_name} ({self.created_at.strftime('%Y-%m-%d')})"
