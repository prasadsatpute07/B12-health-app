/**
 * server.js — B12 Health Tracker API Gateway
 *
 * Security layers applied (in order):
 *  [1]  validateEnv      — Fail-fast if JWT_SECRET missing/weak
 *  [2]  trust proxy      — Correct IP extraction behind load balancers
 *  [3]  Helmet (hardened)— Strict HTTP security headers (CSP, HSTS, noSniff)
 *  [4]  CORS whitelist   — Only known origins (not wildcard)
 *  [5]  Content-Type     — Reject non-JSON bodies on POST/PUT/PATCH
 *  [6]  XSS clean        — Strip script tags and HTML from request bodies
 *  [7]  NoSQL sanitize   — Strip $ and . operators (NoSQL injection)
 *  [8]  HPP guard        — Block HTTP parameter pollution
 *  [9]  Prototype guard  — Strip __proto__, constructor, prototype keys
 *  [10] Body size limit  — 1mb max (down from 10mb) — prevents DoS
 *  [11] Morgan logging   — Combined format, no body logged, health skipped
 *  [12] API rate limiter — 100 req/15 min per IP
 *  [13] Auth slow-down   — Progressive delays on auth endpoints
 *  [14] Auth rate limit  — 5 req/15 min per IP+email on auth routes
 *  [15] keepAliveTimeout — Slowloris DDoS defence
 */

require('dotenv').config();

// ── [1] Fail-fast environment validation (BEFORE anything else) ──
const validateEnv = require('./src/config/validateEnv');
validateEnv();

const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const http     = require('http');

const { connectDB }     = require('./src/config/db');
const errorHandler      = require('./src/middleware/errorHandler');
const logger            = require('./src/utils/logger');
const { authLimiter, apiLimiter, authSlowDown } = require('./src/middleware/rateLimiter');
const {
  xssClean,
  noSqlSanitize,
  hppGuard,
  prototypePollutionGuard,
  contentTypeGuard,
} = require('./src/middleware/sanitize');

// ── Route imports ──
const authRoutes          = require('./src/routes/auth');
const userRoutes          = require('./src/routes/users');
const questionnaireRoutes = require('./src/routes/questionnaire');
const checkinRoutes       = require('./src/routes/checkin');
const insightsRoutes      = require('./src/routes/insights');
const notificationsRoutes = require('./src/routes/notifications');

const app  = express();
const PORT = process.env.NODE_PORT || 3000;

// ── [2] Trust proxy (1 hop) ──
// Ensures req.ip is the real client IP when behind Nginx/Docker/AWS ALB
// Setting to '1' means we trust one proxy — prevents IP spoofing via X-Forwarded-For
app.set('trust proxy', 1);

// ── [3] Helmet — hardened HTTP security headers ──
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'"],
      imgSrc:      ["'self'", 'data:'],
      connectSrc:  ["'self'"],
      frameSrc:    ["'none'"],
      objectSrc:   ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  // HSTS: force HTTPS for 1 year (preload-ready)
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'no-referrer' },
  noSniff:        true,   // X-Content-Type-Options: nosniff
  xssFilter:      true,   // X-XSS-Protection: 1; mode=block
  hidePoweredBy:  true,   // Remove X-Powered-By: Express header
}));

// ── [4] CORS — strict origin whitelist (NOT open to all) ──
// In production: set ALLOWED_ORIGINS=https://yourapp.com,exp://192.168.x.x:8081
// For mobile clients (no Origin header): still allowed (Expo, React Native)
const rawOrigins = process.env.ALLOWED_ORIGINS || '';
const allowedOrigins = rawOrigins.split(',').map((o) => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Requests with no Origin (mobile apps, Postman, curl) are always allowed
    if (!origin) return callback(null, true);
    // In development with no origins configured: allow all (for convenience)
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    logger.warn('CORS blocked request from unknown origin', { origin });
    return callback(new Error('Not allowed by CORS'));
  },
  methods:      ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials:  true,
}));

// ── [5] Content-Type enforcement (reject non-JSON mutations) ──
app.use(contentTypeGuard);

// ── [6-9] Input sanitization ──
app.use(xssClean);              // Strip <script> and HTML injection
app.use(noSqlSanitize);         // Block MongoDB $ operator injection
app.use(hppGuard);              // Block HTTP parameter pollution
app.use(prototypePollutionGuard); // Strip __proto__, constructor, prototype

// ── [10] Body parsing — strict 1mb limit (prevents request payload DoS) ──
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── [11] Request logging — combined format (does NOT log request body) ──
// Combined format logs: IP, timestamp, method, path, status, size, referrer, user-agent
// Critically: it does NOT log the request body (no passwords in logs)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
    skip:   (req) => req.path === '/health', // Skip health check spam
  }));
}

// ── [12] General API rate limiter ──
app.use('/api/', apiLimiter);

// ── [13-14] Auth routes — extra slow-down + strict rate limit ──
// Order: slowDown first (add delays) → authLimiter (hard block)
app.use('/api/auth', authSlowDown, authLimiter, authRoutes);

// ── Standard API routes ──
app.use('/api/users',         userRoutes);
app.use('/api/questionnaire', questionnaireRoutes);
app.use('/api/checkin',       checkinRoutes);
app.use('/api/insights',      insightsRoutes);
app.use('/api/notifications', notificationsRoutes);

// ── Health check — minimal info (no version, no internal details) ──
app.get('/health', (req, res) => {
  res.json({
    success:   true,
    service:   'B12 Health Tracker API',
    status:    'healthy',
    timestamp: new Date().toISOString(),
  });
});

// ── 404 catch-all ──
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found.' });
});

// ── Global error handler ──
app.use(errorHandler);

// ── Start server ──
const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);

  // ── [15] Slowloris DDoS defence ──
  // Slowloris attack: attacker holds connections open by sending partial HTTP headers.
  // keepAliveTimeout must be > any upstream load balancer's timeout.
  // headersTimeout must be > keepAliveTimeout.
  server.keepAliveTimeout = 65000;  // 65 seconds
  server.headersTimeout   = 66000;  // 66 seconds (must be > keepAliveTimeout)

  server.listen(PORT, '0.0.0.0', () => {
    logger.info('B12 API server started', {
      port: PORT,
      env:  process.env.NODE_ENV || 'development',
    });
    console.log(`\n✅ B12 Node API running on http://0.0.0.0:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   Env:    ${process.env.NODE_ENV || 'development'}\n`);
  });
};

startServer();

module.exports = app; // For Jest/supertest
