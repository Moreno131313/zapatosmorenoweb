// controllers/productsController.js
const Producto = require('../models/Producto');

exports.getProductsByCategory = async (req, res, next) => {
  try {
    const { genero, tipo, talla, color, categoria_id } = req.query;
    
    const productos = await Producto.getAll({
      genero,
      tipo,
      talla,
      color,
      categoria_id
    });
    
    res.json(productos);
  } catch (error) {
    next(error);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const producto = await Producto.getById(id);
    
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    
    res.json(producto);
  } catch (error) {
    next(error);
  }
};

// Nuevos métodos para CRUD completo

/**
 * Crear un nuevo producto
 * @route POST /api/productos
 */
exports.createProduct = async (req, res, next) => {
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
      disponible,
      inventario 
    } = req.body;
    
    // Validaciones básicas
    if (!nombre || !precio) {
      return res.status(400).json({ mensaje: 'Nombre y precio son obligatorios' });
    }
    
    // Crear producto
    const productoId = await Producto.create({ 
      nombre, 
      descripcion, 
      precio, 
      descuento, 
      categoria_id, 
      tipo, 
      genero, 
      imagen, 
      disponible 
    });
    
    // Si se envió inventario, actualizarlo
    if (inventario && Array.isArray(inventario) && inventario.length > 0) {
      await Producto.updateInventario(productoId, inventario);
    }
    
    res.status(201).json({ 
      mensaje: 'Producto creado correctamente',
      productoId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar un producto existente
 * @route PUT /api/productos/:id
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      nombre, 
      descripcion, 
      precio, 
      descuento, 
      categoria_id, 
      tipo, 
      genero, 
      imagen, 
      disponible,
      inventario 
    } = req.body;
    
    // Verificar que el producto existe
    const producto = await Producto.getById(id);
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    
    // Actualizar producto
    await Producto.update(id, { 
      nombre, 
      descripcion, 
      precio, 
      descuento, 
      categoria_id, 
      tipo, 
      genero, 
      imagen, 
      disponible 
    });
    
    // Si se envió inventario, actualizarlo
    if (inventario && Array.isArray(inventario) && inventario.length > 0) {
      await Producto.updateInventario(id, inventario);
    }
    
    res.json({ mensaje: 'Producto actualizado correctamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar un producto
 * @route DELETE /api/productos/:id
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Verificar que el producto existe
    const producto = await Producto.getById(id);
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    
    // Eliminar producto
    await Producto.delete(id);
    
    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener productos de novedades
 * @route GET /api/productos/novedades
 */
exports.getNovedades = async (req, res, next) => {
  try {
    // Obtener productos agregados en los últimos 30 días
    const productos = await Producto.getNovedades();
    res.json(productos);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener productos en oferta
 * @route GET /api/productos/ofertas
 */
exports.getOfertas = async (req, res, next) => {
  try {
    // Obtener productos con descuento mayor a 0
    const productos = await Producto.getOfertas();
    res.json(productos);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener productos en liquidación
 * @route GET /api/productos/liquidacion
 */
exports.getLiquidacion = async (req, res, next) => {
  try {
    // Obtener productos con descuento mayor al 50%
    const productos = await Producto.getLiquidacion();
    res.json(productos);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener productos de temporada
 * @route GET /api/productos/temporada
 */
exports.getTemporada = async (req, res, next) => {
  try {
    // Obtener productos marcados como de temporada
    const productos = await Producto.getTemporada();
    res.json(productos);
  } catch (error) {
    next(error);
  }
};