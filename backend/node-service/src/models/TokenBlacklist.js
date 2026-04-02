/**
 * TokenBlacklist.js — Revoked JWT model
 *
 * When a user logs out, their token's jti (JWT unique ID) is
 * inserted here. The auth middleware checks this on every request.
 *
 * Cleanup: expired entries are removed by cleanup_expired_tokens() SQL function.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TokenBlacklist = sequelize.define('TokenBlacklist', {
  jti: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    allowNull: false,
    comment: 'JWT unique ID (jti claim) — UUID format',
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'User who logged out',
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Original token expiry — used for cleanup',
  },
}, {
  tableName: 'token_blacklist',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = TokenBlacklist;
