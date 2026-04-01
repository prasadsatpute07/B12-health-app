const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Assessment = sequelize.define('Assessment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  // Profile snapshot at assessment time
  age_at_assessment: { type: DataTypes.SMALLINT },
  age_group: { type: DataTypes.STRING(10) },
  gender: { type: DataTypes.STRING(20) },
  diet_type: { type: DataTypes.STRING(20) },
  diet_penalty_score: { type: DataTypes.SMALLINT },
  has_pernicious_anemia: { type: DataTypes.BOOLEAN, defaultValue: false },
  has_crohns_disease: { type: DataTypes.BOOLEAN, defaultValue: false },
  has_celiac_disease: { type: DataTypes.BOOLEAN, defaultValue: false },
  has_gastric_surgery: { type: DataTypes.BOOLEAN, defaultValue: false },
  takes_metformin: { type: DataTypes.BOOLEAN, defaultValue: false },
  takes_ppi: { type: DataTypes.BOOLEAN, defaultValue: false },
  // Scoring
  raw_score: { type: DataTypes.DECIMAL(6, 2) },
  max_possible_score: { type: DataTypes.DECIMAL(6, 2) },
  normalized_score: { type: DataTypes.DECIMAL(5, 2) },
  risk_percentage: { type: DataTypes.DECIMAL(5, 2) },
  risk_level: { type: DataTypes.STRING(10), allowNull: false },
  // Category breakdown + suggestions (for frontend)
  category_breakdown: { type: DataTypes.JSONB },
  suggestions: { type: DataTypes.JSONB },
  // ML labels
  ml_label: { type: DataTypes.STRING(15) },
  doctor_confirmed: { type: DataTypes.BOOLEAN, defaultValue: false },
  lab_b12_value_pmol: { type: DataTypes.DECIMAL(8, 2) },
  // Metadata
  questions_shown: { type: DataTypes.SMALLINT },
  scoring_version: { type: DataTypes.STRING(10), defaultValue: '1.0' },
  completed_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'assessments',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Assessment;
