/**
 * rateLimiter.js — Tiered rate limiting with progressive slow-down
 *
 * Defence layers:
 *  1. authLimiter   — 5 requests / 15 min per IP+email (brute-force, credential stuffing)
 *  2. apiLimiter    — 100 requests / 15 min per IP (general API abuse)
 *  3. authSlowDown  — progressive delays after 3 auth requests (makes automation expensive)
 *
 * Key-generator for auth: IP + email combo
 *   → Prevents distributed attacks where one attacker rotates IPs
 *   → One email can't be hammered from 1000 IPs
 */

const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// ── [1] Auth rate limiter: strict ──
// Defends against: brute-force login, credential stuffing, account enumeration
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count ALL requests (including successful logins)
  message: {
    success: false,
    error: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
    code: 'RATE_LIMIT_AUTH',
  },
  keyGenerator: (req) => {
    // Combine IP + email for key — prevents single-IP bypass AND email-targeted attacks
    const email = (req.body?.email || '').toLowerCase().substring(0, 100);
    const ip = req.ip || 'unknown';
    return `auth_${ip}_${email}`;
  },
});

// ── [2] General API rate limiter: moderate ──
// Defends against: API scraping, automated scanning, general abuse
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(15 * 60 * 1000)),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT_API',
  },
});

// ── [3] Progressive slow-down for auth endpoints ──
// Defends against: slow/distributed brute-force that tries to stay under rate limits
// After 3 requests → add 500ms delay. After 4 → 1000ms. After 5 → blocked by authLimiter.
// Makes automation VERY expensive before hitting hard block.
const authSlowDown = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 3,             // Start adding delay after 3 requests
  delayMs: (hits) => (hits - 3) * 500, // +500ms per request after the 3rd
  maxDelayMs: 10000,         // Cap at 10 seconds
  keyGenerator: (req) => {
    const email = (req.body?.email || '').toLowerCase().substring(0, 100);
    const ip = req.ip || 'unknown';
    return `slowdown_${ip}_${email}`;
  },
});

module.exports = { authLimiter, apiLimiter, authSlowDown };
