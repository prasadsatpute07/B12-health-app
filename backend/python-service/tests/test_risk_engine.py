"""
Pytest tests for the B12 Risk Scoring Engine
Run: cd d:\B12\backend-v2\python-service && pytest
"""
import pytest
from app.services.risk_engine import calculate_score, get_risk_level
from app.schemas.schemas import AnswerItem, ProfileInput


def make_profile(**kwargs):
    return ProfileInput(**kwargs)


def make_answers(pairs: dict) -> list:
    """pairs: {question_id: answer_value}"""
    return [AnswerItem(question_id=qid, answer_value=val) for qid, val in pairs.items()]


# ── Risk level threshold tests ──────────────────────────────────────────────

def test_risk_low():
    assert get_risk_level(20.0) == "low"
    assert get_risk_level(34.9) == "low"

def test_risk_medium():
    assert get_risk_level(35.0) == "medium"
    assert get_risk_level(65.0) == "medium"

def test_risk_high():
    assert get_risk_level(65.1) == "high"
    assert get_risk_level(100.0) == "high"


# ── Scoring engine tests ─────────────────────────────────────────────────────

def test_all_best_answers_gives_low_risk():
    """Selecting the healthiest answer for every question should produce LOW risk."""
    best_answers = {
        1: "daily", 2: "yes_regular", 3: "never", 4: "never", 5: "never",
        6: "never", 7: "positive", 8: "never", 9: "no", 10: "no",
    }
    profile = make_profile(diet_type="omnivore", diet_penalty=0)
    result = calculate_score(make_answers(best_answers), profile)

    assert result["risk_level"] == "low"
    assert result["normalized_score"] == 0.0
    assert result["percentage"] == 0.0


def test_all_worst_answers_gives_high_risk():
    """Selecting the worst answer for every question should produce HIGH risk."""
    worst_answers = {
        1: "never", 2: "no", 3: "always", 4: "daily", 5: "very_often",
        6: "frequently", 7: "persistent_low", 8: "always", 9: "current", 10: "yes",
    }
    profile = make_profile(diet_type="vegan", diet_penalty=12)
    result = calculate_score(make_answers(worst_answers), profile)

    assert result["risk_level"] == "high"
    assert result["normalized_score"] > 65.0


def test_vegan_diet_reflected_in_suggestions():
    """Vegan profile should include supplement advice in suggestions."""
    answers = {1: "never", 2: "no", 3: "often"}
    profile = make_profile(diet_type="vegan", diet_penalty=12)
    result = calculate_score(make_answers(answers), profile)

    suggestion_text = " ".join(result["suggestions"]).lower()
    assert "vegan" in suggestion_text or "supplement" in suggestion_text


def test_metformin_user_gets_specialist_suggestion():
    """Metformin user should get a monitoring suggestion."""
    answers = {1: "rarely", 2: "no", 3: "often", 9: "current"}
    profile = make_profile(
        diet_type="omnivore",
        diet_penalty=0,
        takes_metformin=True,
    )
    result = calculate_score(make_answers(answers), profile)
    suggestion_text = " ".join(result["suggestions"]).lower()
    assert "metformin" in suggestion_text


def test_category_breakdown_keys():
    """Category breakdown should contain expected keys."""
    answers = {1: "daily", 3: "never", 4: "never", 7: "positive", 8: "never"}
    profile = make_profile()
    result = calculate_score(make_answers(answers), profile)

    for cat in result["breakdown"]:
        assert isinstance(result["breakdown"][cat], float)


def test_score_deterministic():
    """Same inputs should always produce the same score."""
    answers = {1: "rarely", 2: "no", 3: "often", 4: "occasionally"}
    profile = make_profile(diet_type="vegetarian", diet_penalty=8)
    r1 = calculate_score(make_answers(answers), profile)
    r2 = calculate_score(make_answers(answers), profile)
    assert r1["normalized_score"] == r2["normalized_score"]


# ── Trend analyzer tests ─────────────────────────────────────────────────────

from app.services.trend_analyzer import analyze_trends
from app.schemas.schemas import CheckinLog


def test_empty_logs():
    result = analyze_trends([])
    assert result.days_analyzed == 0
    assert result.trends == []
    assert result.pattern_alerts == []


def test_high_fatigue_alert():
    """3+ days of high fatigue should trigger a pattern alert."""
    logs = [
        CheckinLog(checkin_date=f"2026-03-2{i}", energy_score=2,
                   fatigue_score=4, mood_score=2, sleep_score=2, focus_score=2)
        for i in range(3, 7)
    ]
    result = analyze_trends(logs)
    alerts_text = " ".join(result.pattern_alerts).lower()
    assert "fatigue" in alerts_text


def test_trend_direction_improving():
    """When scores go from 0→4 over days, direction should be improving."""
    logs = [
        CheckinLog(checkin_date=f"2026-03-2{i}", energy_score=i,
                   fatigue_score=1, mood_score=i, sleep_score=i, focus_score=i)
        for i in range(0, 4)
    ]
    result = analyze_trends(logs)
    energy_trend = next((t for t in result.trends if t.metric == "Energy"), None)
    assert energy_trend is not None
    assert energy_trend.direction == "improving"
