# schemas.py
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from enum import Enum

class TimePeriod(str, Enum):
    QUARTERLY = "quarterly"
    YEARLY = "yearly"

class FinancialItem(BaseModel):
    item_name: str = Field(..., description="Name of the financial metric")
    values: Dict[str, float] = Field(..., description="Values for different time periods")
    unit: str = Field(..., description="Currency unit")
    time_period: TimePeriod = Field(..., description="Quarterly or yearly data")

class CompanyTrends(BaseModel):
    revenue_trend: str = Field(..., description="Analysis of revenue growth/decline")
    profitability_trend: str = Field(..., description="Analysis of profit margins")
    liquidity_trend: str = Field(..., description="Analysis of cash flow and liquidity")
    efficiency_trend: str = Field(..., description="Analysis of operational efficiency")
    risk_factors: List[str] = Field(..., description="Key risk factors identified")
    growth_opportunities: List[str] = Field(..., description="Potential growth opportunities")
    overall_assessment: str = Field(..., description="Overall company health assessment")
    recommendation: str = Field(..., description="Investment/business recommendation")

class FinancialSummary(BaseModel):
    company_name: str = Field(..., description="Name of the company")
    ticker_symbol: Optional[str] = Field(None, description="Stock ticker symbol if available")
    analysis_period: str = Field(..., description="Time period covered by analysis")
    key_metrics: Dict[str, Any] = Field(..., description="Key financial metrics")
    trends: CompanyTrends = Field(..., description="Detailed trend analysis")
    confidence_score: float = Field(..., description="Confidence in analysis (0-1)")