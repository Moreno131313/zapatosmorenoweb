// controllers/orderController.js
const db = require('../db/database');

/**
 * Obtener todos los pedidos del usuario autenticado
 */
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.usuario.id;
    
    // Obtener pedidos básicos
    const pedidos = await db.query(
      `SELECT p.id, p.fecha_pedido, p.estado, p.total, p.metodo_pago, d.direccion, d.ciudad
       FROM pedidos p
       LEFT JOIN direcciones d ON p.direccion_envio_id = d.id
       WHERE p.usuario_id = ?
       ORDER BY p.fecha_pedido DESC`,
      [userId]
    );
    
    // Para cada pedido, obtener los productos
    for (const pedido of pedidos) {
      const productos = await db.query(
        `SELECT dp.producto_id, dp.talla, dp.color, dp.cantidad, dp.precio_unitario, p.nombre, p.imagen
         FROM detalles_pedido dp
         JOIN productos p ON dp.producto_id = p.id
         WHERE dp.pedido_id = ?`,
        [pedido.id]
      );
      
      pedido.productos = productos;
    }
    
    res.json(pedidos);
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ mensaje: 'Error al obtener pedidos' });
  }
};

/**
 * Obtener un pedido específico
 */
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.usuario.id;
    
    // Obtener información del pedido
    const [pedido] = await db.query(
      `SELECT p.id, p.fecha_pedido, p.estado, p.total, p.metodo_pago, p.notas, 
              d.direccion as direccion_envio, d.ciudad, d.codigo_postal, d.telefono
       FROM pedidos p
       LEFT JOIN direcciones d ON p.direccion_envio_id = d.id
       WHERE p.id = ? AND p.usuario_id = ?`,
      [id, userId]
    );
    
    if (!pedido) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }
    
    // Obtener los productos del pedido
    const detalles = await db.query(
      `SELECT dp.producto_id, dp.talla, dp.color, dp.cantidad, dp.precio_unitario, dp.subtotal,
              p.nombre, p.imagen, p.descripcion
       FROM detalles_pedido dp
       JOIN productos p ON dp.producto_id = p.id
       WHERE dp.pedido_id = ?`,
      [id]
    );
    
    // Obtener el seguimiento del pedido
    const seguimiento = await db.query(
      `SELECT id, estado, descripcion, fecha
       FROM seguimiento_pedido
       WHERE pedido_id = ?
       ORDER BY fecha ASC`,
      [id]
    );
    
    pedido.detalles = detalles;
    pedido.seguimiento = seguimiento;
    
    res.json(pedido);
  } catch (error) {
    console.error('Error al obtener detalles del pedido:', error);
    res.status(500).json({ mensaje: 'Error al obtener información del pedido' });
  }
};

/**
 * Crear un nuevo pedido
 */
exports.createOrder = async (req, res) => {
  const connection = await db.pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { direccion_envio_id, metodo_pago, total, items, notas } = req.body;
    const userId = req.usuario.id;
    
    // Validaciones básicas
    if (!direccion_envio_id || !metodo_pago || !total || !items || !items.length) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ mensaje: 'Faltan datos obligatorios para crear el pedido' });
    }
    
    // Crear el pedido
    const [result] = await connection.execute(
      `INSERT INTO pedidos (usuario_id, direccion_envio_id, fecha_pedido, estado, metodo_pago, total, notas)
       VALUES (?, ?, NOW(), 'pendiente', ?, ?, ?)`,
      [userId, direccion_envio_id, metodo_pago, total, notas || null]
    );
    
    const pedidoId = result.insertId;
    
    // Agregar los items del pedido
    for (const item of items) {
      // Verificar stock
      const [inventarioResult] = await connection.execute(
        'SELECT stock FROM inventario WHERE producto_id = ? AND talla = ? AND color = ?',
        [item.producto_id, item.talla, item.color]
      );
      
      if (!inventarioResult.length || inventarioResult[0].stock < item.cantidad) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ 
          mensaje: 'No hay suficiente stock para uno o más productos'
        });
      }
      
      // Agregar detalle de pedido
      await connection.execute(
        `INSERT INTO detalles_pedido (pedido_id, producto_id, talla, color, cantidad, precio_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [pedidoId, item.producto_id, item.talla, item.color, item.cantidad, item.precio, item.subtotal]
      );
      
      // Actualizar inventario
      await connection.execute(
        'UPDATE inventario SET stock = stock - ? WHERE producto_id = ? AND talla = ? AND color = ?',
        [item.cantidad, item.producto_id, item.talla, item.color]
      );
    }
    
    // Agregar registro de seguimiento inicial
    await connection.execute(
      `INSERT INTO seguimiento_pedido (pedido_id, estado, descripcion, fecha)
       VALUES (?, 'pendiente', 'Pedido recibido y en proceso de validación', NOW())`,
      [pedidoId]
    );
    
    await connection.commit();
    
    res.status(201).json({
      mensaje: 'Pedido creado correctamente',
      pedido_id: pedidoId
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error al crear pedido:', error);
    res.status(500).json({ mensaje: 'Error al procesar el pedido' });
  } finally {
    connection.release();
  }
};

/**
 * Cancelar un pedido
 */
exports.cancelOrder = async (req, res) => {
  const connection = await db.pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const userId = req.usuario.id;
    const { motivo } = req.body;
    
    // Verificar que el pedido existe y pertenece al usuario
    const [pedidoResult] = await connection.execute(
      'SELECT estado FROM pedidos WHERE id = ? AND usuario_id = ?',
      [id, userId]
    );
    
    if (!pedidoResult.length) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }
    
    const pedido = pedidoResult[0];
    
    // Verificar que el pedido puede ser cancelado
    if (pedido.estado === 'entregado' || pedido.estado === 'cancelado') {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ 
        mensaje: `No se puede cancelar un pedido ${pedido.estado}`
      });
    }
    
    // Actualizar estado del pedido
    await connection.execute(
      'UPDATE pedidos SET estado = "cancelado" WHERE id = ?',
      [id]
    );
    
    // Agregar registro de seguimiento
    await connection.execute(
      `INSERT INTO seguimiento_pedido (pedido_id, estado, descripcion, fecha)
       VALUES (?, 'cancelado', ?, NOW())`,
      [id, motivo || 'Pedido cancelado por el cliente']
    );
    
    // Devolver items al inventario
    const items = await connection.execute(
      'SELECT producto_id, talla, color, cantidad FROM detalles_pedido WHERE pedido_id = ?',
      [id]
    );
    
    for (const item of items[0]) {
      await connection.execute(
        'UPDATE inventario SET stock = stock + ? WHERE producto_id = ? AND talla = ? AND color = ?',
        [item.cantidad, item.producto_id, item.talla, item.color]
      );
    }
    
    await connection.commit();
    
    res.json({ mensaje: 'Pedido cancelado correctamente' });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error al cancelar pedido:', error);
    res.status(500).json({ mensaje: 'Error al cancelar el pedido' });
  } finally {
    connection.release();
  }
};