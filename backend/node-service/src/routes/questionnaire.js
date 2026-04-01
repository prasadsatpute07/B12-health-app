const express = require('express');
const { body, query, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const Question = require('../models/Question');
const Assessment = require('../models/Assessment');
const AssessmentAnswer = require('../models/AssessmentAnswer');
const UserProfile = require('../models/UserProfile');
const scoringProxy = require('../services/scoringProxy');
const { sendSuccess, sendError } = require('../utils/response');
const { Op } = require('sequelize');

const router = express.Router();
router.use(authMiddleware);

// ── GET /api/questionnaire/questions ──
// Returns adaptive question set filtered by user's age_group and gender
router.get('/questions', async (req, res, next) => {
  try {
    const profile = await UserProfile.findOne({ where: { user_id: req.user.id } });
    const ageGroup = profile?.age_group || 'all';
    const gender = profile?.gender || 'all';

    const questions = await Question.findAll({
      where: {
        is_active: true,
        audience: { [Op.in]: ['all', gender] },
        age_group: { [Op.in]: ['all', ageGroup] },
      },
      order: [['display_order', 'ASC']],
      attributes: ['id', 'question_text', 'category', 'weight', 'options', 'audience', 'age_group'],
    });

    return sendSuccess(res, { questions, total: questions.length });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/questionnaire/submit ──
// Main endpoint — submit answers, call FastAPI scoring, store ML data
router.post('/submit', [
  body('answers').isArray({ min: 1 }).withMessage('answers array is required'),
  body('answers.*.questionId').isInt(),
  body('answers.*.answerValue').isString(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, errors.array()[0].msg);

    const { answers } = req.body;
    const profile = await UserProfile.findOne({ where: { user_id: req.user.id } });

    // Fetch matching questions for weight/score lookup
    const questionIds = answers.map((a) => a.questionId);
    const questions = await Question.findAll({ where: { id: questionIds } });
    const questionMap = {};
    questions.forEach((q) => { questionMap[q.id] = q; });

    // Call FastAPI scoring service
    const scoringResult = await scoringProxy.score({
      answers: answers.map((a) => ({
        question_id: a.questionId,
        answer_value: a.answerValue,
      })),
      profile: {
        age_group: profile?.age_group || 'all',
        gender: profile?.gender || 'all',
        diet_type: profile?.diet_type || 'omnivore',
        diet_penalty: profile?.diet_penalty_score || 0,
        has_pernicious_anemia: profile?.has_pernicious_anemia || false,
        has_crohns_celiac: profile?.has_crohns_disease || profile?.has_celiac_disease || false,
        has_gastric_surgery: profile?.has_gastric_surgery || false,
        takes_metformin: profile?.takes_metformin || false,
        takes_ppi: profile?.takes_ppi || false,
      },
    });

    // Store assessment (with profile snapshot for ML)
    const assessment = await Assessment.create({
      user_id: req.user.id,
      age_at_assessment: profile?.age || null,
      age_group: profile?.age_group || null,
      gender: profile?.gender || null,
      diet_type: profile?.diet_type || null,
      diet_penalty_score: profile?.diet_penalty_score || 0,
      has_pernicious_anemia: profile?.has_pernicious_anemia || false,
      has_crohns_disease: profile?.has_crohns_disease || false,
      has_celiac_disease: profile?.has_celiac_disease || false,
      has_gastric_surgery: profile?.has_gastric_surgery || false,
      takes_metformin: profile?.takes_metformin || false,
      takes_ppi: profile?.takes_ppi || false,
      raw_score: scoringResult.raw_score,
      max_possible_score: scoringResult.max_possible_score,
      normalized_score: scoringResult.normalized_score,
      risk_percentage: scoringResult.percentage,
      risk_level: scoringResult.risk_level,
      category_breakdown: scoringResult.breakdown,
      suggestions: scoringResult.suggestions,
      questions_shown: answers.length,
    });

    // Store individual answers (ML training rows)
    const answerRows = answers.map((a) => {
      const q = questionMap[a.questionId];
      const matchedOption = q ? q.options.find((o) => o.value === a.answerValue) : null;
      return {
        assessment_id: assessment.id,
        user_id: req.user.id,
        question_id: a.questionId,
        answer_value: a.answerValue,
        answer_label: matchedOption?.label || a.answerValue,
        answer_score: matchedOption?.score ?? 0,
        question_weight: q?.weight ?? 1.0,
        question_category: q?.category || null,
        question_text_snapshot: q?.question_text || null,
      };
    });
    await AssessmentAnswer.bulkCreate(answerRows);

    // Return shape matching the app's expected response
    return sendSuccess(res, {
      assessment_id: assessment.id,
      risk_level: scoringResult.risk_level,
      percentage: scoringResult.percentage,
      breakdown: scoringResult.breakdown,
      suggestions: scoringResult.suggestions,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/questionnaire/history ──
router.get('/history', async (req, res, next) => {
  try {
    const assessments = await Assessment.findAll({
      where: { user_id: req.user.id },
      order: [['completed_at', 'DESC']],
      attributes: ['id', 'risk_level', 'risk_percentage', 'normalized_score', 'category_breakdown', 'questions_shown', 'completed_at'],
    });
    return sendSuccess(res, { assessments });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/questionnaire/latest ──
router.get('/latest', async (req, res, next) => {
  try {
    const assessment = await Assessment.findOne({
      where: { user_id: req.user.id },
      order: [['completed_at', 'DESC']],
    });
    if (!assessment) return sendSuccess(res, { assessment: null });
    return sendSuccess(res, { assessment });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/questionnaire/:id ──
router.get('/:id', async (req, res, next) => {
  try {
    const assessment = await Assessment.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!assessment) return sendError(res, 'Assessment not found', 404);
    const answers = await AssessmentAnswer.findAll({ where: { assessment_id: assessment.id } });
    return sendSuccess(res, { assessment, answers });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
