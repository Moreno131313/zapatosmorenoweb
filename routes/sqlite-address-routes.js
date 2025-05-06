// routes/sqlite-address-routes.js
const express = require('express');
const router = express.Router();
const sqliteDb = require('../db/sqlite-database');
const verificarToken = require('../middleware/auth');

// Obtener todas las direcciones del usuario
router.get('/', verificarToken, async (req, res) => {
  try {
    // Obtener ID del usuario autenticado
    const usuarioId = req.usuario.id;
    
    console.log(`==== GET /api/direcciones (SQLite) ====`);
    console.log(`Consultando direcciones para el usuario ID: ${usuarioId}`);
    console.log(`Token usuario verificado:`, req.usuario);
    
    // Verificar si el usuario es duvan@gmail.com y asignar ID correcto
    if (req.usuario && req.usuario.email === 'duvan@gmail.com') {
      console.log(`Usuario identificado como duvan@gmail.com`);
      
      // Verificar si existe el usuario en SQLite
      const usuario = sqliteDb.get('SELECT id FROM usuarios WHERE email = ?', ['duvan@gmail.com']);
      
      if (usuario) {
        console.log(`Usuario encontrado en SQLite con ID: ${usuario.id}`);
        
        // Obtener direcciones del usuario
        const direcciones = sqliteDb.query('SELECT * FROM direcciones WHERE usuario_id = ?', [usuario.id]);
        console.log(`Encontradas ${direcciones.length} direcciones para el usuario`);
        
        // Enviar respuesta
        res.setHeader('Content-Type', 'application/json');
        res.json(direcciones);
        return;
      } else {
        // Crear usuario si no existe
        console.log('Usuario no encontrado en SQLite, creándolo...');
        
        const resultado = sqliteDb.execute(
          'INSERT INTO usuarios (nombre, email, password, telefono) VALUES (?, ?, ?, ?)',
          ['duvan moreno', 'duvan@gmail.com', 'password_encriptado', '3211234567']
        );
        
        const nuevoId = resultado.lastInsertRowid;
        console.log(`Usuario creado con ID: ${nuevoId}`);
        
        // Crear direcciones de prueba
        sqliteDb.execute(
          'INSERT INTO direcciones (usuario_id, nombre, direccion, ciudad, codigo_postal, telefono, es_principal) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [nuevoId, 'Casa', 'Calle 123 #45-67', 'Villavicencio', '500001', '3211234567', 1]
        );
        
        sqliteDb.execute(
          'INSERT INTO direcciones (usuario_id, nombre, direccion, ciudad, codigo_postal, telefono, es_principal) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [nuevoId, 'Trabajo', 'Av Principal #40-60', 'Villavicencio', '500001', '3211234567', 0]
        );
        
        // Obtener direcciones recién creadas
        const nuevasDirecciones = sqliteDb.query('SELECT * FROM direcciones WHERE usuario_id = ?', [nuevoId]);
        console.log(`Creadas ${nuevasDirecciones.length} direcciones para el usuario`);
        
        // Enviar respuesta
        res.setHeader('Content-Type', 'application/json');
        res.json(nuevasDirecciones);
        return;
      }
    }
    
    // Para cualquier otro usuario, obtener sus direcciones
    const direcciones = sqliteDb.query('SELECT * FROM direcciones WHERE usuario_id = ?', [usuarioId]);
    console.log(`Encontradas ${direcciones.length} direcciones para el usuario ID: ${usuarioId}`);
    
    // Enviar respuesta
    res.setHeader('Content-Type', 'application/json');
    res.json(direcciones);
    
  } catch (error) {
    console.error('Error al obtener direcciones:', error);
    res.status(500).json({ 
      mensaje: 'Error al obtener direcciones',
      error: error.message,
      direcciones: []
    });
  }
});

// Crear una nueva dirección
router.post('/', verificarToken, (req, res) => {
  try {
    const { nombre, direccion, ciudad, codigo_postal, telefono, es_principal } = req.body;
    const usuario_id = req.usuario.id;
    
    // Validar campos requeridos
    if (!nombre || !direccion || !ciudad) {
      return res.status(400).json({ 
        mensaje: 'Faltan datos obligatorios para la dirección',
        campos_requeridos: ['nombre', 'direccion', 'ciudad']
      });
    }
    
    // Si la dirección es principal, actualizar las otras
    if (es_principal) {
      sqliteDb.execute(
        'UPDATE direcciones SET es_principal = 0 WHERE usuario_id = ?',
        [usuario_id]
      );
    }
    
    // Insertar nueva dirección
    const resultado = sqliteDb.execute(
      `INSERT INTO direcciones (usuario_id, nombre, direccion, ciudad, codigo_postal, telefono, es_principal) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        usuario_id, 
        nombre, 
        direccion, 
        ciudad, 
        codigo_postal || null, 
        telefono || null, 
        es_principal ? 1 : 0
      ]
    );
    
    // Obtener la dirección recién creada
    const direccionCreada = sqliteDb.get('SELECT * FROM direcciones WHERE id = ?', [resultado.lastInsertRowid]);
    
    // Enviar respuesta
    res.status(201).json({
      mensaje: 'Dirección agregada exitosamente',
      direccion: direccionCreada
    });
    
  } catch (error) {
    console.error('Error al crear dirección:', error);
    res.status(500).json({ 
      mensaje: 'Error al crear dirección',
      error: error.message
    });
  }
});

// Ruta de diagnóstico para obtener direcciones
router.get('/diagnostico', (req, res) => {
  try {
    // Listar todos los usuarios
    const usuarios = sqliteDb.query('SELECT id, email, nombre FROM usuarios', []);
    
    // Listar todas las direcciones
    const direcciones = sqliteDb.query('SELECT * FROM direcciones', []);
    
    res.json({
      mensaje: 'Diagnóstico de base de datos SQLite',
      usuarios,
      direcciones,
      total_usuarios: usuarios.length,
      total_direcciones: direcciones.length
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error en diagnóstico',
      error: error.message
    });
  }
});

module.exports = router; 