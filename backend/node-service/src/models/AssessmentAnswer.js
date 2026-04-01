const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AssessmentAnswer = sequelize.define('AssessmentAnswer', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  assessment_id: { type: DataTypes.UUID, allowNull: false },
  user_id: { type: DataTypes.UUID, allowNull: false },   // denormalized for ML export
  question_id: { type: DataTypes.INTEGER, allowNull: false },
  // Raw answer
  answer_value: { type: DataTypes.STRING(100), allowNull: false },
  answer_label: { type: DataTypes.STRING(200) },
  // Scoring snapshot
  answer_score: { type: DataTypes.DECIMAL(4, 2), allowNull: false },
  question_weight: { type: DataTypes.DECIMAL(4, 2), allowNull: false },
  // weighted_score is a DB-generated column — we read it but don't set it
  // Question metadata snapshot
  question_category: { type: DataTypes.STRING(30) },
  question_text_snapshot: { type: DataTypes.TEXT },
  answered_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'assessment_answers',
  underscored: true,
  timestamps: false,
});

module.exports = AssessmentAnswer;
