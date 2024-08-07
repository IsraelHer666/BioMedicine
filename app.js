const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const methodOverride = require('method-override');
const path = require('path');
const getNextAvailableId = require('./src/utils/getNextAvailableId');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('./src/config/database');
const { Medication, Sale } = require('./src/models/associations'); // Importar desde associations.js
const Medicationhistory = require('./src/models/medicationhistory');
const app = express();
const PORT = 5000;

// Set EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(methodOverride('_method'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Sync model with database
 sequelize.sync({ alter: true })
   .then(() => console.log('Database & tables created/updated!'))
   .catch(err => console.error('Error syncing with the database:', err));
  // sequelize.sync({ force: true })
  // .then(() => console.log('Database & tables recreated!'))
  // .catch(err => console.error('Error syncing with the database:', err));


// Index route
app.get('/', async (req, res) => {
  res.render("index");
});

// Admin route
app.get('/admin', async (req, res) => {
  try {
    const medications = await Medication.findAll();
    res.render('admin', { medications });
  } catch (err) {
    console.error('Error fetching medications:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Ruta para mostrar el historial de medicamentos eliminados
app.get('/history', async (req, res) => {
  try {
    const medicationhistories = await Medicationhistory.findAll({
      include: [
        {
          model: Sale,
          as: 'saleDetails'
        }
      ]
    });

    medicationhistories.forEach(history => {
      if (!Array.isArray(history.saleDetails)) {
        history.saleDetails = [];
      }
    });

    res.render('history', { medicationhistories });
  } catch (err) {
    console.error('Error al cargar historial:', err.message);
    res.status(500).send('Error al cargar historial');
  }
});

// Route to display the register sale view
app.get('/register-sale', async (req, res) => {
  try {
    const medications = await Medication.findAll();
    const sales = await Sale.findAll({
      include: {
        model: Medication,
        as: 'medication'
      }
    });
    res.render('register-sale', { medications, sales });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/register-sale', async (req, res) => {
  const { medicationId, quantity } = req.body;
  try {
    const medication = await Medication.findByPk(medicationId);
    if (medication) {
      if (medication.stock >= quantity) {
        // Crea la venta
        const sale = await Sale.create({ medicationId, quantity });
        
        // Actualiza el stock
        medication.stock -= quantity;
        await medication.save();

        // Devuelve los datos actualizados
        res.status(200).json({
          message: 'Venta registrada exitosamente',
          sale: {
            medication: await medication.get(),
            quantity,
            date: sale.date
          },
          medication: await medication.get()
        });
      } else {
        res.status(400).json({ message: 'Stock insuficiente' });
      }
    } else {
      res.status(404).json({ message: 'Medicamento no encontrado' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/medications', async (req, res) => {
  const { name, description, expirationDate, price, lot, stock } = req.body;
  
  // Validación de campos
  if (!name || !description || !expirationDate || !price || !lot || !stock) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }
  
  try {
    const nextId = await getNextAvailableId();
    await Medication.create({ id: nextId, name, description, expirationDate, price, lot, stock });
    res.redirect('/admin');
  } catch (err) {
    console.error('Error al agregar medicamento:', err.errors ? err.errors.map(e => e.message).join(', ') : err.message);
    res.status(400).json({ message: err.errors ? err.errors.map(e => e.message).join(', ') : err.message });
  }
});

// Delete medication route
app.delete('/api/medications/:id', async (req, res) => {
  try {
    const medication = await Medication.findByPk(req.params.id);
    if (medication) {
      const sales = await Sale.findAll({ where: { medicationId: req.params.id } });
      const saleDetails = sales.map(sale => ({
        quantity: sale.quantity,
        createdAt: sale.createdAt,
        folio: uuidv4()
      }));

      await Medicationhistory.create({
        medicationId: medication.id,
        name: medication.name,
        description: medication.description,
        expirationDate: medication.expirationDate,
        price: medication.price,
        lot: medication.lot,
        stockBefore: medication.stock,
        stockAfter: 0,
        saleDetails: saleDetails,
        folio: uuidv4()
      });

      await Sale.destroy({ where: { medicationId: req.params.id } });
      await medication.destroy();
      res.sendStatus(204); // Send no content status
    } else {
      res.status(404).json({ message: 'Medication not found' });
    }
  } catch (err) {
    console.error('Error al eliminar medicamento:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Update medication
app.put('/api/medications/:id', async (req, res) => {
  const { name, description, expirationDate, price, lot, stock } = req.body;
  try {
    const medication = await Medication.findByPk(req.params.id);
    if (medication) {
      medication.name = name;
      medication.description = description;
      medication.expirationDate = expirationDate;
      medication.price = price;
      medication.lot = lot;
      medication.stock = stock;
      await medication.save();
      res.json({ message: 'Medicamento actualizado con éxito' });
    } else {
      res.status(404).json({ message: 'Medicamento no encontrado' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Sale route
app.post('/api/register-sale', async (req, res) => {
  const { medicationId, quantity } = req.body;
  try {
    const medication = await Medication.findByPk(medicationId);
    if (medication) {
      if (medication.stock >= quantity) {
        await Sale.create({ medicationId, quantity });
        medication.stock -= quantity;
        await medication.save();
        res.redirect('/register-sale');
      } else {
        res.status(400).json({ message: 'Insufficient stock' });
      }
    } else {
      res.status(404).json({ message: 'Medication not found' });
    }
  } catch (err) {
    res.status(500).json({ message});
  }
});

// Middleware para manejar errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo salió mal!');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
