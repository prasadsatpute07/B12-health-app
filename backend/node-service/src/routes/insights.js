const express = require('express');
const authMiddleware = require('../middleware/auth');
const Assessment = require('../models/Assessment');
const { DailyCheckin } = require('../models/DailyCheckin');
const { sendSuccess } = require('../utils/response');
const { Op } = require('sequelize');

const router = express.Router();
router.use(authMiddleware);

// ── GET /api/insights — Server-side personalized insights ──
// Based on latest assessment + 7-day check-in trend
router.get('/', async (req, res, next) => {
  try {
    const insights = [];

    // 1. Latest assessment insight
    const latest = await Assessment.findOne({
      where: { user_id: req.user.id },
      order: [['completed_at', 'DESC']],
    });

    if (latest) {
      if (latest.risk_level === 'high') {
        insights.push({
          type: 'risk_alert',
          priority: 'high',
          title: '⚠️ High B12 Deficiency Risk Detected',
          message: `Your last assessment scored ${latest.risk_percentage?.toFixed(0)}%. Consider consulting a healthcare provider and getting a blood test.`,
        });
      } else if (latest.risk_level === 'medium') {
        insights.push({
          type: 'risk_moderate',
          priority: 'medium',
          title: '🔶 Moderate Risk — Take Action',
          message: `Your score was ${latest.risk_percentage?.toFixed(0)}%. Small dietary changes can reduce your B12 risk significantly.`,
        });
      } else {
        insights.push({
          type: 'risk_low',
          priority: 'low',
          title: '✅ Low B12 Deficiency Risk',
          message: 'Great job! Keep up your current diet and lifestyle habits.',
        });
      }
    } else {
      insights.push({
        type: 'no_assessment',
        priority: 'medium',
        title: '📋 Take the B12 Assessment',
        message: 'Complete the questionnaire to get a personalized B12 deficiency risk score.',
      });
    }

    // 2. 7-day trend pattern alerts (matching WeeklyProgressScreen.js logic)
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const logs = await DailyCheckin.findAll({
      where: {
        user_id: req.user.id,
        checkin_date: { [Op.gte]: since.toISOString().split('T')[0] },
      },
      order: [['checkin_date', 'ASC']],
    });

    if (logs.length >= 3) {
      // Fatigue alert — 3+ consecutive high fatigue days
      const highFatigueDays = logs.filter((l) => l.fatigue_score >= 3).length;
      if (highFatigueDays >= 3) {
        insights.push({
          type: 'trend_alert',
          priority: 'high',
          title: '😴 Fatigue Pattern Detected',
          message: `High fatigue reported ${highFatigueDays} of the last ${logs.length} days. Fatigue is a key B12 deficiency symptom.`,
        });
      }

      // Energy trend
      const avgEnergy = logs.reduce((s, l) => s + l.energy_score, 0) / logs.length;
      if (avgEnergy < 1.5) {
        insights.push({
          type: 'trend_alert',
          priority: 'medium',
          title: '⚡ Low Energy This Week',
          message: `Your average energy score this week is ${avgEnergy.toFixed(1)}/4. B12 supports energy production — check your intake.`,
        });
      }

      // Mood trend
      const avgMood = logs.reduce((s, l) => s + l.mood_score, 0) / logs.length;
      if (avgMood < 1.5) {
        insights.push({
          type: 'trend_alert',
          priority: 'medium',
          title: '🧠 Mood Dipping This Week',
          message: 'Low mood scores detected. B12 deficiency is linked to mood disturbances.',
        });
      }
    } else if (logs.length === 0) {
      insights.push({
        type: 'checkin_reminder',
        priority: 'low',
        title: '📝 Start Your Daily Check-ins',
        message: 'Doing daily check-ins helps track your symptoms and build habit streaks.',
      });
    }

    return sendSuccess(res, { insights, total: insights.length });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
