//medicationhistory model
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Medicationhistory extends Model {}

Medicationhistory.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  medicationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'medications',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  expirationDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  lot: {
    type: DataTypes.STRING,
    allowNull: false
  },
  stockBefore: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  stockAfter: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  folio: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Medicationhistory',
  tableName: 'medicationhistories'
});

module.exports = Medicationhistory;
