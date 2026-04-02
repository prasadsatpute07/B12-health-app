/**
 * routes/auth.js — Authentication routes with full hacker-level protection
 *
 * Security implementations:
 *  [1]  Password policy: min 8 chars + uppercase + number (medical data app)
 *  [2]  Timing attack prevention: always runs bcrypt even when user not found
 *       → prevents user enumeration via response time differences
 *  [3]  Brute-force check: rejects login if ≥5 failures in last 15 min for that email
 *  [4]  Account lockout: sets is_active=false after consecutive failures
 *  [5]  Login attempt logging: every attempt (success/fail) recorded
 *  [6]  JWT jti (unique ID): enables per-token revocation on logout
 *  [7]  JWT algorithm locked to HS256: prevents algorithm confusion attack
 *  [8]  Issuer + Audience claims: prevents token reuse across services
 *  [9]  Logout endpoint: blacklists token's jti immediately
 *  [10] Audit logging: every auth event logged with IP, user-agent, metadata
 *  [11] Mass assignment prevention: only explicit fields extracted from body
 *  [12] Generic error messages: never reveals whether email or password was wrong
 */

const express   = require('express');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { Op }    = require('sequelize');

const User          = require('../models/User');
const UserProfile   = require('../models/UserProfile');
const TokenBlacklist = require('../models/TokenBlacklist');
const LoginAttempt  = require('../models/LoginAttempt');
const authMiddleware = require('../middleware/auth');
const { logSecurityEvent, EVENTS } = require('../middleware/auditLogger');
const { sendSuccess, sendError, getAgeGroup, getDietPenalty } = require('../utils/response');

const { UserStreak } = require('../models/DailyCheckin');

const router = express.Router();

// ── [2] Timing Attack Prevention ──
// Pre-computed dummy hash. When user email is not found, we still run bcrypt.compare
// against this hash. This makes "user not found" take the same ~150ms as "wrong password".
// Without this, attackers can enumerate valid emails by measuring response time.
const DUMMY_HASH = '$2a$12$LQv3c1yqBm9b.XESSzgumHJoZ.GFMB.d4BpJvCHRkOTuXiVtVma';

// ── Helper: Get real client IP ──
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.ip || req.connection?.remoteAddress || 'unknown';
};

// ── Helper: Generate JWT with jti (enables logout revocation) ──
const generateToken = (user) => {
  const jti = uuidv4(); // Unique token ID — stored in blacklist on logout
  const token = jwt.sign(
    {
      jti,             // JWT ID — needed to blacklist on logout
      id:    user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn:  process.env.JWT_EXPIRES_IN || '7d',
      algorithm:  'HS256',                            // [7] Explicit algorithm lock
      issuer:     process.env.JWT_ISSUER   || 'b12-health', // [8] Issuer claim
      audience:   process.env.JWT_AUDIENCE || 'b12-app',    // [8] Audience claim
    },
  );
  return { token, jti };
};

// ── Helper: Check if email is currently brute-force rate-limited ──
const isEmailBruteForced = async (email) => {
  const windowMs  = parseInt(process.env.ACCOUNT_LOCKOUT_MINUTES || '15') * 60 * 1000;
  const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
  const since     = new Date(Date.now() - windowMs);

  const failCount = await LoginAttempt.count({
    where: {
      email:        email.toLowerCase(),
      success:      false,
      attempted_at: { [Op.gte]: since },
    },
  });

  return failCount >= maxAttempts;
};

// ── Helper: Record a login attempt ──
const recordAttempt = async (email, ip, success) => {
  try {
    await LoginAttempt.create({
      email:      email.toLowerCase(),
      ip_address: ip,
      success,
    });
  } catch (_) {
    // Non-blocking — don't fail auth if attempt logging fails
  }
};


// ════════════════════════════════════════════════════
// POST /api/auth/register
// ════════════════════════════════════════════════════
router.post('/register', [
  body('email')
    .isEmail().withMessage('A valid email address is required.')
    .normalizeEmail(),
  // [1] Password policy: min 8 chars + uppercase + number (for medical data)
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, errors.array()[0].msg, 400);

    // [11] Mass assignment prevention — only extract expected fields
    const { email, password, name, age, gender, dietType } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return sendError(res, 'Email already registered. Please log in to your existing account.', 409);
    }

    const password_hash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, password_hash });

    if (age || gender || dietType) {
      const ageNum = parseInt(age);
      await UserProfile.create({
        user_id:            user.id,
        name:               name || null,
        age:                ageNum || null,
        age_group:          ageNum ? getAgeGroup(ageNum) : null,
        gender:             gender || null,
        diet_type:          dietType || null,
        diet_penalty_score: getDietPenalty(dietType),
      });
    }

    await UserStreak.create({ user_id: user.id });

    const { token } = generateToken(user);

    // [10] Audit log
    await logSecurityEvent(req, EVENTS.REGISTER, {
      userId:   user.id,
      metadata: { email },
    });

    return sendSuccess(res, { token, user: { id: user.id, email: user.email } }, 201);
  } catch (err) {
    next(err);
  }
});


