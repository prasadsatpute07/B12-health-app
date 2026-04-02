/**
 * LoginAttempt.js — Login attempt tracker for brute-force detection
 *
 * Every login attempt (success or failure) is recorded.
 * The auth route queries this to:
 *   - Block login if ≥5 failures in last 15 minutes (per email)
 *   - Detect credential stuffing (many emails from same IP)
 *   - Auto-lock accounts after consecutive failures
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const LoginAttempt = sequelize.define('LoginAttempt', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Lowercased email attempted',
  },
  ip_address: {
    type: DataTypes.STRING(45), // Supports IPv4 and IPv6
    allowNull: false,
    comment: 'Client IP address',
  },
  success: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether the login attempt succeeded',
  },
}, {
  tableName: 'login_attempts',
  underscored: true,
  timestamps: true,
  createdAt: 'attempted_at',
  updatedAt: false,
});

module.exports = LoginAttempt;
