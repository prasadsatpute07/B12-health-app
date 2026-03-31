const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
  password_hash: { type: DataTypes.STRING(255) },
  google_id: { type: DataTypes.STRING(255), unique: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'users',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = User;
