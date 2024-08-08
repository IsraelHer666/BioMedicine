// src/utils/getNextAvailableSaleId.js
const { Sale } = require('../models/associations');

const getNextAvailableSaleId = async () => {
  const sales = await Sale.findAll({ order: [['id', 'DESC']] });
  if (sales.length === 0) return 1; // Si no hay ventas, el ID inicial es 1
  return sales[0].id + 1; // El siguiente ID disponible es el máximo actual + 1
};

module.exports = getNextAvailableSaleId;
