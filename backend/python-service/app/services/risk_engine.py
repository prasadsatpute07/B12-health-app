"""
B12 Deficiency Risk Engine — Rule-Based Scoring
================================================
Mirrors riskCalculator.js from the React Native app exactly.

Scoring algorithm:
  1. For each answer: weighted_score = answer.score × question.weight
  2. raw_score = sum of all weighted_scores
  3. normalized_score = (raw_score / max_possible_score) × 100
  4. Risk level: Low < 35% | Medium 35–65% | High > 65%

Data is stored in PostgreSQL for future ML model training.
"""

from typing import List, Dict, Tuple
from app.schemas.schemas import AnswerItem, ProfileInput

# ── Answer score lookup ──────────────────────────────────────────────────────
# Keyed by question_id → { answer_value: score }
# Populated from the questions_seed.sql in the questions table.
# In production this is fetched from DB; here it mirrors the seed as a fallback.

QUESTION_WEIGHTS: Dict[int, float] = {
    1: 2.0, 2: 1.5, 3: 1.8, 4: 2.0, 5: 1.8, 6: 1.6, 7: 1.5,
    8: 1.4, 9: 2.0, 10: 1.6, 11: 1.8, 12: 1.2, 13: 2.0, 14: 2.0,
    15: 2.5, 16: 2.5, 17: 1.5, 18: 2.2, 19: 2.5, 20: 1.6, 21: 1.8,
    22: 1.4, 23: 1.2, 24: 1.3, 25: 1.1,
}

QUESTION_CATEGORIES: Dict[int, str] = {
    1: "diet", 2: "diet", 3: "energy", 4: "neurological", 5: "neurological",
    6: "energy", 7: "psychological", 8: "digestive", 9: "energy", 10: "digestive",
    11: "diet", 12: "lifestyle", 13: "lifestyle", 14: "lifestyle", 15: "lifestyle",
    16: "lifestyle", 17: "diet", 18: "neurological", 19: "neurological",
    20: "energy", 21: "lifestyle", 22: "lifestyle", 23: "lifestyle",
    24: "psychological", 25: "lifestyle",
}

ANSWER_SCORES: Dict[int, Dict[str, float]] = {
    1: {"daily": 0, "few_week": 1, "rarely": 3, "never": 4},
    2: {"yes_regular": 0, "yes_occasional": 1, "no": 4},
    3: {"never": 0, "sometimes": 1, "often": 3, "always": 4},
    4: {"never": 0, "occasionally": 1, "frequently": 3, "daily": 4},
    5: {"never": 0, "occasionally": 1, "frequently": 3, "very_often": 4},
    6: {"never": 0, "rarely": 1, "sometimes": 2, "frequently": 4},
    7: {"positive": 0, "occasional_low": 1, "frequent_low": 3, "persistent_low": 4},
    8: {"never": 0, "occasionally": 1, "frequently": 3, "always": 4},
    9: {"no": 0, "past": 2, "current": 4},
    10: {"no": 0, "occasionally": 2, "yes": 4},
    11: {"no": 0, "vegetarian": 1, "vegan_fortified": 2, "strict_vegan": 4},
    12: {"never": 0, "occasionally": 1, "often": 3, "daily": 4},
    13: {"no": 0, "planning": 1, "pregnant": 3, "breastfeeding": 3},
    14: {"no": 0, "occasionally": 1, "yes_one": 3, "yes_both": 4},
    15: {"no": 0, "minor": 1, "major": 4},
    16: {"no": 0, "suspected": 2, "yes": 4},
    17: {"yes": 0, "diet_focused": 1, "no_supplement_some": 3, "no_supplement_none": 4},
    18: {"no": 0, "occasionally": 2, "frequently": 4},
    19: {"no": 0, "some": 1, "noticeable": 3, "significant": 4},
    20: {"no": 0, "moderate": 1, "heavy": 3},
    21: {"no": 0, "over_6mo": 1, "recent": 3},
    22: {"no": 0, "low": 1, "moderate": 2, "daily": 4},
    23: {"no": 0, "recreational": 0, "high_intensity": 1, "professional": 2},
    24: {"low": 0, "moderate": 1, "high": 3, "very_high": 4},
    25: {"optimal": 0, "slightly_less": 1, "less": 2, "very_less": 4},
}

