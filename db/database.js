// db/database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('Configurando conexión a la base de datos...');
console.log('Configuración de conexión:', {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD ? '[PASSWORD OCULTO]' : '', // No mostrar la contraseña real
  database: process.env.DB_NAME || 'zapatosmoreno',
  connectionLimit: 10
});

// Crear un pool de conexiones para mejor rendimiento
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'zapatosmoreno',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * Ejecuta una consulta SQL con parámetros
 * @param {string} sql - Consulta SQL
 * @param {Array} params - Parámetros para la consulta
 * @returns {Promise<Array>} - Resultado de la consulta
 */
async function query(sql, params) {
  try {
    console.log(`[DB] Ejecutando consulta SQL: ${sql}`);
    console.log(`[DB] Parámetros:`, params);
    
    const [results] = await pool.execute(sql, params);
    
    console.log(`[DB] Consulta exitosa, filas afectadas/devueltas: ${results.affectedRows || results.length}`);
    
    if (results.insertId) {
      console.log(`[DB] ID insertado: ${results.insertId}`);
    }
    
    return results;
  } catch (error) {
    console.error('[DB] Error en consulta SQL:', error);
    console.error('[DB] Mensaje de error:', error.message);
    console.error('[DB] Código de error SQL:', error.code);
    console.error('[DB] SQL Estado:', error.sqlState);
    console.error('[DB] SQL Query:', error.sql);
    throw error;
  }
}

/**
 * Ejecuta una función dentro de una transacción
 * @param {Function} callback - Función que recibe la conexión y ejecuta consultas
 * @returns {Promise<void>}
 */
async function transaction(callback) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    await callback(connection);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Verifica la conexión a la base de datos
 * @returns {Promise<boolean>} - true si la conexión es exitosa
 */
async function verificarConexion() {
  try {
    console.log('[DB] Verificando conexión a la base de datos...');
    console.log('[DB] Intentando obtener conexión...');
    
    const connection = await pool.getConnection();
    console.log('[DB] Conexión obtenida correctamente');
    
    // Verificar que la base de datos existe
    console.log('[DB] Verificando que la base de datos existe...');
    try {
      const [databases] = await connection.query('SHOW DATABASES');
      const dbExists = databases.some(db => db.Database === (process.env.DB_NAME || 'zapatosmoreno'));
      
      if (!dbExists) {
        console.error(`[DB] ERROR: La base de datos '${process.env.DB_NAME || 'zapatosmoreno'}' no existe!`);
        console.error(`[DB] Bases de datos disponibles: ${databases.map(db => db.Database).join(', ')}`);
        connection.release();
        return false;
      }
      
      console.log(`[DB] Base de datos '${process.env.DB_NAME || 'zapatosmoreno'}' encontrada`);
    } catch (dbError) {
      console.error('[DB] Error al verificar bases de datos:', dbError);
      connection.release();
      return false;
    }
    
    // Verificar que la tabla usuarios existe
    console.log('[DB] Verificando que la tabla usuarios existe...');
    try {
      const [tables] = await connection.query('SHOW TABLES');
      const usuariosExists = tables.some(table => table[`Tables_in_${process.env.DB_NAME || 'zapatosmoreno'}`] === 'usuarios');
      
      if (!usuariosExists) {
        console.error('[DB] ERROR: La tabla usuarios no existe!');
        console.error(`[DB] Tablas disponibles: ${tables.map(table => table[`Tables_in_${process.env.DB_NAME || 'zapatosmoreno'}`]).join(', ')}`);
        connection.release();
        return false;
      }
      
      console.log('[DB] Tabla usuarios encontrada');
    } catch (tableError) {
      console.error('[DB] Error al verificar tablas:', tableError);
      connection.release();
      return false;
    }
    
    // Verificar estructura de la tabla usuarios
    console.log('[DB] Verificando estructura de la tabla usuarios...');
    try {
      const [columns] = await connection.query('SHOW COLUMNS FROM usuarios');
      console.log('[DB] Estructura de la tabla usuarios:', columns.map(c => c.Field));
      
      // Verificar si existen las columnas necesarias
      const requiredColumns = ['id', 'nombre', 'email', 'password', 'telefono', 'fecha_nacimiento', 'genero'];
      const missingColumns = requiredColumns.filter(column => !columns.some(c => c.Field === column));
      
      if (missingColumns.length > 0) {
        console.error(`[DB] ERROR: Faltan las siguientes columnas en la tabla usuarios: ${missingColumns.join(', ')}`);
        connection.release();
        return false;
      }
    } catch (columnError) {
      console.error('[DB] Error al verificar estructura de la tabla:', columnError);
      connection.release();
      return false;
    }
    
    console.log('✅ Conexión a la base de datos establecida correctamente');
    console.log('✅ La estructura de la base de datos es correcta');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error);
    console.error('❌ Mensaje de error:', error.message);
    console.error('❌ Código de error:', error.code);
    console.error('❌ SQL Estado:', error.sqlState);
    return false;
  }
}

