//Medication model
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Medication extends Model {}

Medication.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  profitMargin: { // Nuevo campo
    type: DataTypes.FLOAT,
    allowNull: true, // Es opcional, puede ser null
    defaultValue: 0
  },
  publicPrice: { // Precio al público calculado
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  lot: {
    type: DataTypes.STRING,
    allowNull: false
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Medication',
  tableName: 'medications',
  timestamps: false
});

module.exports = Medication;
