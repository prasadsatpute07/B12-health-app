const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// ─────────────────────────────────────────────────────────────────────────────
// UserHealthState — one row per user (living record)
//
// Created:  when the user first submits the questionnaire
// Updated:  every time the user submits a daily check-in
// Never modified by: the assessments table (that stays locked)
// ─────────────────────────────────────────────────────────────────────────────
const UserHealthState = sequelize.define('UserHealthState', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  // Identity
  user_id: { type: DataTypes.UUID, allowNull: false, unique: true },

  // FK to original questionnaire assessment (read-only reference)
  assessment_id: { type: DataTypes.UUID, allowNull: true },

  // ── Questionnaire baseline (copied once, not changed by daily data) ──
  age_at_assessment:     { type: DataTypes.SMALLINT },
  age_group:             { type: DataTypes.STRING(10) },
  gender:                { type: DataTypes.STRING(20) },
  diet_type:             { type: DataTypes.STRING(20) },
  diet_penalty_score:    { type: DataTypes.SMALLINT, defaultValue: 0 },
  has_pernicious_anemia: { type: DataTypes.BOOLEAN, defaultValue: false },
  has_crohns_disease:    { type: DataTypes.BOOLEAN, defaultValue: false },
  has_celiac_disease:    { type: DataTypes.BOOLEAN, defaultValue: false },
  has_gastric_surgery:   { type: DataTypes.BOOLEAN, defaultValue: false },
  takes_metformin:       { type: DataTypes.BOOLEAN, defaultValue: false },
  takes_ppi:             { type: DataTypes.BOOLEAN, defaultValue: false },
  baseline_risk_level:   { type: DataTypes.STRING(10) },
  baseline_risk_score:   { type: DataTypes.DECIMAL(5, 2) },

  // ── Daily updated fields (overwritten on every check-in) ──
  current_energy_score:  { type: DataTypes.SMALLINT },
  current_fatigue_score: { type: DataTypes.SMALLINT },
  current_mood_score:    { type: DataTypes.SMALLINT },
  current_sleep_score:   { type: DataTypes.SMALLINT },
  current_focus_score:   { type: DataTypes.SMALLINT },
  current_daily_total:   { type: DataTypes.SMALLINT },

  // Metadata
  last_checkin_date: { type: DataTypes.DATEONLY },
  total_checkins:    { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'user_health_state',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = UserHealthState;
