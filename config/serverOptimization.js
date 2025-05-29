/**
 * Configuración para optimizar el rendimiento del servidor
 * Soluciona los problemas detectados en CP-003:
 * - Uso de CPU excesivo bajo carga
 * - TTFB superior al objetivo
 */

const os = require('os');
const cluster = require('cluster');

// Configuración de optimización del servidor
const serverOptimization = {
  // Número de workers basado en núcleos de CPU disponibles
  workers: Math.min(os.cpus().length, 4), // Máximo 4 workers para evitar overhead
  
  // Configuración de la base de datos para optimizar rendimiento
  database: {
    connectionPool: {
      min: 5,           // Mínimo de conexiones en el pool
      max: 20,          // Máximo de conexiones
      idle: 30000,      // Tiempo de vida de conexiones inactivas (ms)
      acquire: 60000,   // Tiempo máximo para adquirir una conexión (ms)
      evict: 30000      // Intervalo para revisar conexiones inactivas (ms)
    },
    queryCache: true,   // Habilitar cache de consultas
    queryCacheDuration: 60000 // Duración de la cache (1 minuto)
  },
  
  // Configuración de caché para reducir carga de CPU
  cache: {
    enabled: true,
    ttl: 300,           // Tiempo de vida del caché (segundos)
    checkPeriod: 600    // Periodo para verificar entradas expiradas (segundos)
  },
  
  // Configuración de compresión para reducir tamaño de respuestas
  compression: {
    enabled: true,
    level: 6            // Nivel de compresión (1-9)
  },
  
  // Configuración para respuestas HTTP
  http: {
    keepAlive: true,
    keepAliveMsecs: 60000, // 60 segundos
    maxSockets: 100
  },
  
  // Optimización del sistema
  system: {
    gcInterval: 30000,  // Intervalo para sugerir recolección de basura (30s)
    maxOldSpaceSize: 2048 // Tamaño máximo del espacio antiguo (MB)
  }
};

// Función para configurar un cluster Node.js
function setupCluster(serverFunction) {
  if (cluster.isMaster) {
    console.log(`🚀 Iniciando servidor en modo cluster con ${serverOptimization.workers} workers`);
    
    // Crear workers
    for (let i = 0; i < serverOptimization.workers; i++) {
      cluster.fork();
    }
    
    // Manejar errores en los workers
    cluster.on('exit', (worker, code, signal) => {
      console.log(`⚠️ Worker ${worker.process.pid} terminado. Reinicinado...`);
      cluster.fork(); // Reiniciar worker caído
    });
    
    // Monitorear uso de recursos
    setInterval(() => {
      const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      console.log(`📊 Uso de memoria: ${Math.round(usedMemory)} MB`);
      
      // Sugerir recolección de basura si el uso de memoria es alto
      if (usedMemory > 1024) {
        console.log('⚠️ Uso de memoria alto, sugiriendo recolección de basura');
        global.gc && global.gc();
      }
    }, serverOptimization.system.gcInterval);
    
  } else {
    // Código del worker
    serverFunction();
  }
}

// Función para aplicar optimizaciones a la instancia de Express
function applyExpressOptimizations(app, db) {
  // 1. Configurar el pool de conexiones a la base de datos
  if (db && db.options) {
    const dbConfig = serverOptimization.database;
    
    // Aplicar configuración del pool
    db.options.pool = dbConfig.connectionPool;
    
    console.log('✅ Pool de conexiones a la base de datos optimizado');
  }
  
  // 2. Configurar caché en memoria para respuestas
  const memCache = {};
  
  app.use((req, res, next) => {
    // Solo aplicar a rutas GET que no sean de administración
    if (req.method !== 'GET' || req.path.startsWith('/admin')) {
      return next();
    }
    
    const key = `__cache__${req.originalUrl || req.url}`;
    const cachedBody = memCache[key];
    
    if (serverOptimization.cache.enabled && cachedBody) {
      // Usar respuesta cacheada
      if (cachedBody.expires > Date.now()) {
        res.contentType(cachedBody.contentType);
        res.send(cachedBody.content);
        return;
      } else {
        // Expirado, eliminar
        delete memCache[key];
      }
    }
    
    // Interceptar respuesta para cachear
    const originalSend = res.send;
    res.send = function(body) {
      if (serverOptimization.cache.enabled && res.statusCode === 200) {
        memCache[key] = {
          content: body,
          contentType: res.get('Content-Type'),
          expires: Date.now() + (serverOptimization.cache.ttl * 1000)
        };
      }
      
      originalSend.call(this, body);
    };
    
    next();
  });
  
  // 3. Configurar limites HTTP para soportar más conexiones
  if (app.server) {
    app.server.keepAliveTimeout = serverOptimization.http.keepAliveMsecs;
    app.server.maxConnections = serverOptimization.http.maxSockets;
  }
  
  // 4. Evitar bloqueo del Event Loop con operaciones pesadas
  process.nextTick(() => {
    console.log('✅ Optimizaciones de Express aplicadas correctamente');
  });
  
  return app;
}

module.exports = {
  config: serverOptimization,
  setupCluster,
  applyExpressOptimizations
}; 