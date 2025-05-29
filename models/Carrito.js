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
                p.nombre, p.precio, p.imagen, p.stock,
                (SELECT COUNT(*) FROM inventario i 
                 WHERE i.producto_id = p.id 
                 AND i.talla = c.talla 
                 AND i.color = c.color) as stock_disponible
         FROM carrito c
         JOIN productos p ON c.producto_id = p.id
         WHERE c.usuario_id = ?
         ORDER BY c.created_at DESC`,
        [usuarioId]
      );
      
      console.log(`[Carrito.obtenerCarrito] Se encontraron ${carrito.length} productos en el carrito`);
      
      return carrito.map(item => ({
        id: item.producto_id,
        carrito_id: item.id,
        nombre: item.nombre,
        precio: parseFloat(item.precio),
        imagen: item.imagen,
        cantidad: item.cantidad,
        talla: item.talla,
        color: item.color,
        stock: item.stock,
        stock_disponible: item.stock_disponible,
        subtotal: parseFloat(item.precio) * item.cantidad
      }));
    } catch (error) {
      console.error('[Carrito.obtenerCarrito] Error:', error);
      throw new Error('Error al obtener el carrito');
    }
  }

  /**
   * Verifica el stock disponible de un producto
   * @param {number} productoId - ID del producto
   * @param {string} talla - Talla del producto
   * @param {string} color - Color del producto
   * @returns {Promise<number>} - Stock disponible
   */
  static async verificarStock(productoId, talla, color) {
    try {
      const [stock] = await db.query(
        `SELECT COUNT(*) as stock
         FROM inventario
         WHERE producto_id = ? AND talla = ? AND color = ?`,
        [productoId, talla, color]
      );
      
      return stock.stock || 0;
    } catch (error) {
      console.error('[Carrito.verificarStock] Error:', error);
      throw new Error('Error al verificar stock');
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
      
      const { producto_id, cantidad, talla, color } = producto;

      // Verificar si el producto ya está en el carrito
      const [existente] = await db.query(
        `SELECT id, cantidad 
         FROM carrito 
         WHERE usuario_id = ? AND producto_id = ? AND talla = ? AND color = ?`,
        [usuarioId, producto_id, talla, color]
      );

      if (existente) {
        // Actualizar cantidad si ya existe
        const nuevaCantidad = existente.cantidad + cantidad;
        
        await db.query(
          'UPDATE carrito SET cantidad = ?, updated_at = NOW() WHERE id = ?',
          [nuevaCantidad, existente.id]
        );
        
        console.log(`[Carrito.agregarProducto] Producto existente actualizado, ID: ${existente.id}, nueva cantidad: ${nuevaCantidad}`);
        return existente.id;
      } else {
        // Insertar nuevo producto
        const result = await db.query(
          `INSERT INTO carrito (usuario_id, producto_id, cantidad, talla, color, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [usuarioId, producto_id, cantidad, talla, color]
        );
        
        console.log(`[Carrito.agregarProducto] Nuevo producto agregado al carrito, ID: ${result.insertId}`);
        return result.insertId;
      }
    } catch (error) {
      console.error('[Carrito.agregarProducto] Error:', error);
      throw new Error('Error al agregar producto al carrito');
    }
  }

  /**
   * Actualiza la cantidad de un producto en el carrito
   * @param {number} usuarioId - ID del usuario
   * @param {number} carritoId - ID del item en el carrito
   * @param {number} cantidad - Nueva cantidad
   * @returns {Promise<Object>} - Producto actualizado
   */
  static async actualizarCantidad(usuarioId, carritoId, cantidad) {
    try {
      // Verificar que el item pertenece al usuario
      const [item] = await db.query(
        `SELECT c.*, p.precio, p.nombre, p.imagen
         FROM carrito c
         JOIN productos p ON c.producto_id = p.id
         WHERE c.id = ? AND c.usuario_id = ?`,
        [carritoId, usuarioId]
      );

      if (!item) {
        throw new Error('Item no encontrado en el carrito');
      }

      // Verificar stock disponible
      const stockDisponible = await this.verificarStock(item.producto_id, item.talla, item.color);
      if (stockDisponible < cantidad) {
        throw new Error('Stock insuficiente');
      }

      // Actualizar cantidad
      await db.query(
        `UPDATE carrito 
         SET cantidad = ?, updated_at = NOW() 
         WHERE id = ? AND usuario_id = ?`,
        [cantidad, carritoId, usuarioId]
      );

      return {
        id: item.producto_id,
        carrito_id: carritoId,
        nombre: item.nombre,
        precio: parseFloat(item.precio),
        imagen: item.imagen,
        cantidad: cantidad,
        talla: item.talla,
        color: item.color,
        subtotal: parseFloat(item.precio) * cantidad
      };
    } catch (error) {
      console.error('[Carrito.actualizarCantidad] Error:', error);
      throw error;
    }
  }

  /**
   * Elimina un producto del carrito
   * @param {number} usuarioId - ID del usuario
   * @param {number} carritoId - ID del item en el carrito
   * @returns {Promise<void>}
   */
  static async eliminarProducto(usuarioId, carritoId) {
    try {
      console.log(`[Carrito.eliminarProducto] Eliminando producto del carrito para usuario ${usuarioId}, producto ${carritoId}`);
      
      const result = await db.query(
        `DELETE FROM carrito 
         WHERE id = ? AND usuario_id = ?`,
        [carritoId, usuarioId]
      );
      
      console.log(`[Carrito.eliminarProducto] Filas afectadas: ${result.affectedRows}`);
      if (result.affectedRows === 0) {
        throw new Error('Item no encontrado en el carrito');
      }
    } catch (error) {
      console.error('[Carrito.eliminarProducto] Error:', error);
      throw error;
    }
  }

  /**
   * Vacía el carrito de un usuario
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<void>}
   */
  static async vaciarCarrito(usuarioId) {
    try {
      console.log(`[Carrito.vaciarCarrito] Vaciando carrito para usuario ${usuarioId}`);
      
      const result = await db.query(
        'DELETE FROM carrito WHERE usuario_id = ?',
        [usuarioId]
      );
      
      console.log(`[Carrito.vaciarCarrito] Filas eliminadas: ${result.affectedRows}`);
    } catch (error) {
      console.error('[Carrito.vaciarCarrito] Error:', error);
      throw new Error('Error al vaciar el carrito');
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