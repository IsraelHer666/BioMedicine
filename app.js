const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const methodOverride = require('method-override');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('./src/config/database');
const { Medication, Sale } = require('./src/models/associations'); // Importar desde associations.js
const Medicationhistory = require('./src/models/medicationhistory');
const User = require('./src/models/user');
const { Op } = require('sequelize');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const getNextAvailableId = require('./src/utils/getNextAvailableId');
const getNextAvailableSaleId = require('./src/utils/getNextAvailableSaleId');
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
// Middleware de sesión

app.use(session({
  secret: 'secret-key', // Cambia esto por una clave segura
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Asegúrate de cambiar esto a true si usas HTTPS
}));
// Middleware para compartir datos de sesión con las vistas
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});
app.use((req, res, next) => {
  console.log('Session:', req.session);
  next();
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Sync model with database
 sequelize.sync({ alter: true })
   .then(() => console.log('Database & tables created/updated!'))
   .catch(err => console.error('Error syncing with the database:', err));
  // sequelize.sync({ force: true })
  // .then(() => console.log('Database & tables recreated!'))
  // .catch(err => console.error('Error syncing with the database:', err));

// Ruta para mostrar el formulario de registro
app.get('/register', ensureAuthenticated,ensureAdmin, (req, res) => {
  res.render('register', { error: null });
});
app.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.render('register', { error: 'Todos los campos son obligatorios' });
  }

  // Validación adicional para el rol si es necesario
  if (role !== 'admin' && role !== 'user') {
    return res.render('register', { error: 'Rol no válido' });
  }

  try {
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.render('register', { error: 'El nombre de usuario ya está en uso' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword, role });

    res.redirect('/login');
  } catch (err) {
    console.error('Error al registrar el usuario:', err);
    res.render('register', { error: 'Ocurrió un error al registrar la cuenta' });
  }
});


function ensureAuthenticated(req, res, next) {
  if (req.session.username) {
    return next();
  }
  res.redirect('/login'); // Redirige al login si no está autenticado
}

function ensureAdmin(req, res, next) {
  console.log('Role in session during admin access:', req.session.role); // Verifica el valor aquí
  if (req.session.role === 'admin') {
    return next();
  }
  res.redirect('/login'); // Redirige a la página de inicio si no es admin
}

  // Ruta para mostrar la vista de login
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});
// Ruta para procesar el login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.render('login', { error: 'Usuario o contraseña incorrectos' });
    }

    // Comparar la contraseña ingresada con la almacenada en la base de datos
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.render('login', { error: 'Usuario o contraseña incorrectos' });
    }

    // Guardar el usuario en la sesión
    req.session.username = username;
    req.session.role = user.role; // Asegúrate de que 'role' esté definido en el modelo de usuario
    console.log("Role stored in session:", req.session.role); // Verifica el valor aquí
    // Redirigir al dashboard o admin basado en el rol
    if (user.role === 'admin') {
      console.log("eres ", user.role)
      res.redirect('/admin');
    } else {
      res.redirect('/indexuser'); // Redirigir a la página de inicio o a donde corresponda para usuarios normales
    }
  } catch (err) {
    console.error('Error al iniciar sesión:', err);
    res.render('login', { error: 'Ocurrió un error al iniciar sesión' });
  }
});

  // Ruta para cerrar sesión
