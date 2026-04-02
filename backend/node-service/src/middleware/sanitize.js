/**
 * sanitize.js — Multi-layer input sanitization
 *
 * Defends against:
 *  1. XSS (Cross-Site Scripting)        → xss-clean strips <script> tags, HTML
 *  2. NoSQL Injection                   → express-mongo-sanitize blocks $ and . operators
 *  3. HTTP Parameter Pollution (HPP)    → hpp blocks ?param=a&param=b duplicates
 *  4. Prototype Pollution               → strips __proto__, constructor, prototype keys
 *  5. Content-Type enforcement          → rejects non-JSON bodies on mutating requests
 *  6. Log Injection                     → strips \n \r from string values
 *
 * All middleware exported for use in server.js
 */

const xss = require('xss-clean');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');

// ── [1] XSS Clean: strips HTML tags and script injection from req.body, req.query ──
const xssClean = xss();

// ── [2] NoSQL Injection: replaces $ and . in keys (blocks MongoDB operator injection) ──
const noSqlSanitize = mongoSanitize({ replaceWith: '_' });

// ── [3] HTTP Parameter Pollution: only keeps the last value for duplicate query params ──
const hppGuard = hpp();

// ── [4] Prototype Pollution Guard ──
// Hacker payload example: {"__proto__": {"isAdmin": true}}
// This pollutes Object.prototype and grants attacker admin privileges on all objects.
const DANGEROUS_PROTO_KEYS = ['__proto__', 'constructor', 'prototype'];

const stripPrototypePollution = (obj, depth = 0) => {
  if (depth > 10 || obj === null || typeof obj !== 'object') return obj;
  for (const key of Object.keys(obj)) {
    if (DANGEROUS_PROTO_KEYS.includes(key)) {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      stripPrototypePollution(obj[key], depth + 1);
    }
  }
  return obj;
};

const prototypePollutionGuard = (req, res, next) => {
  if (req.body)   stripPrototypePollution(req.body);
  if (req.query)  stripPrototypePollution(req.query);
  if (req.params) stripPrototypePollution(req.params);
  next();
};

// ── [5] Content-Type Enforcement ──
// Mutating requests (POST/PUT/PATCH) must declare application/json.
// Prevents CSRF-style attacks with form-encoded payloads.
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH']);

const contentTypeGuard = (req, res, next) => {
  if (MUTATING_METHODS.has(req.method)) {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
      return res.status(415).json({
        success: false,
        error: 'Unsupported Media Type. Content-Type must be application/json.',
      });
    }
  }
  next();
};

// ── [6] Log Injection Sanitizer ──
// Strips \n, \r, and null bytes from string fields to prevent log forging.
const sanitizeForLogging = (value) => {
  if (typeof value === 'string') {
    return value.replace(/[\r\n\x00]/g, '').trim();
  }
  return value;
};

module.exports = {
  xssClean,
  noSqlSanitize,
  hppGuard,
  prototypePollutionGuard,
  contentTypeGuard,
  sanitizeForLogging,
};