// ════════════════════════════════════════════════════
// POST /api/auth/login
// ════════════════════════════════════════════════════
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
  body('password').notEmpty().withMessage('Password is required.'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, errors.array()[0].msg, 400);

    // [11] Mass assignment prevention
    const { email, password } = req.body;
    const ip = getClientIp(req);

    // [3] Brute-force gate: too many recent failures for this email?
    const bruteForced = await isEmailBruteForced(email);
    if (bruteForced) {
      await logSecurityEvent(req, EVENTS.ACCOUNT_LOCKED, {
        metadata: { email, reason: 'brute_force_threshold_on_login' },
      });
      return sendError(
        res,
        'Too many failed login attempts. Please wait 15 minutes before trying again.',
        429,
      );
    }

    // Look up user by email
    const user = await User.findOne({ where: { email } });

    // [2] TIMING ATTACK PREVENTION
    // ALWAYS run bcrypt.compare — even if user doesn't exist.
    // If user exists → compare against their real hash (~150ms)
    // If user not found → compare against DUMMY_HASH (~150ms)
    // Both paths take the same time → attacker cannot enumerate emails via timing.
    const hashToCompare = user?.password_hash || DUMMY_HASH;
    const passwordValid = await bcrypt.compare(password, hashToCompare);

    // Determine authentication result
    const authFailed = !user || !passwordValid || !user.is_active;

    if (authFailed) {
      // Record the failure
      await recordAttempt(email, ip, false);

      // [4] Check if this failure tips into account lockout
      const nowBruteForced = await isEmailBruteForced(email);
      if (nowBruteForced && user && user.is_active) {
        // Lock the account
        await user.update({ is_active: false });
        await logSecurityEvent(req, EVENTS.ACCOUNT_LOCKED, {
          userId:   user.id,
          metadata: { email, reason: 'consecutive_failures_lockout' },
        });
        return sendError(
          res,
          'Account locked after too many failed attempts. Please contact support to unlock.',
          403,
        );
      }

      // [10] Log the failure
      await logSecurityEvent(req, EVENTS.FAILED_LOGIN, {
        userId:   user?.id || null,
        metadata: { email },
      });

      // [12] Generic message — NEVER say whether email or password was wrong
      // Specific messages help attackers confirm valid emails (enumeration)
      return sendError(res, 'Invalid email or password.', 401);
    }

    // ── Authentication succeeded ──
    await recordAttempt(email, ip, true);

    const { token } = generateToken(user);

    // [10] Audit log successful login
    await logSecurityEvent(req, EVENTS.LOGIN, {
      userId:   user.id,
      metadata: { email },
    });

    return sendSuccess(res, { token, user: { id: user.id, email: user.email } });
  } catch (err) {
    next(err);
  }
});


// ════════════════════════════════════════════════════
// POST /api/auth/logout  (protected)
// [9] Blacklists the current token's jti so it's immediately invalid
// ════════════════════════════════════════════════════
router.post('/logout', authMiddleware, async (req, res, next) => {
  try {
    const decoded = jwt.decode(req.token);

    if (decoded?.jti) {
      const expiresAt = decoded.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // fallback: 7 days

      // Insert into blacklist — this token is now dead even before it expires
      await TokenBlacklist.create({
        jti:        decoded.jti,
        user_id:    req.user.id,
        expires_at: expiresAt,
      });
    }

    await logSecurityEvent(req, EVENTS.LOGOUT, {
      userId:   req.user.id,
      metadata: { email: req.user.email },
    });

    return sendSuccess(res, { message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
});


// ════════════════════════════════════════════════════
// POST /api/auth/refresh
// ════════════════════════════════════════════════════
router.post('/refresh', async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return sendError(res, 'Token is required.', 400);

    // Verify with full security options (same as auth middleware)
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer:     process.env.JWT_ISSUER   || 'b12-health',
      audience:   process.env.JWT_AUDIENCE || 'b12-app',
    });

    // Check blacklist (logged-out tokens cannot be refreshed)
    if (decoded.jti) {
      const blacklisted = await TokenBlacklist.findByPk(decoded.jti);
      if (blacklisted) return sendError(res, 'Token has been revoked.', 401);
    }

    const user = await User.findByPk(decoded.id);
    if (!user || !user.is_active) return sendError(res, 'Account not found or locked.', 401);

    const { token: newToken } = generateToken(user);

    await logSecurityEvent(req, EVENTS.TOKEN_REFRESH, { userId: user.id });

    return sendSuccess(res, { token: newToken });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Token expired. Please log in again.', 401);
    }
    next(err);
  }
});

module.exports = router;
