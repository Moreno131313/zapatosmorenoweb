const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { inicializarBaseDatos } = require('./db/database');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const compression = require('compression');
const cluster = require('cluster');
const os = require('os');

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

// Variable para forzar el uso de SQLite
const USE_SQLITE_ONLY = false; // Usar MySQL

// Configuración para optimización del servidor
const MAX_WORKERS = Math.min(os.cpus().length, 4); // Máximo 4 workers para evitar overhead

// Función principal de inicialización del servidor
function iniciarServidorOptimizado() {
  // Si es el proceso maestro y estamos en producción, iniciamos workers
  if (cluster.isMaster && process.env.NODE_ENV === 'production') {
    console.log(`🚀 Iniciando servidor en modo cluster con ${MAX_WORKERS} workers`);
    
    // Crear workers
    for (let i = 0; i < MAX_WORKERS; i++) {
      cluster.fork();
    }
    
    // Manejar errores en los workers
    cluster.on('exit', (worker, code, signal) => {
      console.log(`⚠️ Worker ${worker.process.pid} terminado. Reiniciando...`);
      cluster.fork(); // Reiniciar worker caído
    });
  } else {
    // Código del worker o servidor en modo desarrollo
    inicializarAplicacion();
  }
}

// Inicializar la aplicación Express
function inicializarAplicacion() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000');

  // Configuración de CORS para permitir solicitudes de cualquier origen
  const corsOptions = {
    origin: '*', // Permitir todos los orígenes
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  };

  // Middleware básico
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan('dev'));

  // Optimizaciones de rendimiento
  
  // 1. Compresión GZIP para reducir tamaño de transferencia
  app.use(compression({
    level: 6, // Nivel de compresión balanceado (1-9)
    threshold: 1024, // Comprimir solo respuestas mayores a 1KB
    filter: (req, res) => {
      // No comprimir imágenes que ya están comprimidas
      if (req.url.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));

  // 2. Cache para archivos estáticos (reduce TTFB)
  app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d', // Cache de un día para archivos estáticos
    etag: true,   // Habilitar etiquetas ETag para validación
    lastModified: true
  }));

  // 3. Cache para imágenes con tiempo de expiración más largo
  app.use('/imagenes', express.static(path.join(__dirname, 'public/imagenes'), {
    maxAge: '7d', // Cache de una semana para imágenes
    immutable: true
  }));

  // 4. Middleware para priorizar carga de CSS crítico
  app.use((req, res, next) => {
    // Solo para páginas HTML
    const originalSend = res.send;
    
    res.send = function(body) {
      // Si es HTML, inyectar headers para priorizar CSS
      if (typeof body === 'string' && body.includes('<!DOCTYPE html>')) {
        // Inyectar encabezados para priorizar CSS
        res.setHeader('Link', '</css/styles.css>; rel=preload; as=style');
        
        // Inyectar CSS crítico inline para mejorar FMP
        const criticalCss = `
        <style>
          /* CSS crítico para primer renderizado */
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          .header { background-color: #4a90e2; color: white; padding: 10px; }
          .content { padding: 20px; }
        </style>`;
        
        // Insertar CSS crítico después del tag <head>
        body = body.replace('<head>', '<head>' + criticalCss);
      }
      return originalSend.call(this, body);
    };
    
    next();
  });

  // 5. Cache de rutas API frecuentemente accedidas para reducir carga de CPU
  const apiCache = {};
  const API_CACHE_DURATION = 60 * 1000; // 1 minuto en ms

  app.use('/api', (req, res, next) => {
    // Solo aplicar cache a peticiones GET
    if (req.method !== 'GET') return next();
    
    const cacheKey = req.originalUrl;
    const cachedResponse = apiCache[cacheKey];
    
    // Si existe en cache y no ha expirado
    if (cachedResponse && (Date.now() - cachedResponse.timestamp < API_CACHE_DURATION)) {
      return res.json(cachedResponse.data);
    }
    
    // Interceptar el método json para cachear la respuesta
    const originalJson = res.json;
    res.json = function(data) {
      apiCache[cacheKey] = {
        data,
        timestamp: Date.now()
      };
      return originalJson.call(this, data);
    };
    
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

  // Función para iniciar el servidor HTTP
  async function iniciarServidor() {
    try {
      const puertoDisponible = await detectPort(PORT);
      
      if (puertoDisponible !== PORT) {
        console.log(`⚠️ Puerto ${PORT} no disponible, utilizando puerto ${puertoDisponible} en su lugar.`);
      }
      
      const server = app.listen(puertoDisponible, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${puertoDisponible}`);
        
        // Obtener direcciones IP locales para acceso desde otros dispositivos
        const interfaces = os.networkInterfaces();
        const addresses = [];
        
        for (const iface of Object.values(interfaces)) {
          for (const alias of iface) {
            if (alias.family === 'IPv4' && !alias.internal) {
              addresses.push(alias.address);
            }
          }
        }
        
        if (addresses.length > 0) {
          console.log('También puedes acceder desde otro dispositivo en la misma red');
          for (const address of addresses) {
            console.log(`http://${address}:${puertoDisponible}`);
          }
        }
      });
      
      // Optimizar configuración del servidor HTTP para mejorar TTFB
      server.keepAliveTimeout = 65000; // Mantener conexiones abiertas (ms)
      server.headersTimeout = 66000; // Timeout para headers (ms)
      
      // Asignar servidor a la app para usar en otros lugares
      app.server = server;
    } catch (error) {
      console.error('Error al iniciar el servidor:', error);
      process.exit(1);
    }
  }

  // Iniciar el proceso de inicialización del servidor
  inicializarServidor();
}

// Iniciar el servidor optimizado
iniciarServidorOptimizado();

// Exportar la aplicación para testing
module.exports = app;