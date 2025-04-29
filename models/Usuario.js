// models/Usuario.js
const db = require('../db/database');
const bcrypt = require('bcrypt');

class Usuario {
  /**
   * Busca un usuario por su ID
   * @param {number} id - ID del usuario
   * @returns {Promise<Object|null>} - Usuario encontrado o null
   */
  static async findById(id) {
    try {
      console.log(`[Usuario.findById] Buscando usuario con ID: ${id}`);
      const usuarios = await db.query(
        'SELECT id, nombre, email, telefono, fecha_nacimiento, genero FROM usuarios WHERE id = ?',
        [id]
      );
      console.log(`[Usuario.findById] Resultado: ${usuarios.length > 0 ? 'Usuario encontrado' : 'Usuario no encontrado'}`);
      return usuarios.length > 0 ? usuarios[0] : null;
    } catch (error) {
      console.error('[Usuario.findById] Error:', error);
      throw error;
    }
  }
  
  /**
   * Buscar usuario por email
   * @param {string} email - Email del usuario
   * @returns {Promise<Object|null>} - Datos del usuario o null si no existe
   */
  static async findByEmail(email) {
    try {
      console.log(`[Usuario.findByEmail] Buscando usuario con email: ${email}`);
      const users = await db.query(
        'SELECT id, nombre, email, password FROM usuarios WHERE email = ?',
        [email]
      );
      
      console.log(`[Usuario.findByEmail] Resultado: ${users.length ? 'Usuario encontrado' : 'Usuario no encontrado'}`);
      if (users.length) {
        console.log(`[Usuario.findByEmail] Usuario encontrado con ID: ${users[0].id}`);
      }
      return users.length ? users[0] : null;
    } catch (error) {
      console.error('[Usuario.findByEmail] Error:', error);
      throw error;
    }
  }
  
  /**
   * Crea un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<number>} - ID del usuario creado
   */
  static async create(userData) {
    try {
      console.log('[Usuario.create] Iniciando creación de usuario');
      const { nombre, email, password, telefono, fecha_nacimiento, genero } = userData;
      
      // Encriptar contraseña
      console.log('[Usuario.create] Encriptando contraseña');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Consulta más simple para mejor compatibilidad
      console.log('[Usuario.create] Preparando consulta SQL simplificada');
      
      // Definir columnas y valores básicos que sabemos que existen
      let campos = ['nombre', 'email', 'password'];
      let valores = [nombre, email, hashedPassword];
      let placeholders = ['?', '?', '?'];
      
      // Opciones para campos adicionales si existen
      if (telefono) {
        campos.push('telefono');
        valores.push(telefono);
        placeholders.push('?');
      }
      
      if (fecha_nacimiento) {
        let fechaFormateada = null;
        try {
          fechaFormateada = new Date(fecha_nacimiento).toISOString().split('T')[0];
        } catch (e) {
          console.log('[Usuario.create] Error al formatear fecha, se usará null');
        }
        campos.push('fecha_nacimiento');
        valores.push(fechaFormateada);
        placeholders.push('?');
      }
      
      if (genero) {
        campos.push('genero');
        valores.push(genero);
        placeholders.push('?');
      }
      
      // No necesitamos incluir created_at y updated_at ya que la base de datos los maneja automáticamente con DEFAULT CURRENT_TIMESTAMP
      // Si los incluimos, podría haber problemas de formato con la fecha
      
      // Construir consulta SQL
      const query = `INSERT INTO usuarios (${campos.join(', ')}) VALUES (${placeholders.join(', ')})`;
      console.log('[Usuario.create] Consulta SQL final:', query);
      
      const result = await db.query(query, valores);
      console.log(`[Usuario.create] Usuario creado exitosamente, ID: ${result.insertId}`);
      
      return result.insertId;
    } catch (error) {
      console.error('[Usuario.create] Error al crear usuario:', error.message);
      throw error;
    }
  }
  
