const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const UserProfile = sequelize.define('UserProfile', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
  name: { type: DataTypes.STRING(255) },
  age: { type: DataTypes.SMALLINT, validate: { min: 1, max: 120 } },
  age_group: { type: DataTypes.STRING(10) },
  gender: { type: DataTypes.STRING(20) },
  diet_type: { type: DataTypes.STRING(20) },
  diet_penalty_score: { type: DataTypes.SMALLINT, defaultValue: 0 },
  has_pernicious_anemia: { type: DataTypes.BOOLEAN, defaultValue: false },
  has_crohns_disease: { type: DataTypes.BOOLEAN, defaultValue: false },
  has_celiac_disease: { type: DataTypes.BOOLEAN, defaultValue: false },
  has_gastric_surgery: { type: DataTypes.BOOLEAN, defaultValue: false },
  has_ibs: { type: DataTypes.BOOLEAN, defaultValue: false },
  takes_metformin: { type: DataTypes.BOOLEAN, defaultValue: false },
  takes_ppi: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_pregnant: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_breastfeeding: { type: DataTypes.BOOLEAN, defaultValue: false },
  alcohol_frequency: { type: DataTypes.STRING(20) },
  smoking_status: { type: DataTypes.STRING(20) },
}, {
  tableName: 'user_profiles',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = UserProfile;
