const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Question = sequelize.define('Question', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  question_text: { type: DataTypes.TEXT, allowNull: false },
  category: { type: DataTypes.STRING(30), allowNull: false },
  question_type: { type: DataTypes.STRING(20), defaultValue: 'multiple_choice' },
  audience: { type: DataTypes.STRING(20), defaultValue: 'all' },
  age_group: { type: DataTypes.STRING(20), defaultValue: 'all' },
  weight: { type: DataTypes.DECIMAL(4, 2), allowNull: false, defaultValue: 1.0 },
  max_option_score: { type: DataTypes.DECIMAL(4, 2), allowNull: false, defaultValue: 4.0 },
  options: { type: DataTypes.JSONB, allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  display_order: { type: DataTypes.SMALLINT, defaultValue: 0 },
}, {
  tableName: 'questions',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Question;
