// controllers/authController.js
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const db = require('../db/database');

/**
 * Registro de usuario
 * @route POST /api/auth/registro
 */
exports.register = async (req, res) => {
  try {
    console.log('===== INICIO REGISTRO DE USUARIO =====');
    console.log('Datos recibidos:', JSON.stringify(req.body));
    
    const { nombre, email, password, telefono, fecha_nacimiento, genero } = req.body;
    
    // Validaciones básicas
    if (!nombre || !email || !password) {
      console.log('ERROR: Faltan campos obligatorios');
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
    }
    
    // Verificar si el email ya está registrado - Con doble verificación
    console.log('Verificando email existente:', email);
    
    try {
      // Verificación directa con una consulta SQL
      const [usuariosDirectos] = await db.pool.query(
        'SELECT id, email FROM usuarios WHERE email = ?',
        [email]
      );
      
      console.log('Resultado de verificación directa SQL:', 
                  usuariosDirectos.length ? 'Email encontrado' : 'Email disponible');
      
      // Si el email existe en la base de datos
      if (usuariosDirectos && usuariosDirectos.length > 0) {
        console.log('ERROR: Email ya registrado (verificación SQL directa)');
        return res.status(400).json({ 
          mensaje: 'El correo electrónico ya está registrado', 
          error: 'duplicate_email',
          verificacion: 'sql_directa'
        });
      }
      
      // Verificación adicional usando el modelo
      const existeUsuario = await Usuario.findByEmail(email);
      
      if (existeUsuario) {
        console.log('ERROR: Email ya registrado (verificación modelo)');
        return res.status(400).json({ 
          mensaje: 'El correo electrónico ya está registrado', 
          error: 'duplicate_email',
          verificacion: 'modelo'
        });
      }
      
      console.log('El email está disponible para registro');
    } catch (verifyError) {
      console.error('ERROR al verificar email existente:', verifyError);
      // No retornamos error aquí, intentamos crear el usuario de todas formas
    }
    
    // Crear usuario con mejor manejo de errores
    try {
      console.log('Iniciando proceso de creación de usuario en base de datos...');
      
      // Primero intentamos con el método normal
      let userId;
      try {
        userId = await Usuario.create({ 
          nombre, 
          email, 
          password,
          telefono, 
          fecha_nacimiento, 
          genero 
        });
        console.log('Usuario registrado con éxito usando método normal. ID:', userId);
      } catch (methodError) {
        console.error('Error en primer intento de creación:', methodError);
        
        // Verificar si el error es de duplicado
        if (methodError.code === 'ER_DUP_ENTRY') {
          console.log('ERROR: Email duplicado detectado durante la creación');
          return res.status(400).json({ 
            mensaje: 'El correo electrónico ya está registrado', 
            error: 'duplicate_email',
            verificacion: 'error_creacion'
          });
        }
        
        // Si falla por otra razón, intentamos con un método alternativo directo a la base de datos
        console.log('Intentando método alternativo de creación...');
        const bcrypt = require('bcrypt');
        
        // Hasheamos la contraseña manualmente
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Intentamos inserción directa con todos los campos
        const campos = ['nombre', 'email', 'password'];
        const valores = [nombre, email, hashedPassword];
        
        // Agregar campos opcionales si existen
        if (telefono) {
          campos.push('telefono');
          valores.push(telefono);
        }
        
        if (fecha_nacimiento) {
          let fechaFormateada = null;
          try {
            fechaFormateada = new Date(fecha_nacimiento).toISOString().split('T')[0];
          } catch (e) {
            console.log('Error al formatear fecha, se usará null');
          }
          campos.push('fecha_nacimiento');
          valores.push(fechaFormateada);
        }
        
        if (genero) {
          campos.push('genero');
          valores.push(genero);
        }
        
        // No incluimos created_at y updated_at ya que la base de datos los maneja automáticamente
        // con DEFAULT CURRENT_TIMESTAMP
        
        // Construir consulta SQL dinámica
        const placeholders = valores.map(() => '?').join(', ');
        const query = `INSERT INTO usuarios (${campos.join(', ')}) VALUES (${placeholders})`;
        console.log('Consulta SQL alternativa:', query);
        
        try {
          const result = await db.query(query, valores);
          userId = result.insertId;
          console.log('Usuario registrado con éxito usando método alternativo. ID:', userId);
        } catch (sqlError) {
          // Manejar error de duplicado en método alternativo
          if (sqlError.code === 'ER_DUP_ENTRY') {
            console.log('ERROR: Email duplicado detectado durante la creación alternativa');
            return res.status(400).json({ 
              mensaje: 'El correo electrónico ya está registrado', 
              error: 'duplicate_email',
              verificacion: 'error_creacion_alternativa'
            });
          }
          throw sqlError; // Relanzar otros errores
        }
      }
      
      // Verificamos que el usuario se haya guardado
      console.log('Verificando que el usuario se haya guardado correctamente...');
      let usuarioCreado;
      try {
        usuarioCreado = await Usuario.findByEmail(email);
        if (!usuarioCreado) {
          console.error('ERROR: Usuario no encontrado después de la creación');
          throw new Error('No se pudo verificar la creación del usuario. El usuario no fue encontrado en la base de datos después de la creación.');
        }
        console.log('Usuario encontrado en la base de datos:', usuarioCreado);
      } catch (verifyError) {
        console.error('ERROR al verificar usuario creado:', verifyError);
        throw new Error(`Error al verificar usuario creado: ${verifyError.message}`);
      }
      
      console.log('✓ Usuario verificado en la base de datos. ID:', usuarioCreado.id);
      
      // Respuesta exitosa al cliente
      res.status(201).json({ 
        mensaje: 'Usuario registrado correctamente',
        userId: usuarioCreado.id,
        email: email // Incluimos el email para el frontend
      });
    } catch (dbError) {
      console.error('ERROR FATAL al crear usuario en BD:', dbError);
      throw new Error('No se pudo registrar el usuario. Error interno del servidor.');
    }
  } catch (error) {
    console.error('Error en registro:', error);
    
    // Proporcionar mensajes de error más específicos basados en el tipo de error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        mensaje: 'El correo electrónico ya está registrado', 
        error: 'duplicate_email'
      });
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ 
        mensaje: 'Error en la base de datos: tabla no encontrada', 
        error: 'database_error'
      });
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({ 
        mensaje: 'Error en la base de datos: campo no encontrado', 
        error: 'database_error'
      });
    } else if (error.code === 'ECONNREFUSED') {
      return res.status(500).json({ 
        mensaje: 'No se pudo conectar a la base de datos', 
        error: 'connection_error'
      });
    }
    
    res.status(500).json({ 
      mensaje: 'Error al registrar usuario', 
      error: error.message
    });
  }
};

