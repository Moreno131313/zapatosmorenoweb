const express = require('express');
const router = express.Router();
const Carrito = require('../models/Carrito');
const verificarToken = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

// Middleware para todas las rutas del carrito
router.use((req, res, next) => {
    // Para métodos POST, PUT, DELETE requerimos token
    if (req.method !== 'GET') {
        verificarToken(req, res, next);
    } else {
        // Para GET, intentamos obtener el usuario pero no bloqueamos si no está autenticado
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            
            if (token) {
                try {
                    // Verificar el token sin bloquear si falla
                    const jwtSecret = process.env.JWT_SECRET || 'clave_secreta_para_jwt';
                    const decoded = jwt.verify(token, jwtSecret);
                    
                    // Agregar el usuario al request
                    req.usuario = { id: decoded.id };
                    console.log('Usuario identificado en ruta GET:', req.usuario.id);
                } catch (error) {
                    console.log('Token inválido en ruta GET, continuando sin autenticación');
                }
            }
        }
        
        next();
    }
});

// Middleware de validación para agregar productos
const validarProducto = [
    body('producto_id').isInt().withMessage('ID de producto inválido'),
    body('cantidad').isInt({ min: 1 }).withMessage('La cantidad debe ser mayor a 0'),
    body('talla').notEmpty().withMessage('La talla es requerida'),
    body('color').notEmpty().withMessage('El color es requerido')
];

/**
 * Obtener el carrito del usuario actual
 * GET /api/carrito
 */
router.get('/', async (req, res) => {
    try {
        let productos = [];
        
        // Si hay usuario autenticado, obtener del servidor
        if (req.usuario && req.usuario.id) {
            console.log('GET /api/carrito - Obteniendo carrito para usuario:', req.usuario.id);
            try {
                productos = await Carrito.obtenerCarrito(req.usuario.id);
                console.log(`Carrito obtenido para usuario ${req.usuario.id}: ${productos.length} productos`);
            } catch (dbError) {
                console.error('Error al obtener carrito de BD:', dbError);
                // Si hay error en la BD, devolver array vacío en lugar de fallar
                productos = [];
            }
        } else {
            // Si no hay usuario, obtener del localStorage (que se envía en las cookies)
            console.log('No hay usuario autenticado, usando carrito de localStorage');
            try {
                const carritoLocal = req.cookies && req.cookies.carrito ? req.cookies.carrito : '[]';
                productos = JSON.parse(carritoLocal);
            } catch (parseError) {
                console.error('Error al parsear carrito de cookies:', parseError);
                productos = [];
            }
        }
        
        res.json({
            success: true,
            data: productos,
            total: productos.length,
            totalPrecio: productos.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
        });
    } catch (error) {
        console.error('Error general al obtener carrito:', error);
        // En caso de error, devolver un carrito vacío pero exitoso
        res.json({
            success: true,
            data: [],
            total: 0,
            totalPrecio: 0,
            warning: 'Se produjo un error al obtener el carrito, mostrando carrito vacío'
        });
    }
});

/**
 * Sincronizar carrito desde localStorage
 * POST /api/carrito/sincronizar
 */
router.post('/sincronizar', verificarToken, async (req, res) => {
  try {
    if (!req.usuario || !req.usuario.id) {
      return res.status(401).json({
        success: false,
        mensaje: 'Usuario no autenticado'
      });
    }

    console.log('POST /api/carrito/sincronizar - Sincronizando carrito para usuario:', req.usuario.id);
    console.log('Datos recibidos:', req.body);
    
    const { items } = req.body;
    
    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        mensaje: 'Los datos del carrito deben ser un array'
      });
    }
    
    if (items.length === 0) {
      console.log('Carrito vacío, vaciando carrito en la base de datos');
      await Carrito.vaciarCarrito(req.usuario.id);
      
      return res.json({
        success: true,
        mensaje: 'Carrito vacío sincronizado correctamente',
        data: [],
        total: 0
      });
    }
    
    try {
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
    } catch (syncError) {
      console.error('Error al sincronizar con base de datos:', syncError);
      return res.status(500).json({
        success: false,
        mensaje: 'Error al sincronizar carrito con la base de datos',
        error: syncError.message
      });
    }
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
 * Agregar producto al carrito
 * POST /api/carrito/agregar
 */
router.post('/agregar', validarProducto, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                mensaje: 'Error de validación',
                errors: errors.array()
            });
        }

        const { producto_id, cantidad, talla, color } = req.body;
        
        // Verificar stock antes de agregar
        const stockDisponible = await Carrito.verificarStock(producto_id, talla, color);
        if (stockDisponible < cantidad) {
            return res.status(400).json({
                success: false,
                mensaje: 'Stock insuficiente',
                stockDisponible
            });
        }

        const resultado = await Carrito.agregarProducto(req.usuario.id, {
            producto_id,
            cantidad,
            talla,
            color
        });

        res.json({
            success: true,
            mensaje: 'Producto agregado al carrito',
            data: resultado
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
 * Actualizar cantidad de producto en el carrito
 * PUT /api/carrito/actualizar/:id
 */
router.put('/actualizar/:id', [
    body('cantidad').isInt({ min: 1 }).withMessage('La cantidad debe ser mayor a 0')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                mensaje: 'Error de validación',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const { cantidad } = req.body;

        const resultado = await Carrito.actualizarCantidad(req.usuario.id, id, cantidad);

        res.json({
            success: true,
            mensaje: 'Cantidad actualizada',
            data: resultado
        });
    } catch (error) {
        console.error('Error al actualizar cantidad:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar cantidad',
            error: error.message
        });
    }
});

/**
 * Eliminar producto del carrito
 * DELETE /api/carrito/eliminar/:id
 */
router.delete('/eliminar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await Carrito.eliminarProducto(req.usuario.id, id);

        res.json({
            success: true,
            mensaje: 'Producto eliminado del carrito'
        });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al eliminar producto',
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
        await Carrito.vaciarCarrito(req.usuario.id);

        res.json({
            success: true,
            mensaje: 'Carrito vaciado correctamente'
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