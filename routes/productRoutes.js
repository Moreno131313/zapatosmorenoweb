// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const { query } = require('../db/database'); // Import the database query function

// Datos de demostración (hasta que se implemente la base de datos)
const productosDemo = [
  { 
    id: '1', 
    nombre: 'Zapato casual hombre', 
    precio: 79990, 
    descripcion: 'Zapato casual elegante para hombre, ideal para el día a día y ocasiones semi-formales.',
    imagen: '/imagenes/productos/hombres/oxford-negro.jpg',
    genero: 'hombre',
    tipo: 'casual',
    tallas: ['38', '39', '40', '41', '42'],
    colores: ['Negro', 'Marrón', 'Azul']
  },
  { 
    id: '2', 
    nombre: 'Sandalia mujer elegante', 
    precio: 59990,
    descripcion: 'Sandalia elegante para mujer, perfecta para eventos y ocasiones especiales.',
    imagen: '/imagenes/productos/mujeres/sandalia-elegante.jpg',
    genero: 'mujer',
    tipo: 'formal',
    tallas: ['35', '36', '37', '38', '39'],
    colores: ['Negro', 'Plateado', 'Dorado']
  },
  { 
    id: '3', 
    nombre: 'Deportivo niño', 
    precio: 49990,
    descripcion: 'Calzado deportivo para niño, cómodo y resistente para todas sus actividades.',
    imagen: '/imagenes/productos/ninos/deportivo-nino.jpg',
    genero: 'nino',
    tipo: 'deportivo',
    tallas: ['28', '29', '30', '31', '32', '33'],
    colores: ['Azul', 'Rojo', 'Negro']
  }
];

// Ruta básica que siempre funciona
router.get('/', (req, res) => {
  // Filtrar productos por género si se proporciona
  const { genero, tipo, talla, color } = req.query;
  
  let productos = [...productosDemo];
  
  if (genero) {
    productos = productos.filter(p => p.genero === genero);
  }
  
  if (tipo) {
    productos = productos.filter(p => p.tipo === tipo);
  }
  
  if (talla) {
    productos = productos.filter(p => p.tallas.includes(talla));
  }
  
  if (color) {
    productos = productos.filter(p => p.colores.some(c => 
      c.toLowerCase() === color.toLowerCase()
    ));
  }
  
  res.json(productos);
});

// Ruta para obtener un producto específico por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const producto = productosDemo.find(p => p.id === id);
  
  if (!producto) {
    return res.status(404).json({ mensaje: 'Producto no encontrado' });
  }
  
  res.json(producto);
});

// Ruta para obtener el inventario de un producto específico
router.get('/:id/inventario', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el ID es numérico
    const productoId = parseInt(id);
    if (isNaN(productoId)) {
      return res.status(400).json({ mensaje: 'ID de producto inválido' });
    }
    
    // Consultar el inventario desde la base de datos
    const inventario = await query(`
      SELECT producto_id, talla, color, stock 
      FROM inventario 
      WHERE producto_id = ? AND stock > 0
    `, [productoId]);
    
    // Organizar los datos por color y talla para la interfaz de usuario
    const inventarioFormateado = {};
    
    inventario.forEach(item => {
      if (!inventarioFormateado[item.color]) {
        inventarioFormateado[item.color] = [];
      }
      inventarioFormateado[item.color].push(item.talla);
    });
    
    res.json({
      producto_id: productoId,
      inventario: inventarioFormateado,
      inventario_detallado: inventario
    });
  } catch (error) {
    console.error('Error al obtener inventario:', error);
    res.status(500).json({ 
      mensaje: 'Error al obtener el inventario del producto',
      error: error.message 
    });
  }
});

module.exports = router;