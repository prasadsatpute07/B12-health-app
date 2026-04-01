from fastapi import APIRouter, HTTPException
from app.schemas.schemas import ScoreRequest, ScoreResponse
from app.services.risk_engine import calculate_score

router = APIRouter()

@router.post("/score", response_model=ScoreResponse)
def score_assessment(request: ScoreRequest):
    """
    Rule-based B12 deficiency risk scorer.
    Called internally by the Node.js API after questionnaire submission.
    All data is stored in PostgreSQL for future ML model training.
    """
    if not request.answers:
        raise HTTPException(status_code=400, detail="No answers provided")

    result = calculate_score(request.answers, request.profile)
    return ScoreResponse(**result)
