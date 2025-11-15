from django.db import models
import uuid
import json
from typing import Dict, List, Any

class FinancialReport(models.Model):
    report_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company_name = models.CharField(max_length=255, default="Unknown Company")
    ticker_symbol = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        default=""
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
            self.summary = default_structure  # Fixed: use self.summary, not self.summary_data
        else:
            self.summary = {"pros": [], "cons": [], "financial_health_summary": ""}
        # Don't forget to save!
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
            self.ratios = validated_ratios  # Fixed: use self.ratios, not self.ratios_data
        else:
            self.ratios = []
        # Don't forget to save!
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

    def __str__(self):
        symbol = f" ({self.ticker_symbol})" if self.ticker_symbol else ""
        return f"{self.company_name}{symbol} - {self.created_at.strftime('%Y-%m-%d')}"

    def to_api_response(self) -> Dict[str, Any]:
        """Convert model instance to API response format"""
        return {
            "success": True,
            "report_id": str(self.report_id),
            "company_name": self.company_name,
            "ticker_symbol": self.ticker_symbol or "",
            "summary": self.get_summary(),
            "ratios": self.get_ratios(),
            "created_at": self.created_at.isoformat()
        }