/**
 * AuditLog.js — Security event audit trail model
 *
 * Stores all security events: logins, logouts, failures,
 * account lockouts, IDOR attempts, password changes, etc.
 *
 * Purpose:
 *  - Forensic investigation after a security incident
 *  - Compliance with data protection requirements (DPDP, GDPR)
 *  - Real-time alerting (can export to SIEM/Slack/PagerDuty)
 *  - Detecting anomalous activity patterns
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true, // null for anonymous/pre-login events
    comment: 'User involved in the event (null for anonymous events)',
  },
  event_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'LOGIN | LOGOUT | FAILED_LOGIN | ACCOUNT_LOCKED | REGISTER | PASSWORD_CHANGE | TOKEN_REFRESH | IDOR_ATTEMPT | UNAUTHORIZED_ACCESS',
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'Client IP address',
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Browser / app user-agent string',
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Event-specific context — never store passwords or tokens here',
  },
}, {
  tableName: 'audit_logs',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = AuditLog;
