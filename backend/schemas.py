from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import date, datetime

class AnalysisStartRequest(BaseModel):
    cognito_id: str
    purpose: str
    medications: Optional[List[str]] = []

class NutrientGapResponse(BaseModel):
    nutrient_id: int
    name_ko: Optional[str] = None
    name_en: Optional[str] = None
    unit: Optional[str] = None
    current_amount: Optional[int] = None
    max_amount: Optional[int] = None
    gap_amount: Optional[int] = None

class RecommendationResponse(BaseModel):
    rec_id: int
    product_id: int
    product_brand: str
    product_name: str
    serving_per_day: Optional[int] = None
    recommend_serving: Optional[int] = None
    rank: int
    nutrients: Dict[str, int]

class AnalysisResultResponse(BaseModel):
    result_id: int
    cognito_id: str
    status: str
    summary: Optional[Dict] = None
    nutrient_gaps: Optional[List[NutrientGapResponse]] = None
    created_at: datetime

class AnalysisHistoryItem(BaseModel):
    result_id: int
    created_at: datetime
    summary: Optional[Dict] = None