// Función para verificar y crear la tabla direcciones si no existe
async function verificarTablaDirecciones() {
  try {
    console.log('[DB] Verificando que la tabla direcciones existe...');
    
    // Verificar si la tabla existe
    const [tablas] = await pool.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'direcciones'
    `, [process.env.DB_NAME || 'zapatosmoreno']);
    
    if (tablas.length === 0) {
      console.log('[DB] Tabla direcciones no encontrada, creándola...');
      
      // Crear la tabla direcciones
      await pool.query(`
        CREATE TABLE IF NOT EXISTS direcciones (
          id INT PRIMARY KEY AUTO_INCREMENT,
          usuario_id INT NOT NULL,
          nombre VARCHAR(100) NOT NULL,
          direccion VARCHAR(255) NOT NULL,
          ciudad VARCHAR(100) NOT NULL,
          codigo_postal VARCHAR(10),
          telefono VARCHAR(20),
          es_principal TINYINT(1) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('[DB] Tabla direcciones creada correctamente');
    } else {
      console.log('[DB] Tabla direcciones encontrada');
      
      // Verificar estructura de la tabla
      const [columnas] = await pool.query(`
        SHOW COLUMNS FROM direcciones
      `);
      
      console.log('[DB] Estructura de la tabla direcciones:', columnas.map(col => col.Field).join(', '));
      
      // IMPORTANTE: Verificar si existe alguna columna "estado" que esté causando problemas
      const columnaEstado = columnas.find(col => col.Field === 'estado');
      if (columnaEstado) {
        console.log('[DB] ⚠️ PROBLEMA DETECTADO: Existe un campo "estado" en la tabla direcciones que puede causar errores');
        console.log('[DB] Eliminando columna "estado" que está causando problemas...');
        
        try {
          await pool.query(`
            ALTER TABLE direcciones DROP COLUMN estado
          `);
          console.log('[DB] ✅ Campo "estado" eliminado correctamente');
        } catch (alterError) {
          console.error('[DB] Error al eliminar columna estado:', alterError);
        }
      }
      
      // Verificar si existen todas las columnas necesarias
      const columnasRequeridas = ['id', 'usuario_id', 'nombre', 'direccion', 'ciudad', 'codigo_postal', 'telefono', 'es_principal'];
      const columnasFaltantes = columnasRequeridas.filter(col => !columnas.some(c => c.Field === col));
      
      if (columnasFaltantes.length > 0) {
        console.log(`[DB] Faltan columnas en la tabla direcciones: ${columnasFaltantes.join(', ')}`);
        
        // Intentar reparar la tabla añadiendo las columnas faltantes
        try {
          for (const columna of columnasFaltantes) {
            console.log(`[DB] Añadiendo columna faltante: ${columna}`);
            
            let definicion = '';
            switch(columna) {
              case 'id':
                definicion = 'INT PRIMARY KEY AUTO_INCREMENT';
                break;
              case 'usuario_id':
                definicion = 'INT NOT NULL';
                break;
              case 'nombre':
                definicion = 'VARCHAR(100) NOT NULL';
                break;
              case 'direccion':
                definicion = 'VARCHAR(255) NOT NULL';
                break;
              case 'ciudad':
                definicion = 'VARCHAR(100) NOT NULL';
                break;
              case 'codigo_postal':
                definicion = 'VARCHAR(10)';
                break;
              case 'telefono':
                definicion = 'VARCHAR(20)';
                break;
              case 'es_principal':
                definicion = 'TINYINT(1) DEFAULT 0';
                break;
              default:
                definicion = 'VARCHAR(100)';
            }
            
            await pool.query(`
              ALTER TABLE direcciones ADD COLUMN ${columna} ${definicion}
            `);
            
            console.log(`[DB] ✅ Columna ${columna} añadida correctamente`);
          }
        } catch (alterError) {
          console.error('[DB] Error al añadir columnas faltantes:', alterError);
          console.log('[DB] Será necesario recrear la tabla desde cero');
          
          // Verificar si hay datos existentes
          const [count] = await pool.query('SELECT COUNT(*) as total FROM direcciones');
          const total = count[0].total;
          
          if (total > 0) {
            console.log(`[DB] ⚠️ La tabla direcciones contiene ${total} registros que podrían perderse`);
            console.log('[DB] Se requiere respaldo y migración manual');
          } else {
            console.log('[DB] La tabla está vacía, procediendo a recrearla');
            
            try {
              // Eliminar tabla existente
              await pool.query('DROP TABLE direcciones');
              console.log('[DB] Tabla eliminada, recreando con estructura correcta');
              
              // Recrear tabla
              await pool.query(`
                CREATE TABLE direcciones (
                  id INT PRIMARY KEY AUTO_INCREMENT,
                  usuario_id INT NOT NULL,
                  nombre VARCHAR(100) NOT NULL,
                  direccion VARCHAR(255) NOT NULL,
                  ciudad VARCHAR(100) NOT NULL,
                  codigo_postal VARCHAR(10),
                  telefono VARCHAR(20),
                  es_principal TINYINT(1) DEFAULT 0,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
              `);
              
              console.log('[DB] ✅ Tabla direcciones recreada correctamente');
            } catch (recreateError) {
              console.error('[DB] Error al recrear la tabla:', recreateError);
            }
          }
        }
      } else {
        console.log('[DB] ✅ Todas las columnas necesarias están presentes');
      }
      
      // Verificar índices y claves foráneas
      const [indices] = await pool.query(`
        SHOW INDEX FROM direcciones
      `);
      
      const tieneIndiceUsuario = indices.some(idx => 
        idx.Column_name === 'usuario_id' && idx.Key_name.includes('usuario_id')
      );
      
      if (!tieneIndiceUsuario) {
        console.log('[DB] Falta índice para usuario_id, intentando añadir...');
        try {
          await pool.query(`
            ALTER TABLE direcciones ADD INDEX (usuario_id)
          `);
          console.log('[DB] ✅ Índice añadido correctamente');
        } catch (indexError) {
          console.error('[DB] Error al añadir índice:', indexError);
        }
      }
    }
    
    console.log('[DB] Verificación de tabla direcciones completada');
  } catch (error) {
    console.error('[DB] Error al verificar/crear tabla direcciones:', error);
    throw error;
  }
}

