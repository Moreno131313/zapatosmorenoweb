/**
 * Middleware para manejo centralizado de errores
 * Captura errores y envía respuestas formateadas
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Log del stack trace en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
  
  // Determinar el tipo de error y enviar respuesta apropiada
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: true,
      mensaje: 'Error de validación',
      detalles: err.message
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: true,
      mensaje: 'Token inválido'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: true,
      mensaje: 'Token expirado'
    });
  }
  
  // Error de base de datos
  if (err.code && (err.code.startsWith('ER_') || err.errno)) {
    return res.status(500).json({
      error: true,
      mensaje: 'Error de base de datos',
      detalles: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor'
    });
  }
  
  // Error por defecto para cualquier otro tipo de error
  res.status(500).json({
    error: true,
    mensaje: 'Error interno del servidor',
    detalles: process.env.NODE_ENV === 'development' ? err.message : null
  });
};

module.exports = errorHandler; 