const mysql = require('mysql2/promise');

async function createDatabase() {
    console.log('=== VERIFICANDO/CREANDO BASE DE DATOS ===');
    let connection;

    try {
        // Conectar a MySQL sin especificar una base de datos
        console.log('Conectando a MySQL con usuario: root, password: [OCULTA]');
        
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '3312',
            connectTimeout: 5000
        });
        
        console.log('✅ Conexión a MySQL establecida correctamente');
        
        // Verificar si existe la base de datos
        const [rows] = await connection.query(`SHOW DATABASES LIKE 'zapatosmoreno'`);
        
        if (rows.length === 0) {
            console.log('⚠️ Base de datos "zapatosmoreno" no existe, creándola...');
            await connection.query(`CREATE DATABASE zapatosmoreno`);
            console.log('✅ Base de datos "zapatosmoreno" creada correctamente');
        } else {
            console.log('✅ Base de datos "zapatosmoreno" ya existe');
        }
        
        // Usar la base de datos
        await connection.query(`USE zapatosmoreno`);
        console.log('✅ Usando base de datos "zapatosmoreno"');
        
        // Verificar si existe la tabla direcciones
        const [tables] = await connection.query(`SHOW TABLES LIKE 'direcciones'`);
        
        if (tables.length === 0) {
            console.log('⚠️ Tabla "direcciones" no existe, creándola...');
            await connection.query(`
                CREATE TABLE direcciones (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    usuario_id INT NOT NULL,
                    nombre VARCHAR(100) NOT NULL,
                    direccion VARCHAR(255) NOT NULL,
                    ciudad VARCHAR(100) NOT NULL,
                    codigo_postal VARCHAR(10),
                    telefono VARCHAR(20),
                    es_principal TINYINT(1) DEFAULT 0
                )
            `);
            console.log('✅ Tabla "direcciones" creada correctamente');
        } else {
            console.log('✅ Tabla "direcciones" ya existe');
        }
        
        // Verificar si existe la tabla usuarios
        const [userTables] = await connection.query(`SHOW TABLES LIKE 'usuarios'`);
        
        if (userTables.length === 0) {
            console.log('⚠️ Tabla "usuarios" no existe, creándola...');
            await connection.query(`
                CREATE TABLE usuarios (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    nombre VARCHAR(100) NOT NULL,
                    email VARCHAR(100) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    telefono VARCHAR(20),
                    fecha_nacimiento DATE,
                    genero VARCHAR(20),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Tabla "usuarios" creada correctamente');
            
            // Insertar usuario de prueba
            const hashedPassword = 'password_encriptado'; // Normalmente usarías bcrypt.hashSync('password', 10)
            await connection.query(`
                INSERT INTO usuarios (nombre, email, password, telefono)
                VALUES ('duvan moreno', 'duvan@gmail.com', ?, '3211234567')
            `, [hashedPassword]);
            
            console.log('✅ Usuario de prueba creado correctamente');
        } else {
            console.log('✅ Tabla "usuarios" ya existe');
            
            // Verificar si existe el usuario de prueba
            const [users] = await connection.query(`SELECT id, email FROM usuarios WHERE email = 'duvan@gmail.com'`);
            
            if (users.length === 0) {
                console.log('⚠️ Usuario de prueba no existe, creándolo...');
                const hashedPassword = 'password_encriptado';
                await connection.query(`
                    INSERT INTO usuarios (nombre, email, password, telefono)
                    VALUES ('duvan moreno', 'duvan@gmail.com', ?, '3211234567')
                `, [hashedPassword]);
                console.log('✅ Usuario de prueba creado correctamente');
            } else {
                console.log(`✅ Usuario de prueba ya existe con ID: ${users[0].id}`);
                
                // Asegurarse que el ID es 19
                if (users[0].id !== 19) {
                    console.log(`⚠️ ADVERTENCIA: El usuario duvan@gmail.com tiene ID ${users[0].id}, pero se esperaba ID 19.`);
                    console.log('⚠️ Esto puede causar problemas si el código está hardcodeado para usar ID 19.');
                }
            }
        }
        
        // Verificar si el usuario duvan@gmail.com tiene direcciones
        try {
            const [userRows] = await connection.query(`SELECT id FROM usuarios WHERE email = 'duvan@gmail.com'`);
            
            if (userRows.length > 0) {
                const userId = userRows[0].id;
                const [addressRows] = await connection.query(`SELECT COUNT(*) as count FROM direcciones WHERE usuario_id = ?`, [userId]);
                
                if (addressRows[0].count === 0) {
                    console.log(`⚠️ Usuario duvan@gmail.com (ID: ${userId}) no tiene direcciones, creando una...`);
                    
                    // Insertar dirección de prueba
                    await connection.query(`
                        INSERT INTO direcciones (usuario_id, nombre, direccion, ciudad, codigo_postal, telefono, es_principal)
                        VALUES (?, 'Casa', 'Calle 123 #45-67', 'Villavicencio', '500001', '3211234567', 1)
                    `, [userId]);
                    
                    console.log('✅ Dirección de prueba creada correctamente');
                } else {
                    console.log(`✅ Usuario duvan@gmail.com (ID: ${userId}) ya tiene ${addressRows[0].count} direcciones`);
                    
                    // Mostrar direcciones
                    const [addresses] = await connection.query(`SELECT * FROM direcciones WHERE usuario_id = ?`, [userId]);
                    console.log('Direcciones:', addresses);
                }
            }
        } catch (error) {
            console.error('Error al verificar direcciones:', error);
        }
        
        console.log('✅ Base de datos configurada correctamente');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Conexión cerrada');
        }
    }
}

createDatabase().catch(console.error);