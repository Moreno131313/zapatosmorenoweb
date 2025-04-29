const db = require('../db/database');

class Carrito {
  /**
   * Obtiene el carrito de un usuario
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<Array>} - Productos en el carrito
   */
  static async obtenerCarrito(usuarioId) {
    try {
      console.log(`[Carrito.obtenerCarrito] Obteniendo carrito para usuario ID: ${usuarioId}`);
      
      const carrito = await db.query(
        `SELECT c.id, c.producto_id, c.cantidad, c.talla, c.color, 
                p.nombre, p.precio, p.imagen 
         FROM carrito c
         JOIN productos p ON c.producto_id = p.id
         WHERE c.usuario_id = ?
         ORDER BY c.created_at DESC`,
        [usuarioId]
      );
      
      console.log(`[Carrito.obtenerCarrito] Se encontraron ${carrito.length} productos en el carrito`);
      
      return carrito.map(item => ({
        id: item.producto_id,
        nombre: item.nombre,
        precio: parseFloat(item.precio),
        imagen: item.imagen,
        cantidad: item.cantidad,
        talla: item.talla,
        color: item.color,
        carrito_id: item.id
      }));
    } catch (error) {
      console.error('[Carrito.obtenerCarrito] Error:', error);
      throw error;
    }
  }

  /**
   * Agrega un producto al carrito
   * @param {number} usuarioId - ID del usuario
   * @param {Object} producto - Datos del producto
   * @returns {Promise<number>} - ID del registro creado
   */
  static async agregarProducto(usuarioId, producto) {
    try {
      console.log(`[Carrito.agregarProducto] Agregando producto al carrito del usuario ${usuarioId}:`, producto);
      
      const existente = await db.query(
        `SELECT id, cantidad FROM carrito 
         WHERE usuario_id = ? AND producto_id = ? AND talla = ? AND color = ?`,
        [usuarioId, producto.id, producto.talla, producto.color]
      );
      
      if (existente.length > 0) {
        const nuevaCantidad = existente[0].cantidad + producto.cantidad;
        
        await db.query(
          'UPDATE carrito SET cantidad = ?, updated_at = NOW() WHERE id = ?',
          [nuevaCantidad, existente[0].id]
        );
        
        console.log(`[Carrito.agregarProducto] Producto existente actualizado, ID: ${existente[0].id}, nueva cantidad: ${nuevaCantidad}`);
        return existente[0].id;
      } else {
        const result = await db.query(
          `INSERT INTO carrito (usuario_id, producto_id, cantidad, talla, color, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [usuarioId, producto.id, producto.cantidad, producto.talla, producto.color]
        );
        
        console.log(`[Carrito.agregarProducto] Nuevo producto agregado al carrito, ID: ${result.insertId}`);
        return result.insertId;
      }
    } catch (error) {
      console.error('[Carrito.agregarProducto] Error:', error);
      throw error;
    }
  }

  /**
   * Actualiza la cantidad de un producto en el carrito
   * @param {number} usuarioId - ID del usuario
   * @param {number} productoId - ID del producto
   * @param {string} talla - Talla del producto
   * @param {string} color - Color del producto
   * @param {number} cantidad - Nueva cantidad
   * @returns {Promise<boolean>} - true si la actualización fue exitosa
   */
  static async actualizarCantidad(usuarioId, productoId, talla, color, cantidad) {
    try {
      console.log(`[Carrito.actualizarCantidad] Actualizando cantidad para usuario ${usuarioId}, producto ${productoId}`);
      
      if (cantidad <= 0) {
        return await this.eliminarProducto(usuarioId, productoId, talla, color);
      }
      
      const result = await db.query(
        `UPDATE carrito 
         SET cantidad = ?, updated_at = NOW() 
         WHERE usuario_id = ? AND producto_id = ? AND talla = ? AND color = ?`,
        [cantidad, usuarioId, productoId, talla, color]
      );
      
      console.log(`[Carrito.actualizarCantidad] Filas afectadas: ${result.affectedRows}`);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('[Carrito.actualizarCantidad] Error:', error);
      throw error;
    }
  }

  /**
   * Elimina un producto del carrito
   * @param {number} usuarioId - ID del usuario
   * @param {number} productoId - ID del producto
   * @param {string} talla - Talla del producto
   * @param {string} color - Color del producto
   * @returns {Promise<boolean>} - true si la eliminación fue exitosa
   */
  static async eliminarProducto(usuarioId, productoId, talla, color) {
    try {
      console.log(`[Carrito.eliminarProducto] Eliminando producto del carrito para usuario ${usuarioId}, producto ${productoId}`);
      
      const result = await db.query(
        `DELETE FROM carrito 
         WHERE usuario_id = ? AND producto_id = ? AND talla = ? AND color = ?`,
        [usuarioId, productoId, talla, color]
      );
      
      console.log(`[Carrito.eliminarProducto] Filas afectadas: ${result.affectedRows}`);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('[Carrito.eliminarProducto] Error:', error);
      throw error;
    }
  }

  /**
   * Vacía todo el carrito de un usuario
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<boolean>} - true si la operación fue exitosa
   */
  static async vaciarCarrito(usuarioId) {
    try {
      console.log(`[Carrito.vaciarCarrito] Vaciando carrito para usuario ${usuarioId}`);
      
      const result = await db.query(
        'DELETE FROM carrito WHERE usuario_id = ?',
        [usuarioId]
      );
      
      console.log(`[Carrito.vaciarCarrito] Filas eliminadas: ${result.affectedRows}`);
      return true;
    } catch (error) {
      console.error('[Carrito.vaciarCarrito] Error:', error);
      throw error;
    }
  }

  /**
   * Migra el carrito de localStorage a la base de datos
   * @param {number} usuarioId - ID del usuario
   * @param {Array} items - Productos del carrito en localStorage
   * @returns {Promise<boolean>} - true si la migración fue exitosa
   */
  static async migrarDesdeLocalStorage(usuarioId, items) {
    try {
      console.log(`[Carrito.migrarDesdeLocalStorage] Migrando carrito para usuario ${usuarioId} con ${items.length} productos`);
      
      await db.transaction(async (connection) => {
        await connection.query('DELETE FROM carrito WHERE usuario_id = ?', [usuarioId]);
        
        if (items.length > 0) {
          const queryBase = `INSERT INTO carrito 
            (usuario_id, producto_id, cantidad, talla, color, created_at, updated_at) 
            VALUES `;
          
          const valores = [];
          const placeholders = items.map(item => {
            valores.push(
              usuarioId, 
              item.id, 
              item.cantidad, 
              item.talla || '', 
              item.color || ''
            );
            return '(?, ?, ?, ?, ?, NOW(), NOW())';
          }).join(', ');
          
          const query = queryBase + placeholders;
          await connection.query(query, valores);
        }
      });
      
      console.log(`[Carrito.migrarDesdeLocalStorage] Migración completada exitosamente`);
      return true;
    } catch (error) {
      console.error('[Carrito.migrarDesdeLocalStorage] Error:', error);
      throw error;
    }
  }
}

module.exports = Carrito; 