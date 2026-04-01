const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const UserBmiLog = sequelize.define('UserBmiLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
  height_cm: { type: DataTypes.FLOAT, allowNull: false },
  weight_kg: { type: DataTypes.FLOAT, allowNull: false },
  bmi: { type: DataTypes.FLOAT, allowNull: false },
  bmi_category: { type: DataTypes.STRING(20), allowNull: false }, // 'underweight'|'normal'|'overweight'|'obese'
  measured_at: { type: DataTypes.DATEONLY, allowNull: false },
}, {
  tableName: 'user_bmi_logs',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = UserBmiLog;
