require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

// ── Route imports ──
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const questionnaireRoutes = require('./src/routes/questionnaire');
const checkinRoutes = require('./src/routes/checkin');
const insightsRoutes = require('./src/routes/insights');
const notificationsRoutes = require('./src/routes/notifications');

const app = express();
const PORT = process.env.NODE_PORT || 3000;

// ── Security middleware ──
app.use(helmet());
app.use(cors({
  origin: '*',           // Open for mobile clients — restrict in production
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate limiting ──
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ── Logging + Body parsing ──
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ──
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'B12 Health Tracker — Node.js API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    status: 'healthy',
  });
});

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/questionnaire', questionnaireRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/notifications', notificationsRoutes);

// ── 404 catch-all ──
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.originalUrl} not found` });
});

// ── Global error handler ──
app.use(errorHandler);

// ── Start server ──
const startServer = async () => {
  await connectDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ B12 Node API running on http://0.0.0.0:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   Env:    ${process.env.NODE_ENV || 'development'}\n`);
  });
};

startServer();

module.exports = app; // for testing
