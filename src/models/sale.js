//sale model
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Sale extends Model {}

Sale.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  medicationId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'medications',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  medicationhistoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'medicationhistories',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  }
}, {
  sequelize,
  modelName: 'Sale',
  tableName: 'sales'
});

module.exports = Sale;