// Inicializar la base de datos
async function inicializarBaseDatos() {
  try {
    console.log('Configurando conexión a la base de datos...');
    
    // Verificar conexión
    const conexion = await pool.getConnection();
    console.log('[DB] Conexión obtenida correctamente');
    conexion.release();
    
    // Verificar que existe la base de datos
    const [bases] = await pool.query('SHOW DATABASES LIKE ?', ['zapatosmoreno']);
    if (bases.length === 0) {
      throw new Error('La base de datos zapatosmoreno no existe');
    }
    console.log('[DB] Base de datos zapatosmoreno encontrada');
    
    // Verificar tabla usuarios
    const [tablas] = await pool.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'zapatosmoreno' 
      AND TABLE_NAME = 'usuarios'
    `);
    
    if (tablas.length === 0) {
      throw new Error('La tabla usuarios no existe');
    }
    console.log('[DB] Tabla usuarios encontrada');
    
    // Verificar tabla direcciones
    await verificarTablaDirecciones();
    
    console.log('✅ Conexión a la base de datos establecida correctamente');
    console.log('✅ La estructura de la base de datos es correcta');
    
    // Devolver true explícitamente para indicar éxito
    return true;
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    return false;
  }
}

// Exportar funciones y el pool
module.exports = {
  query,
  transaction,
  pool,
  verificarConexion,
  verificarTablaDirecciones,
  inicializarBaseDatos
};