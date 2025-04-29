// controllers/addressController.js
const db = require('../db/database');

/**
 * Obtener todas las direcciones del usuario autenticado
 */
exports.getUserAddresses = async (req, res) => {
  try {
    const userId = req.usuario.id;
    
    const direcciones = await db.query(
      'SELECT * FROM direcciones WHERE usuario_id = ? ORDER BY es_principal DESC, id ASC',
      [userId]
    );
    
    res.json(direcciones);
  } catch (error) {
    console.error('Error al obtener direcciones:', error);
    res.status(500).json({ mensaje: 'Error al obtener direcciones' });
  }
};

/**
 * Obtener una dirección específica
 */
exports.getAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.usuario.id;
    
    const [direccion] = await db.query(
      'SELECT * FROM direcciones WHERE id = ? AND usuario_id = ?',
      [id, userId]
    );
    
    if (!direccion) {
      return res.status(404).json({ mensaje: 'Dirección no encontrada' });
    }
    
    res.json(direccion);
  } catch (error) {
    console.error('Error al obtener dirección:', error);
    res.status(500).json({ mensaje: 'Error al obtener información de la dirección' });
  }
};

/**
 * Crear una nueva dirección
 */
exports.createAddress = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const { nombre, direccion, ciudad, codigo_postal, telefono, es_principal } = req.body;
    
    // Validaciones básicas
    if (!nombre || !direccion || !ciudad || !telefono) {
      return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
    }
    
    // Si es la dirección principal, quitar el flag de principal de las demás
    if (es_principal) {
      await db.query(
        'UPDATE direcciones SET es_principal = false WHERE usuario_id = ?',
        [userId]
      );
    }
    
    // Crear la dirección
    const result = await db.query(
      `INSERT INTO direcciones (usuario_id, nombre, direccion, ciudad, codigo_postal, telefono, es_principal) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, nombre, direccion, ciudad, codigo_postal || null, telefono, es_principal || false]
    );
    
    // Si es la primera dirección, establecerla como principal
    if (result.insertId) {
      const direcciones = await db.query(
        'SELECT COUNT(*) as total FROM direcciones WHERE usuario_id = ?',
        [userId]
      );
      
      if (direcciones[0].total === 1) {
        await db.query(
          'UPDATE direcciones SET es_principal = true WHERE id = ?',
          [result.insertId]
        );
      }
    }
    
    res.status(201).json({ 
      mensaje: 'Dirección creada correctamente',
      direccion_id: result.insertId
    });
  } catch (error) {
    console.error('Error al crear dirección:', error);
    res.status(500).json({ mensaje: 'Error al crear dirección' });
  }
};

/**
 * Actualizar una dirección
 */
exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.usuario.id;
    const { nombre, direccion, ciudad, codigo_postal, telefono, es_principal } = req.body;
    
    // Validaciones básicas
    if (!nombre || !direccion || !ciudad || !telefono) {
      return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
    }
    
    // Verificar que la dirección pertenece al usuario
    const [dir] = await db.query(
      'SELECT id FROM direcciones WHERE id = ? AND usuario_id = ?',
      [id, userId]
    );
    
    if (!dir) {
      return res.status(404).json({ mensaje: 'Dirección no encontrada' });
    }
    
    // Si es la dirección principal, quitar el flag de principal de las demás
    if (es_principal) {
      await db.query(
        'UPDATE direcciones SET es_principal = false WHERE usuario_id = ?',
        [userId]
      );
    }
    
    // Actualizar la dirección
    await db.query(
      `UPDATE direcciones SET 
        nombre = ?, 
        direccion = ?, 
        ciudad = ?, 
        codigo_postal = ?,
        telefono = ?,
        es_principal = ?
       WHERE id = ? AND usuario_id = ?`,
      [nombre, direccion, ciudad, codigo_postal || null, telefono, es_principal || false, id, userId]
    );
    
    res.json({ mensaje: 'Dirección actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar dirección:', error);
    res.status(500).json({ mensaje: 'Error al actualizar dirección' });
  }
};

/**
 * Eliminar una dirección
 */
exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.usuario.id;
    
    // Verificar que la dirección pertenece al usuario
    const [dir] = await db.query(
      'SELECT id, es_principal FROM direcciones WHERE id = ? AND usuario_id = ?',
      [id, userId]
    );
    
    if (!dir) {
      return res.status(404).json({ mensaje: 'Dirección no encontrada' });
    }
    
    // Eliminar la dirección
    await db.query(
      'DELETE FROM direcciones WHERE id = ? AND usuario_id = ?',
      [id, userId]
    );
    
    // Si era la dirección principal, establecer otra como principal
    if (dir.es_principal) {
      const [otra] = await db.query(
        'SELECT id FROM direcciones WHERE usuario_id = ? LIMIT 1',
        [userId]
      );
      
      if (otra) {
        await db.query(
          'UPDATE direcciones SET es_principal = true WHERE id = ?',
          [otra.id]
        );
      }
    }
    
    res.json({ mensaje: 'Dirección eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar dirección:', error);
    res.status(500).json({ mensaje: 'Error al eliminar dirección' });
  }
};