// Agregar un alias para mantener compatibilidad con la ruta usuarioRoutes
exports.registro = exports.register;

/**
 * Login de usuario
 * @route POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    console.log('===== INICIO LOGIN DE USUARIO =====');
    console.log('Datos recibidos:', JSON.stringify({
      email: req.body.email, 
      passwordLength: req.body.password ? req.body.password.length : 0
    }));
    
    const { email, password } = req.body;
    
    // Validaciones básicas
    if (!email || !password) {
      console.log('ERROR: Email o contraseña faltantes');
      return res.status(400).json({ mensaje: 'Email y contraseña son obligatorios' });
    }
    
    // Buscar el usuario directamente
    console.log('Buscando usuario por email:', email);
    let usuario;
    try {
      usuario = await Usuario.findByEmail(email);
      
      if (!usuario) {
        console.log('ERROR: Usuario no encontrado con email:', email);
        return res.status(401).json({ mensaje: 'Credenciales incorrectas. El email no está registrado.' });
      }
      
      console.log('Usuario encontrado en la base de datos:', { id: usuario.id, email: usuario.email });
    } catch (findError) {
      console.error('ERROR al buscar usuario:', findError);
      return res.status(500).json({ mensaje: 'Error al buscar usuario', error: findError.message });
    }
    
    console.log('Usuario encontrado, ID:', usuario.id);
    
    // Verificar contraseña
    console.log('Verificando contraseña...');
    try {
      const passwordCorrecta = await Usuario.verificarPassword(email, password);
      
      if (!passwordCorrecta) {
        console.log('ERROR: Contraseña incorrecta para el usuario con email:', email);
        return res.status(401).json({ mensaje: 'Credenciales incorrectas. La contraseña no es válida.' });
      }
      
      console.log('Contraseña verificada correctamente para el usuario:', email);
    } catch (passwordError) {
      console.error('ERROR al verificar contraseña:', passwordError);
      return res.status(500).json({ mensaje: 'Error al verificar contraseña', error: passwordError.message });
    }
    
    console.log('Contraseña verificada correctamente');
    
    // Generar token JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET || 'clave_secreta_temporal',
      { expiresIn: '24h' }
    );
    
    console.log('Token JWT generado');
    
    // Respuesta exitosa
    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      mensaje: 'Error al iniciar sesión', 
      error: error.message 
    });
  }
};

/**
 * Obtener perfil del usuario autenticado
 * @route GET /api/usuario/perfil
 */
exports.obtenerPerfil = async (req, res) => {
  try {
    console.log('Obteniendo perfil de usuario:', req.usuario ? req.usuario.id : 'usuario no disponible');
    
    // Verificar si req.usuario fue establecido por el middleware
    if (!req.usuario) {
      console.error('Error: No hay usuario en la solicitud');
      return res.status(401).json({ mensaje: 'No autorizado - Token inválido' });
    }
    
    // Devolver los datos del usuario directamente
    res.json({
      id: req.usuario.id,
      nombre: req.usuario.nombre,
      email: req.usuario.email,
      telefono: req.usuario.telefono || null,
      fecha_nacimiento: req.usuario.fecha_nacimiento || null,
      genero: req.usuario.genero || null
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ mensaje: 'Error al obtener perfil del usuario', error: error.message });
  }
};

// Aseguramos que getMe es un alias para obtenerPerfil
exports.getMe = exports.obtenerPerfil;

/**
 * Actualizar datos del usuario
 * @route PUT /api/auth/profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { nombre, telefono, fecha_nacimiento, genero } = req.body;
    
    const result = await Usuario.update(req.usuario.id, {
      nombre,
      telefono,
      fecha_nacimiento,
      genero
    });
    
    if (result) {
      res.json({ 
        mensaje: 'Perfil actualizado correctamente',
        usuario: {
          id: req.usuario.id,
          nombre,
          telefono,
          fecha_nacimiento,
          genero
        }
      });
    } else {
      throw new Error('No se pudo actualizar el perfil');
    }
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ mensaje: 'Error al actualizar información del usuario' });
  }
};

/**
 * Cambiar contraseña
 * @route POST /api/auth/cambiar-password
 */
exports.changePassword = async (req, res) => {
  try {
    const { password_actual, password_nuevo } = req.body;
    
    // Verificar la contraseña actual
    const usuario = await Usuario.findById(req.usuario.id);
    const passwordMatch = await Usuario.verificarPassword(usuario.email, password_actual);
    
    if (!passwordMatch) {
      return res.status(400).json({ mensaje: 'La contraseña actual es incorrecta' });
    }
    
    // Actualizar la contraseña
    await Usuario.updatePassword(req.usuario.id, password_nuevo);
    
    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ mensaje: 'Error al cambiar la contraseña' });
  }
};