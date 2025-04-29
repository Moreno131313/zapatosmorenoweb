// routes/productRoutes.js
const express = require('express');
const router = express.Router();

// Ruta básica que siempre funciona
router.get('/', (req, res) => {
  res.json({ 
    mensaje: 'Lista de productos', 
    productos: [
      { id: 1, nombre: 'Zapato casual hombre', precio: 79.99 },
      { id: 2, nombre: 'Sandalia mujer elegante', precio: 59.99 },
      { id: 3, nombre: 'Deportivo niño', precio: 49.99 }
    ]
  });
});

module.exports = router;