/**
 * logger.js — Winston structured logger with security audit support
 *
 * Security features:
 *  - Masks sensitive fields (passwords, tokens) before writing to disk
 *  - Strips control characters (\n, \r, null bytes) to prevent log injection
 *  - Structured JSON format (no string interpolation — prevents log injection)
 *  - Daily rotation with 30-day (error/exception) and 90-day (security) retention
 *  - Console output in development only
 */

const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Fields whose values must NEVER appear in logs
const SENSITIVE_KEYS = [
  'password',
  'password_hash',
  'currentPassword',
  'newPassword',
  'token',
  'authorization',
  'jwt',
  'secret',
];

// ── Custom format: mask sensitive fields in log metadata ──
const maskSensitive = format((info) => {
  const sanitizeObj = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const result = Array.isArray(obj) ? [] : {};
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.some((sk) => key.toLowerCase().includes(sk))) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        result[key] = sanitizeObj(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  };

  // Sanitize top-level metadata spread into the log entry
  Object.keys(info).forEach((key) => {
    if (!['level', 'message', 'timestamp', 'stack'].includes(key)) {
      info[key] = sanitizeObj(info[key]);
    }
  });

  return info;
});

// ── Custom format: strip newlines and control chars to prevent log injection ──
const sanitizeMessage = format((info) => {
  if (typeof info.message === 'string') {
    // Replace newlines, carriage returns, and null bytes with a space
    info.message = info.message.replace(/[\r\n\x00-\x1f\x7f]/g, ' ').trim();
  }
  return info;
});

const logDir = path.join(__dirname, '../../logs');

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    maskSensitive(),
    sanitizeMessage(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json(), // Structured JSON — no string interpolation
  ),
  transports: [
    // Error log (30 days)
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d',
      zippedArchive: true,
    }),
    // Security / general log (90 days — for audit trail)
    new DailyRotateFile({
      filename: path.join(logDir, 'security-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '90d',
      zippedArchive: true,
    }),
  ],
  // Uncaught exception log
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      zippedArchive: true,
    }),
  ],
  exitOnError: false,
});

// Console output in development only
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  );
}

module.exports = logger;
