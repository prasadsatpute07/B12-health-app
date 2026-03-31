"""
Symptom Trend Analyzer
======================
Analyzes daily check-in logs to produce:
- 7-day metric trend lines
- Direction: improving / declining / stable
- Pattern alerts (e.g., "fatigue reported 3+ days")
Mirrors WeeklyProgressScreen.js pattern detection logic.
"""

from typing import List, Dict
from app.schemas.schemas import CheckinLog, MetricTrend, TrendsResponse

METRICS = ["energy_score", "fatigue_score", "mood_score", "sleep_score", "focus_score"]
METRIC_LABELS = {
    "energy_score": "Energy",
    "fatigue_score": "Fatigue",
    "mood_score": "Mood",
    "sleep_score": "Sleep",
    "focus_score": "Focus",
}


def _direction(values: List[float]) -> str:
    """Simple linear trend direction from a list of values."""
    if len(values) < 2:
        return "stable"
    first_half = sum(values[:len(values)//2]) / (len(values)//2)
    second_half = sum(values[len(values)//2:]) / (len(values) - len(values)//2)
    diff = second_half - first_half
    if diff > 0.3:
        return "improving"
    elif diff < -0.3:
        return "declining"
    return "stable"


def analyze_trends(logs: List[CheckinLog]) -> TrendsResponse:
    if not logs:
        return TrendsResponse(trends=[], pattern_alerts=[], days_analyzed=0)

    # Sort by date
    sorted_logs = sorted(logs, key=lambda l: l.checkin_date)
    n = len(sorted_logs)

    trends: List[MetricTrend] = []
    pattern_alerts: List[str] = []

    for metric in METRICS:
        values = [float(getattr(log, metric)) for log in sorted_logs]
        avg = sum(values) / len(values) if values else 0
        direction = _direction(values)

        trends.append(MetricTrend(
            metric=METRIC_LABELS[metric],
            values=values,
            average=round(avg, 2),
            direction=direction,
        ))

    # Pattern alerts (matching WeeklyProgressScreen.js)
    fatigue_values = [getattr(log, "fatigue_score") for log in sorted_logs]
    high_fatigue_count = sum(1 for v in fatigue_values if v >= 3)
    if high_fatigue_count >= 3:
        pattern_alerts.append(f"⚠️ Fatigue reported highly {high_fatigue_count} of last {n} days")

    energy_values = [getattr(log, "energy_score") for log in sorted_logs]
    avg_energy = sum(energy_values) / len(energy_values) if energy_values else 0
    if avg_energy < 1.5:
        pattern_alerts.append(f"⚡ Low average energy ({avg_energy:.1f}/4) this period")

    sleep_values = [getattr(log, "sleep_score") for log in sorted_logs]
    poor_sleep_count = sum(1 for v in sleep_values if v <= 1)
    if poor_sleep_count >= 3:
        pattern_alerts.append(f"😴 Poor sleep {poor_sleep_count} of last {n} days")

    mood_values = [getattr(log, "mood_score") for log in sorted_logs]
    low_mood_count = sum(1 for v in mood_values if v <= 1)
    if low_mood_count >= 3:
        pattern_alerts.append(f"🧠 Low mood reported {low_mood_count} of last {n} days")

    return TrendsResponse(
        trends=trends,
        pattern_alerts=pattern_alerts,
        days_analyzed=n,
    )
