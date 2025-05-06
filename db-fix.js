// db-fix.js - Intenta múltiples configuraciones para conectarse a MySQL
const mysql = require('mysql2/promise');

async function tryConnectionOptions() {
    console.log('=== INTENTANDO CONEXIONES CON DIFERENTES CREDENCIALES ===');
    
    // Opciones comunes para servidores MySQL
    const options = [
        { host: 'localhost', user: 'root', password: '' },
        { host: 'localhost', user: 'root', password: 'root' },
        { host: 'localhost', user: 'root', password: 'admin' },
        { host: 'localhost', user: 'root', password: 'password' },
        { host: 'localhost', user: 'admin', password: '' },
        { host: 'localhost', user: 'admin', password: 'admin' },
        { host: '127.0.0.1', user: 'root', password: '' },
        { host: '127.0.0.1', user: 'root', password: 'root' },
        { host: '127.0.0.1', user: 'root', password: 'admin' },
    ];
    
    for (const option of options) {
        console.log(`\nIntentando conexión con: ${option.user}@${option.host}, password: ${option.password ? '****' : '[vacío]'}`);
        
        try {
            const connection = await mysql.createConnection({
                ...option,
                connectTimeout: 3000
            });
            
            console.log('✅ CONEXIÓN EXITOSA!');
            
            // Verificar si existe la base de datos zapatosmoreno
            const [databases] = await connection.query('SHOW DATABASES LIKE "zapatosmoreno"');
            
            if (databases.length > 0) {
                console.log('✅ Base de datos "zapatosmoreno" encontrada');
                
                // Seleccionar la base de datos
                await connection.query('USE zapatosmoreno');
                
                // Verificar tablas
                const [tables] = await connection.query('SHOW TABLES');
                console.log(`✅ Tablas encontradas: ${tables.map(t => Object.values(t)[0]).join(', ')}`);
                
                // Verificar usuarios
                try {
                    const [users] = await connection.query('SELECT id, nombre, email FROM usuarios');
                    console.log(`✅ Usuarios encontrados: ${users.length}`);
                    console.log('Usuarios:', users);
                } catch (err) {
                    console.log('❌ Error al consultar usuarios:', err.message);
                }
                
                // Verificar direcciones
                try {
                    const [addresses] = await connection.query('SELECT id, usuario_id, nombre, direccion FROM direcciones');
                    console.log(`✅ Direcciones encontradas: ${addresses.length}`);
                    console.log('Direcciones:', addresses);
                } catch (err) {
                    console.log('❌ Error al consultar direcciones:', err.message);
                }
            } else {
                console.log('⚠️ Base de datos "zapatosmoreno" no existe');
            }
            
            // Cerrar conexión
            await connection.end();
            
            return {
                success: true,
                config: option
            };
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
    
    return { success: false };
}

tryConnectionOptions()
    .then(result => {
        if (result.success) {
            console.log('\n=== SOLUCIÓN ENCONTRADA ===');
            console.log('Actualiza tu archivo .env con la siguiente configuración:');
            console.log(`DB_HOST=${result.config.host}`);
            console.log(`DB_USER=${result.config.user}`);
            console.log(`DB_PASSWORD=${result.config.password}`);
            console.log(`DB_NAME=zapatosmoreno`);
            
            console.log('\nY actualiza db/database.js para usar estos valores correctamente.');
        } else {
            console.log('\n=== NO SE ENCONTRÓ UNA SOLUCIÓN ===');
            console.log('Es posible que se requiera:');
            console.log('1. Verificar que MySQL esté instalado y en ejecución');
            console.log('2. Crear un usuario en MySQL con los permisos adecuados');
            console.log('3. Verificar configuración de acceso en MySQL');
        }
    })
    .catch(error => {
        console.error('Error en el script:', error);
    }); 