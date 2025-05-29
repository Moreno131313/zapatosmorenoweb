const path = require('path');
const compression = require('compression');
const express = require('express');

/**
 * Middleware para optimizar el rendimiento de la aplicación
 * Implementa soluciones para los problemas detectados en CP-003
 */
const setupOptimizationMiddleware = (app) => {
  // 1. Compresión GZIP para reducir tamaño de transferencia
  app.use(compression({
    level: 6, // Nivel de compresión balanceado (1-9)
    threshold: 1024, // Comprimir solo respuestas mayores a 1KB
  }));

  // 2. Cache para archivos estáticos (reduce TTFB)
  app.use(express.static(path.join(__dirname, '../public'), {
    maxAge: '1d', // Cache de un día para archivos estáticos
    etag: true,   // Habilitar etiquetas ETag para validación
    lastModified: true
  }));

  // 3. Cache para imágenes con tiempo de expiración más largo
  app.use('/imagenes', express.static(path.join(__dirname, '../public/imagenes'), {
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

  console.log('✅ Middleware de optimización configurado correctamente');
};

module.exports = setupOptimizationMiddleware; 