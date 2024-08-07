// src/utils/getNextAvailableId.js
const { Op } = require('sequelize');
const Medication = require('../models/medication');

const getNextAvailableId = async () => {
  // Primero, intenta encontrar el ID más bajo que no está en uso
  const availableId = await Medication.findOne({
    attributes: ['id'],
    where: {
      id: {
        [Op.notIn]: await Medication.findAll({
          attributes: ['id'],
          order: [['id', 'ASC']],
          raw: true,
        }).then(records => records.map(record => record.id))
      }
    },
    order: [['id', 'ASC']],
  });

  // Si se encuentra un ID disponible, devuélvelo
  if (availableId) {
    return availableId.id;
  }

  // Si no hay IDs disponibles, devuelve el siguiente ID secuencial
  const maxId = await Medication.max('id');
  return maxId ? maxId + 1 : 1;
};

module.exports = getNextAvailableId;
