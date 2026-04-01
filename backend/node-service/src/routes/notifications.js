const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const { sequelize } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

const router = express.Router();
router.use(authMiddleware);

// ── POST /api/notifications/token — Register Expo push token ──
router.post('/token', [
  body('token').notEmpty().withMessage('Push token is required'),
  body('platform').optional().isIn(['ios', 'android']),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, errors.array()[0].msg);

    const { token, platform } = req.body;

    // Upsert push token for this user
    await sequelize.query(
      `INSERT INTO push_tokens (id, user_id, token, platform, is_active)
       VALUES (gen_random_uuid(), :userId, :token, :platform, true)
       ON CONFLICT (user_id, token) DO UPDATE SET is_active = true`,
      { replacements: { userId: req.user.id, token, platform: platform || 'android' } }
    );

    return sendSuccess(res, { message: 'Push token registered successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
