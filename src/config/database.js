const { Sequelize } = require('sequelize');

// Configuración de la conexión con la base de datos MySQL
const sequelize = new Sequelize('Biomedicine', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging:false// Puedes habilitar esto si quieres ver los logs de SQL
});

module.exports = sequelize;

