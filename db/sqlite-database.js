const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Asegurar que existe el directorio de datos
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Ruta a la base de datos SQLite
const dbPath = path.join(dataDir, 'zapatosmoreno.db');
console.log(`Usando base de datos SQLite en: ${dbPath}`);

// Crear/Conectar a la base de datos
const db = new Database(dbPath);

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

/**
 * Inicializa la estructura de la base de datos si no existe
 */
function initializeDatabase() {
    console.log('Inicializando base de datos SQLite...');
    
    // Crear tabla usuarios si no existe
    db.exec(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            telefono TEXT,
            fecha_nacimiento TEXT,
            genero TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Crear tabla direcciones si no existe
    db.exec(`
        CREATE TABLE IF NOT EXISTS direcciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            nombre TEXT NOT NULL,
            direccion TEXT NOT NULL,
            ciudad TEXT NOT NULL,
            codigo_postal TEXT,
            telefono TEXT,
            es_principal INTEGER DEFAULT 0,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )
    `);
    
    // Verificar si existe el usuario duvan@gmail.com
    const userExists = db.prepare('SELECT id FROM usuarios WHERE email = ?').get('duvan@gmail.com');
    
    if (!userExists) {
        console.log('Creando usuario de prueba (duvan@gmail.com)...');
        
        // Insertar usuario de prueba
        const stmt = db.prepare(`
            INSERT INTO usuarios (nombre, email, password, telefono)
            VALUES (?, ?, ?, ?)
        `);
        
        const userId = stmt.run('duvan moreno', 'duvan@gmail.com', 'password_encriptado', '3211234567').lastInsertRowid;
        console.log(`Usuario creado con ID: ${userId}`);
        
        // Insertar dirección de prueba
        const addrStmt = db.prepare(`
            INSERT INTO direcciones (usuario_id, nombre, direccion, ciudad, codigo_postal, telefono, es_principal)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        addrStmt.run(userId, 'Casa', 'Calle 123 #45-67', 'Villavicencio', '500001', '3211234567', 1);
        console.log('Dirección de prueba creada');
        
        // Insertar una segunda dirección
        addrStmt.run(userId, 'Trabajo', 'Av Principal #40-60', 'Villavicencio', '500001', '3211234567', 0);
        console.log('Segunda dirección creada');
    } else {
        console.log(`Usuario duvan@gmail.com ya existe con ID: ${userExists.id}`);
        
        // Verificar si tiene direcciones
        const addressCount = db.prepare('SELECT COUNT(*) as count FROM direcciones WHERE usuario_id = ?').get(userExists.id);
        
        if (addressCount.count === 0) {
            console.log('Creando direcciones de prueba para el usuario...');
            
            // Insertar dirección de prueba
            const addrStmt = db.prepare(`
                INSERT INTO direcciones (usuario_id, nombre, direccion, ciudad, codigo_postal, telefono, es_principal)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            
            addrStmt.run(userExists.id, 'Casa', 'Calle 123 #45-67', 'Villavicencio', '500001', '3211234567', 1);
            addrStmt.run(userExists.id, 'Trabajo', 'Av Principal #40-60', 'Villavicencio', '500001', '3211234567', 0);
            
            console.log('Direcciones de prueba creadas');
        } else {
            console.log(`El usuario tiene ${addressCount.count} direcciones`);
        }
    }
    
    console.log('Base de datos inicializada correctamente');
}

/**
 * Ejecuta una consulta y devuelve todos los resultados
 * @param {string} sql - Consulta SQL
 * @param {Array} params - Parámetros para la consulta
 * @returns {Array} - Resultados de la consulta
 */
function query(sql, params = []) {
    try {
        console.log(`[DB] Ejecutando consulta: ${sql}`);
        console.log(`[DB] Parámetros: ${JSON.stringify(params)}`);
        
        const stmt = db.prepare(sql);
        const results = stmt.all(...params);
        
        console.log(`[DB] Resultados: ${results.length} filas`);
        return results;
    } catch (error) {
        console.error(`[DB] Error en consulta: ${error.message}`);
        throw error;
    }
}

/**
 * Ejecuta una consulta de inserción/actualización/eliminación
 * @param {string} sql - Consulta SQL
 * @param {Array} params - Parámetros para la consulta
 * @returns {Object} - Información sobre la ejecución
 */
function execute(sql, params = []) {
    try {
        console.log(`[DB] Ejecutando: ${sql}`);
        console.log(`[DB] Parámetros: ${JSON.stringify(params)}`);
        
        const stmt = db.prepare(sql);
        const result = stmt.run(...params);
        
        console.log(`[DB] Filas afectadas: ${result.changes}`);
        return { 
            changes: result.changes,
            lastInsertRowid: result.lastInsertRowid
        };
    } catch (error) {
        console.error(`[DB] Error en ejecución: ${error.message}`);
        throw error;
    }
}

/**
 * Obtiene un único registro
 * @param {string} sql - Consulta SQL
 * @param {Array} params - Parámetros para la consulta
 * @returns {Object|null} - Resultado o null
 */
function get(sql, params = []) {
    try {
        const stmt = db.prepare(sql);
        return stmt.get(...params);
    } catch (error) {
        console.error(`[DB] Error en get: ${error.message}`);
        throw error;
    }
}

/**
 * Obtiene direcciones por ID de usuario
 * @param {number} usuarioId - ID del usuario
 * @returns {Array} - Direcciones del usuario
 */
function obtenerDireccionesPorUsuario(usuarioId) {
    try {
        console.log(`[DB] Obteniendo direcciones para usuario ID: ${usuarioId}`);
        
        if (!usuarioId) {
            console.error('[DB] Error: ID de usuario no proporcionado');
            return [];
        }
        
        const direcciones = query(
            'SELECT * FROM direcciones WHERE usuario_id = ?',
            [usuarioId]
        );
        
        console.log(`[DB] Encontradas ${direcciones.length} direcciones para usuario ID ${usuarioId}`);
        
        if (direcciones.length > 0) {
            console.log(`[DB] Primera dirección encontrada:`, direcciones[0]);
        }
        
        return direcciones;
    } catch (error) {
        console.error('[DB] Error al obtener direcciones:', error);
        return [];
    }
}

// Inicializar la base de datos al cargar el módulo
initializeDatabase();

// Exportar funciones
module.exports = {
    db,
    query,
    execute,
    get,
    obtenerDireccionesPorUsuario
}; 