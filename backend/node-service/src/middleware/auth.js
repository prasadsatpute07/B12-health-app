/**
 * auth.js middleware — JWT verification with advanced protection
 *
 * Security features:
 *  [1] Algorithm lock: explicitly requires HS256 — prevents JWT algorithm confusion attack
 *      (attacker sending alg:'none' or alg:'RS256' to forge tokens)
 *  [2] Issuer + Audience validation — prevents token reuse across services
 *  [3] Token blacklist check — rejects tokens that have been logged out
 *      even if they haven't expired yet
 *  [4] Active user check — rejects tokens for locked/deactivated accounts
 *      (handles account lockout after brute-force detection)
 */

const jwt          = require('jsonwebtoken');
const TokenBlacklist = require('../models/TokenBlacklist');
const User         = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authorization token required.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // ── [1] Verify signature + expiry ──
    // CRITICAL: algorithms array explicitly set to ['HS256']
    // This prevents JWT Algorithm Confusion Attack where attacker:
    //   a) Sets alg:'none' to forge unsigned tokens
    //   b) Sets alg:'RS256' to confuse HS256 verification
    //   c) Provides a public key as the HMAC secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer:     process.env.JWT_ISSUER   || 'b12-health',
      audience:   process.env.JWT_AUDIENCE || 'b12-app',
    });

    // ── [2] Token blacklist check (logout revocation) ──
    // If the user has logged out, their token's jti is stored in token_blacklist.
    // A stolen token that was logged-out is immediately rejected here.
    if (decoded.jti) {
      const isBlacklisted = await TokenBlacklist.findByPk(decoded.jti);
      if (isBlacklisted) {
        return res.status(401).json({
          success: false,
          error: 'Session has been terminated. Please log in again.',
        });
      }
    }

    // ── [3] Active user check ──
    // Handles: account lockout after brute-force, admin-deactivated accounts,
    // and soft-deleted users. A valid JWT for a locked user is still rejected.
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'email', 'is_active'],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Account not found.',
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Account has been deactivated. Please contact support.',
      });
    }

    // Attach decoded payload + raw token to request for downstream use
    req.user  = decoded;  // { id, email, jti, iat, exp }
    req.token = token;    // Raw token — needed for logout blacklisting
    next();

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Session expired. Please log in again.',
      });
    }
    // JsonWebTokenError, NotBeforeError, or invalid algorithm — all treated the same
    return res.status(401).json({
      success: false,
      error: 'Invalid authorization token.',
    });
  }
};

module.exports = authMiddleware;
