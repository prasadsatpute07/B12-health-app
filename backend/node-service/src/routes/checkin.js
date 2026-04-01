const express = require('express');
const { body, query, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const { DailyCheckin, UserStreak } = require('../models/DailyCheckin');
const { sendSuccess, sendError } = require('../utils/response');
const { Op, fn, col, literal } = require('sequelize');

const router = express.Router();
router.use(authMiddleware);

// ─── Streak updater ───────────────────────────────
const updateStreak = async (userId, today) => {
  let streak = await UserStreak.findOne({ where: { user_id: userId } });
  if (!streak) {
    streak = await UserStreak.create({ user_id: userId });
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yDate = yesterday.toISOString().split('T')[0];

  const isConsecutive = streak.last_checkin_date === yDate;
  const newCurrent = isConsecutive ? streak.current_streak + 1 : 1;
  const newLongest = Math.max(newCurrent, streak.longest_streak);

  await streak.update({
    current_streak: newCurrent,
    longest_streak: newLongest,
    total_checkins: streak.total_checkins + 1,
    last_checkin_date: today,
  });

  return { current_streak: newCurrent, longest_streak: newLongest };
};

// ── POST /api/checkin/daily — Submit daily check-in ──
router.post('/daily', [
  body('energyScore').isInt({ min: 0, max: 4 }),
  body('fatigueScore').isInt({ min: 0, max: 4 }),
  body('moodScore').isInt({ min: 0, max: 4 }),
  body('sleepScore').isInt({ min: 0, max: 4 }),
  body('focusScore').isInt({ min: 0, max: 4 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, errors.array()[0].msg);

    const { energyScore, fatigueScore, moodScore, sleepScore, focusScore, notes, durationSeconds } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // Upsert — one check-in per day
    const [checkin, created] = await DailyCheckin.upsert({
      user_id: req.user.id,
      checkin_date: today,
      energy_score: energyScore,
      fatigue_score: fatigueScore,
      mood_score: moodScore,
      sleep_score: sleepScore,
      focus_score: focusScore,
      notes: notes || null,
      duration_seconds: durationSeconds || null,
    }, { returning: true });

    const streak = await updateStreak(req.user.id, today);

    return sendSuccess(res, { checkin, streak, isNew: created }, 201);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/checkin/history — Fetch history for trend charts ──
router.get('/history', [
  query('days').optional().isInt({ min: 1, max: 90 }),
], async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await DailyCheckin.findAll({
      where: {
        user_id: req.user.id,
        checkin_date: { [Op.gte]: since.toISOString().split('T')[0] },
      },
      order: [['checkin_date', 'ASC']],
    });

    const streak = await UserStreak.findOne({ where: { user_id: req.user.id } });

    return sendSuccess(res, { logs, streak, days });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
