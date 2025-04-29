const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verificarToken = require('../middleware/auth');

// Rutas de autenticación - Se utilizan como respaldo a las rutas en auth.js
// Estas rutas podrían ser redundantes si ya están definidas en auth.js
router.post('/registro', authController.registro);
router.post('/login', authController.login);

// Ruta protegida para obtener el perfil
router.get('/perfil', verificarToken, authController.obtenerPerfil);

module.exports = router; 