  /**
   * Verifica la contraseña de un usuario
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña sin encriptar
   * @returns {Promise<boolean|Object>} - true/usuario si la contraseña es correcta, false si no
   * @param {boolean} returnUser - Si es true, devuelve el objeto usuario completo en lugar de boolean
   */
  static async verificarPassword(email, password, returnUser = false) {
    try {
      console.log(`[Usuario.verificarPassword] Verificando contraseña para ${email}`);
      
      // Obtener el usuario con su contraseña
      const users = await db.query(
        'SELECT id, nombre, email, password FROM usuarios WHERE email = ?',
        [email]
      );
      
      if (!users || users.length === 0) {
        console.log(`[Usuario.verificarPassword] Usuario no encontrado: ${email}`);
        return false;
      }
      
      const usuario = users[0];
      
      // Verificar que la contraseña tenga formato bcrypt
      if (!usuario.password || !usuario.password.startsWith('$2')) {
        console.log(`[Usuario.verificarPassword] Contraseña inválida para usuario ${email} (formato no válido)`);
        return false;
      }
      
      console.log(`[Usuario.verificarPassword] Comparando contraseña (hash de longitud ${usuario.password.length})`);
      
      // Comparar contraseña
      const match = await bcrypt.compare(password, usuario.password);
      console.log(`[Usuario.verificarPassword] Resultado comparación: ${match ? 'Exitoso' : 'Fallido'}`);
      
      if (!match) {
        return false;
      }
      
      if (returnUser) {
        // Eliminar la contraseña del objeto de usuario antes de devolverlo
        delete usuario.password;
        return usuario;
      }
      
      return true;
    } catch (error) {
      console.error(`[Usuario.verificarPassword] Error:`, error);
      return false;
    }
  }

  /**
   * Verifica credenciales de un usuario (alias de verificarPassword con returnUser=true)
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña sin encriptar
   * @returns {Promise<Object|null>} - Usuario autenticado o null
   */
  static async verificarCredenciales(email, password) {
    const result = await this.verificarPassword(email, password, true);
    return result || null;
  }

  /**
   * Actualiza los datos de un usuario
   * @param {number} id - ID del usuario
   * @param {Object} userData - Datos a actualizar
   * @returns {Promise<boolean>} - true si la actualización fue exitosa
   */
  static async update(id, userData) {
    try {
      const { nombre, telefono, fecha_nacimiento, genero } = userData;
      
      // Format fecha_nacimiento properly or set to null if empty/invalid
      let fechaFormateada = null;
      if (fecha_nacimiento) {
        try {
          fechaFormateada = new Date(fecha_nacimiento).toISOString().split('T')[0];
        } catch (e) {
          console.log('[Usuario.update] Error al formatear fecha, se usará null');
        }
      }
      
      await db.query(
        'UPDATE usuarios SET nombre = ?, telefono = ?, fecha_nacimiento = ?, genero = ? WHERE id = ?',
        [nombre, telefono, fechaFormateada, genero, id]
      );
      
      return true;
    } catch (error) {
      console.error(`[Usuario.update] Error al actualizar usuario:`, error);
      return false;
    }
  }

  /**
   * Actualiza la contraseña de un usuario
   * @param {number} id - ID del usuario
   * @param {string} newPassword - Nueva contraseña sin encriptar
   * @returns {Promise<boolean>} - true si la actualización fue exitosa
   */
  static async updatePassword(id, newPassword) {
    try {
      // Encriptar nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await db.query(
        'UPDATE usuarios SET password = ? WHERE id = ?',
        [hashedPassword, id]
      );
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  static async obtenerDirecciones(usuarioId) {
    try {
      const direcciones = await db.query(
        'SELECT * FROM direcciones WHERE usuario_id = ?',
        [usuarioId]
      );
      
      return direcciones;
    } catch (error) {
      console.error(`[Usuario.obtenerDirecciones] Error:`, error);
      return [];
    }
  }
  
  static async obtenerDireccionPrincipal(usuarioId) {
    try {
      const direcciones = await db.query(
        'SELECT * FROM direcciones WHERE usuario_id = ? AND es_principal = 1',
        [usuarioId]
      );
      
      return direcciones.length > 0 ? direcciones[0] : null;
    } catch (error) {
      console.error(`[Usuario.obtenerDireccionPrincipal] Error:`, error);
      return null;
    }
  }
}

module.exports = Usuario;