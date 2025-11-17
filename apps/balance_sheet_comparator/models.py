from django.db import models
import uuid
import json
from typing import Dict, Any, List


class BalanceSheetComparison(models.Model):
    comparison_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company1_name = models.CharField(max_length=255, default="Company 1")
    company2_name = models.CharField(max_length=255, default="Company 2")
    
    # Store comparison results as JSON
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

    def get_comparison_result(self) -> Dict[str, Any]:
        """Convert comparison_result to Python dict with safe defaults"""
        if isinstance(self.comparison_result, dict):
            return self.comparison_result
        try:
            if isinstance(self.comparison_result, str):
                return json.loads(self.comparison_result)
            return self.comparison_result
        except (json.JSONDecodeError, TypeError, ValueError):
            return {}

    def get_company1_metrics(self) -> Dict[str, Any]:
        """Get company 1 metrics as dict"""
        if isinstance(self.company1_metrics, dict):
            return self.company1_metrics
        try:
            if isinstance(self.company1_metrics, str):
                return json.loads(self.company1_metrics)
            return self.company1_metrics
        except (json.JSONDecodeError, TypeError, ValueError):
            return {}

    def get_company2_metrics(self) -> Dict[str, Any]:
        """Get company 2 metrics as dict"""
        if isinstance(self.company2_metrics, dict):
            return self.company2_metrics
        try:
            if isinstance(self.company2_metrics, str):
                return json.loads(self.company2_metrics)
            return self.company2_metrics
        except (json.JSONDecodeError, TypeError, ValueError):
            return {}

    def get_evaluation(self) -> Dict[str, Any]:
        """Get evaluation as dict"""
        if isinstance(self.evaluation, dict):
            return self.evaluation
        try:
            if isinstance(self.evaluation, str):
                return json.loads(self.evaluation)
            return self.evaluation
        except (json.JSONDecodeError, TypeError, ValueError):
            return {}

    def set_comparison_result(self, data: Dict[str, Any]) -> None:
        """Set comparison result data"""
        self.comparison_result = data if isinstance(data, dict) else {}

    def set_company1_metrics(self, data: Dict[str, Any]) -> None:
        """Set company 1 metrics"""
        self.company1_metrics = data if isinstance(data, dict) else {}

    def set_company2_metrics(self, data: Dict[str, Any]) -> None:
        """Set company 2 metrics"""
        self.company2_metrics = data if isinstance(data, dict) else {}

    def set_evaluation(self, data: Dict[str, Any]) -> None:
        """Set evaluation data"""
        self.evaluation = data if isinstance(data, dict) else {}

    def __str__(self):
        return f"{self.company1_name} vs {self.company2_name} - {self.created_at.strftime('%Y-%m-%d')}"
