// src/models/associations.js
const Medication = require('./medication');
const Sale = require('./sale');
const Medicationhistory = require('./medicationhistory');

// Asociación entre Medication y Sale
Medication.hasMany(Sale, { foreignKey: 'medicationId', as: 'sales' });
Sale.belongsTo(Medication, { foreignKey: 'medicationId', as: 'medication' });

// Asociación entre Medicationhistory y Sale
Medicationhistory.hasMany(Sale, { foreignKey: 'medicationhistoryId', as: 'saleDetails' });
Sale.belongsTo(Medicationhistory, { foreignKey: 'medicationhistoryId', as: 'history' });

module.exports = {
  Medication,
  Sale,
  Medicationhistory
};
