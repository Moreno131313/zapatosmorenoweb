// routes/orderRoutes.js
const express = require('express');
const router = express.Router();

// Ruta básica que siempre funciona
router.get('/', (req, res) => {
  res.json({ mensaje: 'Módulo de pedidos en mantenimiento' });
});

module.exports = router;