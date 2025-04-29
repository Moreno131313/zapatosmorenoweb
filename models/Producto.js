const db = require('../db/database');

class Producto {
  /**
   * Obtiene todos los productos con filtros opcionales
   * @param {Object} filtros - Filtros para la consulta
   * @returns {Promise<Array>} - Lista de productos
   */
  static async getAll(filtros = {}) {
    try {
      const { genero, tipo, talla, color, categoria_id } = filtros;
      
      let query = `
        SELECT p.*, GROUP_CONCAT(DISTINCT i.talla) as tallas, GROUP_CONCAT(DISTINCT i.color) as colores
        FROM productos p
        LEFT JOIN inventario i ON p.id = i.producto_id
        WHERE disponible = 1
      `;
      
      const params = [];
      
      if (genero) {
        // Para permitir múltiples géneros separados por coma
        const generos = genero.split(',').map(g => g.trim());
        query += ` AND p.genero IN (${generos.map(() => '?').join(',')})`;
        params.push(...generos);
      }
      
      if (tipo) {
        query += ` AND p.tipo = ?`;
        params.push(tipo);
      }
      
      if (categoria_id) {
        query += ` AND p.categoria_id = ?`;
        params.push(categoria_id);
      }
      
      if (talla) {
        query += ` AND EXISTS (SELECT 1 FROM inventario inv WHERE inv.producto_id = p.id AND inv.talla = ? AND inv.stock > 0)`;
        params.push(talla);
      }
      
      if (color) {
        query += ` AND EXISTS (SELECT 1 FROM inventario inv WHERE inv.producto_id = p.id AND inv.color = ? AND inv.stock > 0)`;
        params.push(color);
      }
      
      query += ` GROUP BY p.id`;
      
      return await db.query(query, params);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Obtiene un producto por su ID
   * @param {number} id - ID del producto
   * @returns {Promise<Object|null>} - Producto encontrado o null
   */
  static async getById(id) {
    try {
      const [producto] = await db.query(
        `SELECT p.*, c.nombre as categoria 
         FROM productos p 
         LEFT JOIN categorias c ON p.categoria_id = c.id 
         WHERE p.id = ?`,
        [id]
      );
      
      if (!producto) {
        return null;
      }
      
      // Obtener tallas y colores disponibles
      const inventario = await db.query(
        `SELECT talla, color, stock FROM inventario WHERE producto_id = ?`,
        [id]
      );
      
      producto.inventario = inventario;
      
      return producto;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Crear un nuevo producto
   * @param {Object} productoData - Datos del producto
   * @returns {Promise<number>} - ID del producto creado
   */
  static async create(productoData) {
    try {
      const { 
        nombre, 
        descripcion, 
        precio, 
        descuento, 
        categoria_id, 
        tipo, 
        genero, 
        imagen, 
        disponible 
      } = productoData;
      
      const result = await db.query(
        `INSERT INTO productos 
         (nombre, descripcion, precio, descuento, categoria_id, tipo, genero, imagen, disponible) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nombre, 
          descripcion, 
          precio, 
          descuento || 0, 
          categoria_id, 
          tipo, 
          genero, 
          imagen, 
          disponible !== undefined ? disponible : true
        ]
      );
      
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Actualiza un producto existente
   * @param {number} id - ID del producto
   * @param {Object} productoData - Datos a actualizar
   * @returns {Promise<boolean>} - true si la actualización fue exitosa
   */
  static async update(id, productoData) {
    try {
      const { 
        nombre, 
        descripcion, 
        precio, 
        descuento, 
        categoria_id, 
        tipo, 
        genero, 
        imagen, 
        disponible 
      } = productoData;
      
      await db.query(
        `UPDATE productos 
         SET nombre = ?, descripcion = ?, precio = ?, descuento = ?, 
             categoria_id = ?, tipo = ?, genero = ?, imagen = ?, disponible = ? 
         WHERE id = ?`,
        [
          nombre, 
          descripcion, 
          precio, 
          descuento, 
          categoria_id, 
          tipo, 
          genero, 
          imagen, 
          disponible, 
          id
        ]
      );
      
      return true;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Elimina un producto
   * @param {number} id - ID del producto
   * @returns {Promise<boolean>} - true si la eliminación fue exitosa
   */
  static async delete(id) {
    try {
      await db.query('DELETE FROM productos WHERE id = ?', [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Agrega o actualiza inventario para un producto
   * @param {number} productoId - ID del producto
   * @param {Array} inventarioItems - Array de objetos con talla, color y stock
   * @returns {Promise<boolean>} - true si la operación fue exitosa
   */
  static async updateInventario(productoId, inventarioItems) {
    try {
      // Usar transacción para mantener consistencia
      await db.transaction(async (connection) => {
        for (const item of inventarioItems) {
          const { talla, color, stock } = item;
          
          // Verificar si ya existe este item en inventario
          const [existente] = await connection.execute(
            'SELECT id FROM inventario WHERE producto_id = ? AND talla = ? AND color = ?',
            [productoId, talla, color]
          );
          
          if (existente.length > 0) {
            // Actualizar existente
            await connection.execute(
              'UPDATE inventario SET stock = ? WHERE id = ?',
              [stock, existente[0].id]
            );
          } else {
            // Crear nuevo
            await connection.execute(
              'INSERT INTO inventario (producto_id, talla, color, stock) VALUES (?, ?, ?, ?)',
              [productoId, talla, color, stock]
            );
          }
        }
      });
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene productos de novedades (últimos 30 días)
   * @returns {Promise<Array>} - Lista de productos
   */
  static async getNovedades() {
    try {
      const query = `
        SELECT p.*, GROUP_CONCAT(DISTINCT i.talla) as tallas, GROUP_CONCAT(DISTINCT i.color) as colores
        FROM productos p
        LEFT JOIN inventario i ON p.id = i.producto_id
        WHERE p.disponible = 1 
        AND p.fecha_creacion >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY p.id
        ORDER BY p.fecha_creacion DESC
        LIMIT 12
      `;
      
      return await db.query(query);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene productos en oferta (descuento > 0)
   * @returns {Promise<Array>} - Lista de productos
   */
  static async getOfertas() {
    try {
      const query = `
        SELECT p.*, GROUP_CONCAT(DISTINCT i.talla) as tallas, GROUP_CONCAT(DISTINCT i.color) as colores
        FROM productos p
        LEFT JOIN inventario i ON p.id = i.producto_id
        WHERE p.disponible = 1 
        AND p.descuento > 0
        GROUP BY p.id
        ORDER BY p.descuento DESC
        LIMIT 12
      `;
      
      return await db.query(query);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene productos en liquidación (descuento >= 50%)
   * @returns {Promise<Array>} - Lista de productos
   */
  static async getLiquidacion() {
    try {
      const query = `
        SELECT p.*, GROUP_CONCAT(DISTINCT i.talla) as tallas, GROUP_CONCAT(DISTINCT i.color) as colores
        FROM productos p
        LEFT JOIN inventario i ON p.id = i.producto_id
        WHERE p.disponible = 1 
        AND p.descuento >= 50
        GROUP BY p.id
        ORDER BY p.descuento DESC
        LIMIT 12
      `;
      
      return await db.query(query);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene productos de temporada
   * @returns {Promise<Array>} - Lista de productos
   */
  static async getTemporada() {
    try {
      const query = `
        SELECT p.*, GROUP_CONCAT(DISTINCT i.talla) as tallas, GROUP_CONCAT(DISTINCT i.color) as colores
        FROM productos p
        LEFT JOIN inventario i ON p.id = i.producto_id
        WHERE p.disponible = 1 
        AND p.tipo = 'temporada'
        GROUP BY p.id
        ORDER BY p.fecha_creacion DESC
        LIMIT 12
      `;
      
      return await db.query(query);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Producto; 