const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const UserStreak = require('../models/DailyCheckin').UserStreak;
const { sendSuccess, sendError, getAgeGroup, getDietPenalty } = require('../utils/response');

const router = express.Router();

const generateToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ── POST /api/auth/register ──
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, errors.array()[0].msg);

    const { email, password, name, age, gender, dietType } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) return sendError(res, 'Email already registered', 409);

    const password_hash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, password_hash });

    // Create profile if onboarding data was provided
    if (age || gender || dietType) {
      const ageNum = parseInt(age);
      await UserProfile.create({
        user_id: user.id,
        name,
        age: ageNum || null,
        age_group: ageNum ? getAgeGroup(ageNum) : null,
        gender: gender || null,
        diet_type: dietType || null,
        diet_penalty_score: getDietPenalty(dietType),
      });
    }

    // Initialize streak
    await UserStreak.create({ user_id: user.id });

    const token = generateToken(user);
    return sendSuccess(res, { token, user: { id: user.id, email: user.email } }, 201);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/login ──
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, errors.array()[0].msg);

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email, is_active: true } });
    if (!user || !user.password_hash) return sendError(res, 'Invalid email or password', 401);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return sendError(res, 'Invalid email or password', 401);

    const token = generateToken(user);
    return sendSuccess(res, { token, user: { id: user.id, email: user.email } });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/refresh ──
router.post('/refresh', async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return sendError(res, 'Token required');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user || !user.is_active) return sendError(res, 'User not found', 401);
    const newToken = generateToken(user);
    return sendSuccess(res, { token: newToken });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
