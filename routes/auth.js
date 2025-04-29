// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rutas públicas para autenticación
// Usar directamente la función register en lugar de la verificación condicional
router.post('/registro', authController.register);

// Usar directamente la función login en lugar de la verificación condicional
router.post('/login', authController.login);

// No agregar más rutas para evitar errores

module.exports = router;