// db-inventory-setup.js
// Script para poblar la tabla de inventario con datos de ejemplo

require('dotenv').config();
const mysql = require('mysql2/promise');
const { query } = require('./db/database');

// Configuración de conexión a MySQL
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '3312',
  database: 'zapatosmoreno',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Datos de productos de prueba con inventario
const productosConInventario = [
  {
    id: 1, // Zapatos Oxford Negros
    inventario: {
      "Negro": ["38", "39", "40", "41", "42", "43"],
      "Marrón": ["39", "40", "41", "42"]
    }
  },
  {
    id: 2, // Botas Casuales Marrones
    inventario: {
      "Marrón": ["38", "39", "40", "41", "42", "43"],
      "Negro": ["38", "40", "41", "43"]
    }
  },
  {
    id: 3, // Tenis Deportivos
    inventario: {
      "Azul": ["38", "39", "40", "42", "43", "44"],
      "Negro": ["38", "39", "40", "41", "42", "43", "44"],
      "Rojo": ["39", "40", "42", "43"]
    }
  },
  {
    id: 7, // Tacón Elegante Negro
    inventario: {
      "Negro": ["35", "36", "37", "38", "39"],
      "Rojo": ["35", "36", "37", "38"],
      "Nude": ["36", "37", "38"]
    }
  },
  {
    id: 8, // Sandalia Plataforma
    inventario: {
      "Dorado": ["35", "36", "37"],
      "Plateado": ["35", "36", "37", "38"],
      "Negro": ["36", "37", "38"]
    }
  },
  {
    id: 13, // Zapatilla Escolar Azul
    inventario: {
      "Azul": ["28", "29", "30", "31", "32", "33", "34"],
      "Negro": ["29", "30", "31", "32", "33"]
    }
  },
  {
    id: 14, // Sandalia Niña Verano
    inventario: {
      "Rosa": ["24", "25", "26", "27", "28", "29"],
      "Blanco": ["24", "25", "26", "27", "28"],
      "Azul claro": ["25", "26", "27", "28", "29"]
    }
  }
];

// Función para verificar y crear la tabla de inventario si no existe
async function verificarTablaInventario(connection) {
  console.log('Verificando tabla de inventario...');
  
  try {
    // Verificar si la tabla inventario existe
    const [tablas] = await connection.query(`
      SHOW TABLES LIKE 'inventario'
    `);
    
    if (tablas.length === 0) {
      console.log('Tabla inventario no encontrada, creándola...');
      
      // Crear la tabla inventario
      await connection.query(`
        CREATE TABLE IF NOT EXISTS inventario (
          id INT AUTO_INCREMENT PRIMARY KEY,
          producto_id INT NOT NULL,
          talla VARCHAR(10) NOT NULL,
          color VARCHAR(50) NOT NULL,
          stock INT NOT NULL DEFAULT 0,
          FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('Tabla inventario creada correctamente');
    } else {
      console.log('Tabla inventario encontrada');
    }
  } catch (error) {
    console.error('Error al verificar/crear tabla de inventario:', error);
    throw error;
  }
}

// Función para limpiar y poblar la tabla de inventario
async function poblarInventario(connection) {
  try {
    console.log('Limpiando tabla de inventario...');
    await connection.query('DELETE FROM inventario');
    
    console.log('Poblando tabla de inventario...');
    for (const producto of productosConInventario) {
      const productoId = producto.id;
      
      for (const color in producto.inventario) {
        const tallas = producto.inventario[color];
        
        for (const talla of tallas) {
          // Generar un stock aleatorio entre 5 y 20
          const stock = Math.floor(Math.random() * 16) + 5;
          
          await connection.query(`
            INSERT INTO inventario (producto_id, talla, color, stock)
            VALUES (?, ?, ?, ?)
          `, [productoId, talla, color, stock]);
        }
      }
    }
    
    console.log('Inventario poblado correctamente');
  } catch (error) {
    console.error('Error al poblar inventario:', error);
    throw error;
  }
}

// Función principal
async function main() {
  let connection;
  
  try {
    // Establecer conexión a la base de datos
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    // Verificar y crear tabla de inventario
    await verificarTablaInventario(connection);
    
    // Poblar inventario
    await poblarInventario(connection);
    
    console.log('Proceso completado con éxito');
  } catch (error) {
    console.error('Error en el script:', error);
  } finally {
    if (connection) {
      console.log('Cerrando conexión...');
      await connection.end();
    }
  }
}

// Ejecutar el script
main(); 