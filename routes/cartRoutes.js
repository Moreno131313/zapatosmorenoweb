const express = require('express');
const router = express.Router();
const Carrito = require('../models/Carrito');
const verificarToken = require('../middleware/auth');

// Middleware para todas las rutas del carrito
router.use(verificarToken);

/**
 * Obtener el carrito del usuario actual
 * GET /api/carrito
 */
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/carrito - Obteniendo carrito para usuario:', req.usuario.id);
    
    const productos = await Carrito.obtenerCarrito(req.usuario.id);
    
    res.json({
      success: true,
      data: productos,
      total: productos.length
    });
  } catch (error) {
    console.error('Error al obtener carrito:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener carrito',
      error: error.message
    });
  }
});

/**
 * Sincronizar carrito desde localStorage
 * POST /api/carrito/sincronizar
 */
router.post('/sincronizar', async (req, res) => {
  try {
    console.log('POST /api/carrito/sincronizar - Sincronizando carrito para usuario:', req.usuario.id);
    console.log('Datos recibidos:', req.body);
    
    const { items } = req.body;
    
    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        mensaje: 'Los datos del carrito deben ser un array'
      });
    }
    
    // Migrar productos de localStorage a la base de datos
    await Carrito.migrarDesdeLocalStorage(req.usuario.id, items);
    
    // Obtener el carrito actualizado
    const carritoActualizado = await Carrito.obtenerCarrito(req.usuario.id);
    
    res.json({
      success: true,
      mensaje: 'Carrito sincronizado correctamente',
      data: carritoActualizado,
      total: carritoActualizado.length
    });
  } catch (error) {
    console.error('Error al sincronizar carrito:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al sincronizar carrito',
      error: error.message
    });
  }
});

/**
 * Agregar un producto al carrito
 * POST /api/carrito/agregar
 */
router.post('/agregar', async (req, res) => {
  try {
    console.log('POST /api/carrito/agregar - Agregando producto al carrito para usuario:', req.usuario.id);
    console.log('Datos recibidos:', req.body);
    
    const { producto } = req.body;
    
    if (!producto || !producto.id) {
      return res.status(400).json({
        success: false,
        mensaje: 'Datos del producto incompletos'
      });
    }
    
    // Asegurar que la cantidad es un número válido
    producto.cantidad = parseInt(producto.cantidad) || 1;
    
    // Agregar producto al carrito
    await Carrito.agregarProducto(req.usuario.id, producto);
    
    // Obtener el carrito actualizado
    const carritoActualizado = await Carrito.obtenerCarrito(req.usuario.id);
    
    res.json({
      success: true,
      mensaje: 'Producto agregado al carrito',
      data: carritoActualizado,
      total: carritoActualizado.length
    });
  } catch (error) {
    console.error('Error al agregar producto al carrito:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al agregar producto al carrito',
      error: error.message
    });
  }
});

/**
 * Actualizar cantidad de un producto en el carrito
 * PUT /api/carrito/actualizar
 */
router.put('/actualizar', async (req, res) => {
  try {
    console.log('PUT /api/carrito/actualizar - Actualizando cantidad para usuario:', req.usuario.id);
    console.log('Datos recibidos:', req.body);
    
    const { productoId, talla, color, cantidad } = req.body;
    
    if (!productoId || cantidad === undefined) {
      return res.status(400).json({
        success: false,
        mensaje: 'Datos incompletos para actualizar el carrito'
      });
    }
    
    // Actualizar cantidad
    await Carrito.actualizarCantidad(req.usuario.id, productoId, talla || '', color || '', parseInt(cantidad));
    
    // Obtener el carrito actualizado
    const carritoActualizado = await Carrito.obtenerCarrito(req.usuario.id);
    
    res.json({
      success: true,
      mensaje: 'Carrito actualizado correctamente',
      data: carritoActualizado,
      total: carritoActualizado.length
    });
  } catch (error) {
    console.error('Error al actualizar carrito:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar carrito',
      error: error.message
    });
  }
});

/**
 * Eliminar un producto del carrito
 * DELETE /api/carrito/eliminar
 */
router.delete('/eliminar', async (req, res) => {
  try {
    console.log('DELETE /api/carrito/eliminar - Eliminando producto para usuario:', req.usuario.id);
    console.log('Datos recibidos:', req.body);
    
    const { productoId, talla, color } = req.body;
    
    if (!productoId) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de producto requerido'
      });
    }
    
    // Eliminar producto
    await Carrito.eliminarProducto(req.usuario.id, productoId, talla || '', color || '');
    
    // Obtener el carrito actualizado
    const carritoActualizado = await Carrito.obtenerCarrito(req.usuario.id);
    
    res.json({
      success: true,
      mensaje: 'Producto eliminado del carrito',
      data: carritoActualizado,
      total: carritoActualizado.length
    });
  } catch (error) {
    console.error('Error al eliminar producto del carrito:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al eliminar producto del carrito',
      error: error.message
    });
  }
});

/**
 * Vaciar carrito
 * DELETE /api/carrito/vaciar
 */
router.delete('/vaciar', async (req, res) => {
  try {
    console.log('DELETE /api/carrito/vaciar - Vaciando carrito para usuario:', req.usuario.id);
    
    // Vaciar carrito
    await Carrito.vaciarCarrito(req.usuario.id);
    
    res.json({
      success: true,
      mensaje: 'Carrito vaciado correctamente',
      data: [],
      total: 0
    });
  } catch (error) {
    console.error('Error al vaciar carrito:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al vaciar carrito',
      error: error.message
    });
  }
});

module.exports = router; 