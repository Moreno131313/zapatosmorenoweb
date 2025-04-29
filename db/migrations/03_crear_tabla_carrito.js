const db = require('../database');

/**
 * Crear la tabla carrito para almacenar los productos en el carrito de compras de usuarios
 */
async function crearTablaCarrito() {
  try {
    console.log('[Migración] Iniciando creación de tabla carrito...');
    
    // Verificar si la tabla ya existe
    const [tablas] = await db.pool.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'carrito'
    `, [process.env.DB_NAME || 'zapatosmoreno']);
    
    if (tablas.length > 0) {
      console.log('[Migración] La tabla carrito ya existe, saltando creación');
      return;
    }
    
    // Crear la tabla carrito
    console.log('[Migración] Creando tabla carrito...');
    await db.query(`
      CREATE TABLE carrito (
        id INT PRIMARY KEY AUTO_INCREMENT,
        usuario_id INT NOT NULL,
        producto_id INT NOT NULL,
        cantidad INT NOT NULL DEFAULT 1,
        talla VARCHAR(10),
        color VARCHAR(30),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        INDEX idx_usuario_id (usuario_id),
        INDEX idx_producto_id (producto_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('[Migración] ✅ Tabla carrito creada correctamente');
  } catch (error) {
    console.error('[Migración] Error al crear tabla carrito:', error);
    throw error;
  }
}

module.exports = crearTablaCarrito; 