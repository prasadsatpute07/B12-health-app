const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DailyCheckin = sequelize.define('DailyCheckin', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  checkin_date: { type: DataTypes.DATEONLY, allowNull: false },
  energy_score: { type: DataTypes.SMALLINT, allowNull: false, validate: { min: 0, max: 4 } },
  fatigue_score: { type: DataTypes.SMALLINT, allowNull: false, validate: { min: 0, max: 4 } },
  mood_score: { type: DataTypes.SMALLINT, allowNull: false, validate: { min: 0, max: 4 } },
  sleep_score: { type: DataTypes.SMALLINT, allowNull: false, validate: { min: 0, max: 4 } },
  focus_score: { type: DataTypes.SMALLINT, allowNull: false, validate: { min: 0, max: 4 } },
  // total_score is DB-generated; we compute it here for convenience
  notes: { type: DataTypes.TEXT },
  duration_seconds: { type: DataTypes.SMALLINT },
}, {
  tableName: 'daily_checkins',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = DailyCheckin;

const UserStreak = sequelize.define('UserStreak', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false, unique: true },
  current_streak: { type: DataTypes.INTEGER, defaultValue: 0 },
  longest_streak: { type: DataTypes.INTEGER, defaultValue: 0 },
  total_checkins: { type: DataTypes.INTEGER, defaultValue: 0 },
  last_checkin_date: { type: DataTypes.DATEONLY },
}, {
  tableName: 'user_streaks',
  underscored: true,
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at',
});

module.exports.DailyCheckin = DailyCheckin;
module.exports.UserStreak = UserStreak;
