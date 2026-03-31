from fastapi import APIRouter
from app.schemas.schemas import TrendsRequest, TrendsResponse
from app.services.trend_analyzer import analyze_trends

router = APIRouter()

@router.post("/trends", response_model=TrendsResponse)
def get_trends(request: TrendsRequest):
    """
    Analyze daily check-in logs to produce 7-day trend data.
    Returns per-metric averages, directions, and pattern alerts
    (matching WeeklyProgressScreen.js logic).
    """
    return analyze_trends(request.logs)
