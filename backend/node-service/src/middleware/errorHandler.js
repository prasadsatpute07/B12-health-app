/**
 * errorHandler.js — Production-safe global error handler
 *
 * Security principle: NEVER leak internal error details to clients in production.
 *
 * Why this matters:
 *   - Stack traces reveal file paths, library versions, and code structure
 *   - Raw error messages can contain SQL, database schema, or config details
 *   - These details help attackers map your system for targeted attacks
 *
 * What we do instead:
 *   - Log the full error internally (Winston — visible to developers/ops)
 *   - Return a safe, generic message to the client
 *   - Include a short correlation ID so users can report issues
 *     without us exposing what went wrong internally
 *
 * In development: full details shown for debugging convenience
 * In production:  only safe messages — never stack traces or raw err.message
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // ── Generate a short correlation ID ──
  // Safe to share with the client — it's just an opaque reference ID
  // for support/log correlation. Does NOT reveal any internal info.
  const correlationId = uuidv4().split('-')[0].toUpperCase(); // e.g. "A3F8C9B1"

  // ── Always log the full error internally ──
  logger.error('Unhandled request error', {
    correlationId,
    method:    req.method,
    path:      req.path,
    userId:    req.user?.id || null,
    errorName: err.name,
    message:   err.message,
    stack:     err.stack,
  });

  // ── Sequelize validation / unique constraint errors ──
  // These are safe to return in detail (they come from our own validators)
  if (
    err.name === 'SequelizeValidationError' ||
    err.name === 'SequelizeUniqueConstraintError'
  ) {
    const messages = err.errors.map((e) => e.message);
    return res.status(400).json({
      success: false,
      error:   messages.join(', '),
    });
  }

  // ── JWT errors ── (safe generic response)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
  }

  // ── CORS origin rejection ──
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, error: 'Origin not permitted.' });
  }

  const statusCode = err.statusCode || 500;
  const isServerError = statusCode >= 500;

  // ── Production: NEVER expose internal error details ──
  if (process.env.NODE_ENV === 'production') {
    return res.status(statusCode).json({
      success: false,
      // For 5xx: generic message. For 4xx: the error message is safe (it's a known/expected error)
      error: isServerError
        ? 'An internal error occurred. Please try again later.'
        : (err.message || 'Request could not be processed.'),
      correlationId, // For support lookup — opaque, reveals nothing
    });
  }

  // ── Development: full details for debugging ──
  return res.status(statusCode).json({
    success: false,
    error:   err.message || 'Internal Server Error',
    correlationId,
    stack:   err.stack,
  });
};

module.exports = errorHandler;