MAX_OPTION_SCORES: Dict[int, float] = {
    1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4, 10: 4,
    11: 4, 12: 4, 13: 3, 14: 4, 15: 4, 16: 4, 17: 4, 18: 4, 19: 4,
    20: 3, 21: 3, 22: 4, 23: 2, 24: 4, 25: 4,
}

# Risk level thresholds (matching riskCalculator.js)
THRESHOLD_LOW = 35.0
THRESHOLD_HIGH = 65.0


def get_risk_level(percentage: float) -> str:
    if percentage < THRESHOLD_LOW:
        return "low"
    elif percentage <= THRESHOLD_HIGH:
        return "medium"
    return "high"


def get_suggestions(risk_level: str, breakdown: Dict[str, float], profile: ProfileInput) -> List[str]:
    suggestions = []

    if risk_level == "high":
        suggestions.append("⚠️ Consult a healthcare provider and request a serum B12 blood test.")
        suggestions.append("Consider starting a B12 supplement (1000mcg cyanocobalamin daily).")
    elif risk_level == "medium":
        suggestions.append("Consider taking a regular Vitamin B12 supplement.")

    if breakdown.get("diet", 0) >= 40:
        suggestions.append("Include more B12-rich foods: eggs, dairy, fish, or fortified plant milks.")
    if breakdown.get("neurological", 0) >= 50:
        suggestions.append("Neurological symptoms can be early signs of B12 deficiency. Discuss with a doctor.")
    if breakdown.get("energy", 0) >= 50:
        suggestions.append("Persistent fatigue and weakness are core B12 deficiency indicators.")
    if breakdown.get("digestive", 0) >= 50:
        suggestions.append("Digestive issues can impair B12 absorption — consider sublingual supplements.")

    if profile.diet_type == "vegan":
        suggestions.append("As a vegan, B12 supplementation is essential. Look for B12-fortified foods daily.")
    if profile.diet_type == "vegetarian":
        suggestions.append("Vegetarians may absorb less B12 — regular supplementation is recommended.")
    if profile.takes_metformin:
        suggestions.append("Metformin can deplete B12 levels. Ask your doctor to monitor your B12 annually.")
    if profile.has_pernicious_anemia or profile.has_crohns_celiac:
        suggestions.append("Your medical condition significantly affects B12 absorption — discuss B12 injections with your doctor.")

    # Deduplicate and limit
    seen = set()
    unique = []
    for s in suggestions:
        if s not in seen:
            seen.add(s)
            unique.append(s)

    return unique[:5]  # Return max 5 suggestions


def calculate_score(
    answers: List[AnswerItem],
    profile: ProfileInput,
) -> dict:
    """
    Main scoring function. Returns the full scoring result dict.
    """
    raw_score = 0.0
    max_possible_score = 0.0
    category_totals: Dict[str, float] = {}
    category_max: Dict[str, float] = {}

    for answer in answers:
        qid = answer.question_id
        val = answer.answer_value

        weight = QUESTION_WEIGHTS.get(qid, 1.0)
        answer_score = ANSWER_SCORES.get(qid, {}).get(val, 0)
        max_answer_score = MAX_OPTION_SCORES.get(qid, 4)
        category = QUESTION_CATEGORIES.get(qid, "other")

        weighted = answer_score * weight
        max_weighted = max_answer_score * weight

        raw_score += weighted
        max_possible_score += max_weighted

        category_totals[category] = category_totals.get(category, 0.0) + weighted
        category_max[category] = category_max.get(category, 0.0) + max_weighted

    # Normalize overall score
    normalized = (raw_score / max_possible_score * 100) if max_possible_score > 0 else 0.0

    # Category breakdown as percentage
    breakdown: Dict[str, float] = {}
    for cat, total in category_totals.items():
        max_cat = category_max.get(cat, 1)
        breakdown[cat] = round((total / max_cat) * 100, 1) if max_cat > 0 else 0.0

    risk_level = get_risk_level(normalized)
    suggestions = get_suggestions(risk_level, breakdown, profile)

    return {
        "raw_score": round(raw_score, 2),
        "max_possible_score": round(max_possible_score, 2),
        "normalized_score": round(normalized, 2),
        "percentage": round(normalized, 2),
        "risk_level": risk_level,
        "breakdown": breakdown,
        "suggestions": suggestions,
    }
