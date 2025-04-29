// Script de diagnóstico para la tabla direcciones
// Ejecutar con: node diagnostico.js

const mysql = require('mysql2/promise');
require('dotenv').config();

async function diagnosticarTablaDirecciones() {
  // Crear la conexión a la base de datos
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'zapatosmoreno',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('=== DIAGNÓSTICO DE TABLA DIRECCIONES ===');
    console.log('Conectando a la base de datos...');
    
    // Verificar conexión
    const connection = await pool.getConnection();
    console.log('✅ Conexión exitosa a MySQL');
    
    // Verificar base de datos
    const [databases] = await connection.query('SHOW DATABASES');
    const dbList = databases.map(db => db.Database || db.DATABASE || Object.values(db)[0]);
    console.log('Bases de datos disponibles:', dbList.join(', '));
    
    const dbName = process.env.DB_NAME || 'zapatosmoreno';
    if (!dbList.includes(dbName)) {
      console.error(`❌ ERROR: La base de datos '${dbName}' no existe!`);
      return;
    }
    console.log(`✅ Base de datos '${dbName}' existe`);
    
    // Verificar tabla
    const [tables] = await connection.query(`SHOW TABLES FROM ${dbName}`);
    const tableList = tables.map(table => Object.values(table)[0]);
    console.log('Tablas disponibles:', tableList.join(', '));
    
    if (!tableList.includes('direcciones')) {
      console.error('❌ ERROR: La tabla "direcciones" no existe!');
      return;
    }
    console.log('✅ Tabla "direcciones" existe');
    
    // Verificar estructura de la tabla
    const [columns] = await connection.query(`DESCRIBE direcciones`);
    console.log('\n=== ESTRUCTURA DE LA TABLA DIRECCIONES ===');
    
    const columnInfo = columns.map(col => ({
      Field: col.Field,
      Type: col.Type,
      Null: col.Null,
      Key: col.Key,
      Default: col.Default,
      Extra: col.Extra
    }));
    
    console.table(columnInfo);
    
    // Verificar si hay un campo estado (que es el que causa problemas)
    const hasEstadoField = columns.some(col => col.Field === 'estado');
    if (hasEstadoField) {
      console.log('⚠️ ADVERTENCIA: Se encontró un campo "estado" en la tabla. Esto podría causar conflictos con el código actual.');
    } else {
      console.log('✅ No se encontró campo "estado" en la tabla (correcto)');
    }
    
    // Campos esperados
    const expectedFields = [
      'id', 'usuario_id', 'nombre', 'direccion', 'ciudad', 
      'codigo_postal', 'telefono', 'es_principal',
      'created_at', 'updated_at'
    ];
    
    const missingFields = expectedFields.filter(field => 
      !columns.some(col => col.Field === field)
    );
    
    if (missingFields.length > 0) {
      console.log(`⚠️ ADVERTENCIA: Faltan los siguientes campos esperados: ${missingFields.join(', ')}`);
    } else {
      console.log('✅ Todos los campos esperados están presentes');
    }
    
    const extraFields = columns
      .map(col => col.Field)
      .filter(field => !expectedFields.includes(field));
    
    if (extraFields.length > 0) {
      console.log(`⚠️ ADVERTENCIA: Se encontraron campos adicionales no esperados: ${extraFields.join(', ')}`);
    } else {
      console.log('✅ No hay campos adicionales inesperados');
    }
    
    // Verificar contenido de la tabla
    const [rows] = await connection.query('SELECT * FROM direcciones LIMIT 10');
    console.log(`\n=== CONTENIDO DE LA TABLA (${rows.length} filas encontradas) ===`);
    
    if (rows.length > 0) {
      console.log('Muestra de direcciones:');
      rows.forEach((row, idx) => {
        console.log(`\nDirección #${idx + 1} (ID: ${row.id}):`);
        Object.entries(row).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      });
    } else {
      console.log('La tabla está vacía.');
    }
    
    // Verificar si hay consistencia en los datos
    if (rows.length > 0) {
      const hasNullValues = rows.some(row => 
        !row.nombre || !row.direccion || !row.ciudad
      );
      
      if (hasNullValues) {
        console.log('⚠️ ADVERTENCIA: Se detectaron valores NULL en campos obligatorios (nombre, direccion, ciudad)');
      } else {
        console.log('✅ No se detectaron valores NULL en campos obligatorios');
      }
    }
    
    // Liberar conexión
    connection.release();
    console.log('\n=== DIAGNÓSTICO COMPLETADO ===');
    
  } catch (error) {
    console.error('\n❌ ERROR DURANTE EL DIAGNÓSTICO:', error.message);
    console.error('Detalles del error:', error);
  } finally {
    // Cerrar pool
    pool.end();
  }
}

// Ejecutar diagnóstico
diagnosticarTablaDirecciones(); 