app.get('/logout', (req, res) => {
  req.session.destroy(); // Destruir la sesión
  res.redirect('/login'); // Redirigir al login
});
// Index route
app.get('/', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    // Obtener el total de ventas, total de medicamentos vendidos y medicamentos con bajo stock
    const totalVentas = await Sale.sum('total');
    const totalVendidos = await Sale.sum('quantity');
    const medicamentosEnInventario = await Medication.count();
    const medicamentosBajoStock = await Medication.findAll({
      where: {
        stock: { [Op.lte]: 2 } // Uso correcto del operador Op.lte
      }
    });

    res.render('index', {
      totalVentas: totalVentas || 0,
      totalVendidos: totalVendidos || 0,
      medicamentosEnInventario,
      medicamentosBajoStock
    });
  } catch (err) {
    console.error('Error al cargar los datos del index:', err.message);
    res.status(500).json({ message: err.message });
  }
});
app.get("/indexuser",ensureAuthenticated, async (req,res)=>{
  try {
    // Obtener el total de ventas, total de medicamentos vendidos y medicamentos con bajo stock
    const totalVentas = await Sale.sum('total');
    const totalVendidos = await Sale.sum('quantity');
    const medicamentosEnInventario = await Medication.count();
    const medicamentosBajoStock = await Medication.findAll({
      where: {
        stock: { [Op.lte]: 2 } // Uso correcto del operador Op.lte
      }
    });

    res.render('indexuser', {
      totalVentas: totalVentas || 0,
      totalVendidos: totalVendidos || 0,
      medicamentosEnInventario,
      medicamentosBajoStock
    });
  } catch (err) {
    console.error('Error al cargar los datos del index:', err.message);
    res.status(500).json({ message: err.message });
  }
});
app.get('/api/low-stock', async (req, res) => {
  try {
      const lowStockMedications = await Medication.findAll({
          where: {
              stock: {
                  [Op.lte]: 2
              }
          }
      });
      res.json({ lowStockMedications });
  } catch (err) {
    console.error('Error al obtener medicamentos con bajo stock:', err.message);
      res.status(500).json({ message: 'Error al obtener medicamentos con bajo stock', error: err.message });
  }
});
// Admin route
app.get('/admin', ensureAuthenticated, ensureAdmin, async (req, res) => {
  console.log('Admin route accessed');
  try {
    const medications = await Medication.findAll();
    res.render('admin', { medications, session: req.session });
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
app.get('/register-sale',ensureAuthenticated,ensureAdmin, async (req, res) => {
  try {
    const medications = await Medication.findAll();
    const sales = await Sale.findAll({
      include: {
        model: Medication,
        as: 'medication'
      }
    });
    res.render('register-sale', { medications, sales,session:req.session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.get('/register-sale-user',ensureAuthenticated, async (req, res) => {
  try {
    const medications = await Medication.findAll();
    const sales = await Sale.findAll({
      include: {
        model: Medication,
        as: 'medication'
      }
    });
    res.render('register-sale-user', { medications, sales,session:req.session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
//Registrar venta
app.post('/api/register-sale', async (req, res) => {
  const { medicationId, quantity } = req.body;
  try {
    const medication = await Medication.findByPk(medicationId);
    if (medication) {
      if (medication.stock >= quantity) {
        // Obtener el siguiente ID disponible para la venta
        const nextSaleId = await getNextAvailableSaleId();
        const total = medication.publicPrice * quantity; // Calcula el total
        const sale = await Sale.create({ id: nextSaleId, medicationId, quantity, total });
        
        // Actualizar el stock
        medication.stock -= quantity;
        await medication.save();

        // Devuelve los datos actualizados
        res.status(200).json({
          message: 'Venta registrada exitosamente',
          sale: {
            medication: await medication.get(),
            quantity,
            date: sale.date,
            total: sale.total // Incluye el total en la respuesta
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
// Eliminar venta
app.delete('/api/sales/:id', async (req, res) => {
  try {
    const saleId = req.params.id;
    console.log(`Attempting to delete sale with ID: ${saleId}`);

    const sale = await Sale.findByPk(saleId);
    if (sale) {
      console.log(`Sale found: ${JSON.stringify(sale)}`);

      // Actualizar stock del medicamento
      const medication = await Medication.findByPk(sale.medicationId);
      if (medication) {
        console.log(`Medication found: ${JSON.stringify(medication)}`);
        medication.stock += sale.quantity;
        await medication.save();
        console.log(`Updated medication stock: ${medication.stock}`);
      }

      await sale.destroy();
      console.log(`Sale with ID: ${saleId} deleted`);

      // Reajustar los IDs de las ventas restantes
      const remainingSales = await Sale.findAll({
        order: [['id', 'ASC']],
      });
      console.log(`Remaining sales: ${JSON.stringify(remainingSales)}`);
      
      for (let i = 0; i < remainingSales.length; i++) {
        remainingSales[i].id = i + 1;
        await remainingSales[i].save();
        console.log(`Updated sale ID to: ${remainingSales[i].id}`);
      }

      // Enviar los datos actualizados del medicamento
      res.status(200).json({
        message: 'Venta eliminada exitosamente',
        medication: await medication.get()
      });
    } else {
      res.status(404).json({ message: 'Venta no encontrada' });
    }
  } catch (err) {
    console.error('Error al eliminar venta:', err.message);
    res.status(500).json({ message: err.message });
  }
});
// Añadir medicamentos
app.post('/api/medications', async (req, res) => {
  const { name, description, expirationDate, price, profitMargin, lot, stock } = req.body;
  
  // Validación de campos
  if (!name || !description || !expirationDate || !price || !profitMargin || !lot || !stock) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }

  try {
    const nextId = await getNextAvailableId();
    
    // Calcular el precio al público
    const publicPrice = price * (1 + profitMargin / 100);
    
    await Medication.create({ id: nextId, name, description, expirationDate, price, profitMargin, publicPrice, lot, stock });
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
  const { name, description, expirationDate, price, profitMargin, lot, stock } = req.body;
  try {
    const medication = await Medication.findByPk(req.params.id);
    if (medication) {
      medication.name = name;
      medication.description = description;
      medication.expirationDate = expirationDate;
      medication.price = price;
      medication.profitMargin = profitMargin;
      
      // Calcular el precio al público
      medication.publicPrice = price * (1 + profitMargin / 100);
      
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
