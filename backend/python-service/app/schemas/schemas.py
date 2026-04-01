from pydantic import BaseModel
from typing import List, Optional, Dict, Any

# ─── Scoring Request / Response ─────────────────────

class AnswerItem(BaseModel):
    question_id: int
    answer_value: str

class ProfileInput(BaseModel):
    age_group: str = "all"
    gender: str = "all"
    diet_type: str = "omnivore"
    diet_penalty: int = 0
    has_pernicious_anemia: bool = False
    has_crohns_celiac: bool = False
    has_gastric_surgery: bool = False
    takes_metformin: bool = False
    takes_ppi: bool = False

class ScoreRequest(BaseModel):
    answers: List[AnswerItem]
    profile: ProfileInput

class ScoreResponse(BaseModel):
    raw_score: float
    max_possible_score: float
    normalized_score: float
    percentage: float
    risk_level: str          # 'low' | 'medium' | 'high'
    breakdown: Dict[str, float]
    suggestions: List[str]

# ─── Trends Request / Response ──────────────────────

class CheckinLog(BaseModel):
    checkin_date: str
    energy_score: int
    fatigue_score: int
    mood_score: int
    sleep_score: int
    focus_score: int
    total_score: Optional[int] = None

class TrendsRequest(BaseModel):
    logs: List[CheckinLog]

class MetricTrend(BaseModel):
    metric: str
    values: List[float]
    average: float
    direction: str           # 'improving' | 'declining' | 'stable'

class TrendsResponse(BaseModel):
    trends: List[MetricTrend]
    pattern_alerts: List[str]
    days_analyzed: int
