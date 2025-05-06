const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { inicializarBaseDatos } = require('./db/database');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

// Importar middleware de manejo de errores
const errorHandler = require('./middleware/errorHandler');

// Importar rutas
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const addressRoutes = require('./routes/addressRoutes');
const sqliteAddressRoutes = require('./routes/sqlite-address-routes'); // Rutas SQLite
const profileRoutes = require('./routes/profileRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const cartRoutes = require('./routes/cartRoutes');

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

// Variable para forzar el uso de SQLite
const USE_SQLITE_ONLY = false; // Usar MySQL

// Configuración de CORS para permitir solicitudes de cualquier origen
const corsOptions = {
  origin: '*', // Permitir todos los orígenes
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Middleware para evitar cacheo de archivos estáticos
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// Middleware para registro de solicitudes HTTP
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.method === 'POST' && req.url.includes('/registro')) {
    console.log('Datos de registro:', JSON.stringify(req.body));
  }
  next();
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta API perfil directa para diagnóstico
app.get('/api/perfil-diagnostico', (req, res) => {
  res.json({
    id: 99,
    nombre: "Usuario Test Diagnóstico",
    email: "test@diagnostico.com",
    telefono: "123-456-7890",
    fecha_nacimiento: "01/01/2000",
    genero: "No especificado"
  });
});

// Ruta de prueba
app.get('/api/status', (req, res) => {
  res.json({
    status: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Crear tabla de carrito al iniciar el servidor
const crearTablaCarrito = require('./db/migrations/03_crear_tabla_carrito');

// Usar rutas - Primero usar authRoutes para priorizar esa implementación
app.use('/api/auth', authRoutes);
app.use('/api/usuario', usuarioRoutes);
app.use('/api/productos', productRoutes);
app.use('/api/pedidos', orderRoutes);
app.use('/api/direcciones', sqliteAddressRoutes); // Usar SQLite en lugar de MySQL
app.use('/api/usuario', profileRoutes);
app.use('/api/carrito', cartRoutes);

// Ruta de debug para direcciones (utilizando la ruta definida en addressRoutes)
app.use('/api/direcciones-debug', sqliteAddressRoutes); // Usar SQLite en lugar de MySQL
app.use('/api/direcciones-mysql', addressRoutes); // Mantener acceso a rutas MySQL por si acaso

// Ruta directa para el perfil de usuario (GET)
app.get('/api/perfil', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ mensaje: 'No autorizado, token no proporcionado' });
    }
    
    const jwt = require('jsonwebtoken');
    const userData = jwt.verify(token, process.env.JWT_SECRET || 'secreto');
    
    const userId = userData.id;
    
    const usuario = await inicializarBaseDatos();
    
    if (usuario.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    
    res.json({ usuario: usuario[0] });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(401).json({ mensaje: 'No autorizado, token inválido' });
  }
});

// Ruta para SPA (frontend) - Esta debe ir después de las rutas API
app.get('*', (req, res) => {
  // Only redirect to index.html for non-API requests
  if (req.url.startsWith('/api/')) {
    // Skip handling for API routes that weren't handled by previous middleware
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  
  if (req.url.endsWith('.html')) {
    res.sendFile(path.join(__dirname, 'public', req.url.substring(1)));
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// Manejo de errores centralizado
app.use(errorHandler);

// Manejo global de errores 
app.use((err, req, res, next) => {
  console.error('Error global:', err.stack);
  res.status(500).json({
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

// Inicialización de la base de datos
async function inicializarServidor() {
  try {
    // Verificar la conexión a la base de datos
    if (USE_SQLITE_ONLY) {
      console.log('ℹ️ Iniciando en modo SQLite solamente. Omitiendo verificación de MySQL.');
      iniciarServidor();
      return;
    }
    
    const conexionOk = await inicializarBaseDatos();
    
    if (!conexionOk) {
      console.error('❌ No se pudo establecer conexión con la base de datos. Abortando inicio del servidor.');
      process.exit(1);
      return;
    }
    
    // Ejecutar migraciones
    try {
      await crearTablaCarrito();
    } catch (migracionError) {
      console.error('Error en migración de tabla carrito:', migracionError);
    }
    
    // Iniciar el servidor una vez verificada la base de datos
    iniciarServidor();
  } catch (error) {
    console.error('Error al inicializar servidor:', error);
    process.exit(1);
  }
}

// Intenta detectar y liberar el puerto si está en uso
const detectPort = (port) => {
  return new Promise((resolve, reject) => {
    const server = require('http').createServer();
    
    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        console.log(`⚠️ Puerto ${port} en uso, intentando forzar liberación...`);
        
        // Intentar liberar el puerto usando otro servidor
        require('http').createServer().listen(port, () => {
          console.log(`Puerto ${port} liberado con éxito`);
          server.close();
          resolve(port);
        }).on('error', () => {
          console.log(`❌ No se pudo liberar el puerto ${port}, usando puerto alternativo...`);
          resolve(port + 1); // Usar puerto alternativo
        });
      } else {
        reject(e);
      }
    });
    
    server.listen(port, () => {
      server.close();
      resolve(port);
    });
  });
};

// Iniciar el servidor con manejo de puerto automático
async function iniciarServidor() {
  try {
    // Detectar y liberar puerto si es necesario
    const puertoDisponible = await detectPort(PORT);
    
    if (puertoDisponible !== PORT) {
      console.log(`⚠️ Puerto original ${PORT} en uso, usando puerto ${puertoDisponible} en su lugar`);
    }
    
    // Iniciar servidor
    app.listen(puertoDisponible, '0.0.0.0', () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${puertoDisponible}`);
      console.log(`También puedes acceder desde otro dispositivo en la misma red`);
      console.log(USE_SQLITE_ONLY ? '⚠️ Ejecutando con SQLite solamente (sin MySQL)' : '✅ MySQL conectado correctamente');
    });
  } catch (error) {
    console.error('❌ Error crítico al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Iniciar el servidor
inicializarServidor();