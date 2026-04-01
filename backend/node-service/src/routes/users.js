const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const UserBmiLog = require('../models/UserBmiLog');
const { sendSuccess, sendError, getAgeGroup, getDietPenalty } = require('../utils/response');

const router = express.Router();
router.use(authMiddleware);

// ── POST /api/users/profile — Save / update profile (exact endpoint from app README) ──
router.post('/profile', [
  body('age').optional().isInt({ min: 1, max: 120 }),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('dietType').optional().isIn(['vegan', 'vegetarian', 'pescatarian', 'omnivore']),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, errors.array()[0].msg);

    const { name, age, gender, dietType,
      hasPerniciousAnemia, hasCrohnsCeliac, hasGastricSurgery,
      takesMetformin, takesPpi, isPregnant, isBreastfeeding,
      alcoholFrequency, smokingStatus } = req.body;

    const ageNum = age ? parseInt(age) : undefined;

    const profileData = {
      user_id: req.user.id,
      ...(name !== undefined && { name }),
      ...(ageNum !== undefined && { age: ageNum, age_group: getAgeGroup(ageNum) }),
      ...(gender !== undefined && { gender }),
      ...(dietType !== undefined && { diet_type: dietType, diet_penalty_score: getDietPenalty(dietType) }),
      ...(hasPerniciousAnemia !== undefined && { has_pernicious_anemia: hasPerniciousAnemia }),
      ...(hasCrohnsCeliac !== undefined && { has_crohns_disease: hasCrohnsCeliac, has_celiac_disease: hasCrohnsCeliac }),
      ...(hasGastricSurgery !== undefined && { has_gastric_surgery: hasGastricSurgery }),
      ...(takesMetformin !== undefined && { takes_metformin: takesMetformin }),
      ...(takesPpi !== undefined && { takes_ppi: takesPpi }),
      ...(isPregnant !== undefined && { is_pregnant: isPregnant }),
      ...(isBreastfeeding !== undefined && { is_breastfeeding: isBreastfeeding }),
      ...(alcoholFrequency !== undefined && { alcohol_frequency: alcoholFrequency }),
      ...(smokingStatus !== undefined && { smoking_status: smokingStatus }),
    };

    const [profile, created] = await UserProfile.upsert(profileData, { returning: true });
    return sendSuccess(res, { profile }, created ? 201 : 200);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/users/profile ──
router.get('/profile', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ['id', 'email', 'created_at'] });
    const profile = await UserProfile.findOne({ where: { user_id: req.user.id } });
    return sendSuccess(res, { user, profile });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/users/password — change password (MVP) ──
router.post('/password', [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, errors.array()[0].msg);

    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user || !user.password_hash) return sendError(res, 'Unable to update password', 400);

    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) return sendError(res, 'Current password is incorrect', 401);

    const password_hash = await bcrypt.hash(newPassword, 12);
    await user.update({ password_hash });
    return sendSuccess(res, { message: 'Password updated' });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/users/me — soft delete ──
router.delete('/me', async (req, res, next) => {
  try {
    await User.update({ is_active: false }, { where: { id: req.user.id } });
    return sendSuccess(res, { message: 'Account deactivated' });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/users/bmi — Save BMI measurement ──
router.post('/bmi', [
  body('heightCm').isFloat({ min: 50, max: 300 }).withMessage('Height must be between 50 and 300 cm'),
  body('weightKg').isFloat({ min: 10, max: 500 }).withMessage('Weight must be between 10 and 500 kg'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, errors.array()[0].msg);

    const { heightCm, weightKg } = req.body;
    const h = parseFloat(heightCm) / 100;
    const w = parseFloat(weightKg);
    const bmi = Math.round((w / (h * h)) * 10) / 10;

    let bmiCategory;
    if (bmi < 18.5)      bmiCategory = 'underweight';
    else if (bmi < 25)   bmiCategory = 'normal';
    else if (bmi < 30)   bmiCategory = 'overweight';
    else                 bmiCategory = 'obese';

    const today = new Date().toISOString().split('T')[0];
    const log = await UserBmiLog.create({
      user_id: req.user.id,
      height_cm: parseFloat(heightCm),
      weight_kg: w,
      bmi,
      bmi_category: bmiCategory,
      measured_at: today,
    });

    return sendSuccess(res, { bmi: log }, 201);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/users/bmi/latest — Get most recent BMI record ──
router.get('/bmi/latest', async (req, res, next) => {
  try {
    const latest = await UserBmiLog.findOne({
      where: { user_id: req.user.id },
      order: [['measured_at', 'DESC'], ['created_at', 'DESC']],
    });
    if (!latest) return sendSuccess(res, { bmi: null });
    return sendSuccess(res, { bmi: latest });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/users/bmi/history — Get BMI history ──
router.get('/bmi/history', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const logs = await UserBmiLog.findAll({
      where: { user_id: req.user.id },
      order: [['measured_at', 'DESC'], ['created_at', 'DESC']],
      limit,
    });
    return sendSuccess(res, { history: logs });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
