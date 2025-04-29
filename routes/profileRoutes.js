const express = require('express');
const router = express.Router();

// Ruta simple para el perfil que siempre funciona
router.get('/', (req, res) => {
  // Datos de ejemplo para mostrar siempre algo
  res.json({
    id: 1,
    nombre: "Usuario Demo",
    email: "usuario@ejemplo.com",
    telefono: "No especificado",
    fecha_nacimiento: "No especificado",
    genero: "No especificado"
  });
});

module.exports = router; 