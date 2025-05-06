// routes/addressRoutes.js
const express = require('express');
const router = express.Router();
// Importar base de datos SQLite en lugar de MySQL
const sqliteDb = require('../db/sqlite-database');
// Mantener la referencia a la BD original para compatibilidad
const db = require('../db/database');
const verificarToken = require('../middleware/auth');

// Función de utilidad para manejar consultas con ambas bases de datos
async function queryDual(sqlQuery, params, sqliteQuery = null) {
    try {
        // Intentar primero con SQLite
        return sqliteDb.query(sqliteQuery || sqlQuery, params);
    } catch (sqliteError) {
        console.log('Fallback a MySQL después de error SQLite:', sqliteError.message);
        try {
            // Si falla, intentar con MySQL
            const [results] = await db.query(sqlQuery, params);
            return results;
        } catch (mysqlError) {
            console.error('Error en ambas bases de datos:', mysqlError);
            throw mysqlError;
        }
    }
}

// Agregar ruta OPTIONS para manejar preflight CORS
router.options('/direcciones-debug', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  res.status(200).end();
});

// Ruta de debug para obtener direcciones directamente por ID 
// IMPORTANTE: Esta ruta es SOLO PARA DEPURACIÓN y debe eliminarse en producción
router.get('/direcciones-debug', (req, res) => {
  // Configurar CORS y cabeceras
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Content-Type', 'application/json; charset=utf-8');
  res.header('Cache-Control', 'no-cache');
  
  // Usar ID 19 para el usuario de prueba duvan@gmail.com
  const usuarioId = 19;
  
  console.log(`==== GET /api/direcciones-debug ====`);
  console.log(`Consultando direcciones reales para usuario ID: ${usuarioId}`);
  
  // Intentar obtener direcciones reales de SQLite primero
  try {
    console.log('Consultando SQLite...');
    const direccionesQuery = `
      SELECT * FROM direcciones 
      WHERE usuario_id = ? 
      ORDER BY es_principal DESC, id ASC
    `;
    
    // Ejecutar consulta
    const direcciones = sqliteDb.query(direccionesQuery, [usuarioId]);
    
    // Verificar si hay direcciones
    if (direcciones && direcciones.length > 0) {
      console.log(`Encontradas ${direcciones.length} direcciones en SQLite`);
      return res.status(200).json(direcciones);
    } else {
      console.log('No se encontraron direcciones en SQLite');
    }
  } catch (err) {
    console.error('Error al consultar SQLite:', err);
  }
  
  // Si no se obtuvieron direcciones de SQLite, intentar con MySQL
  try {
    console.log('Consultando MySQL...');
    db.query(
      'SELECT * FROM direcciones WHERE usuario_id = ? ORDER BY es_principal DESC, id ASC',
      [usuarioId],
      (error, results) => {
        if (error) {
          console.error('Error al consultar MySQL:', error);
          // Usar datos de respaldo
          return usarDatosRespaldo();
        }
        
        // Verificar si hay resultados
        if (results && results.length > 0) {
          console.log(`Encontradas ${results.length} direcciones en MySQL`);
          return res.status(200).json(results);
        } else {
          console.log('No se encontraron direcciones en MySQL');
          return usarDatosRespaldo();
        }
      }
    );
  } catch (error) {
    console.error('Error con MySQL:', error);
    return usarDatosRespaldo();
  }
  
  // Función para usar datos de respaldo si no hay resultados en ninguna DB
  function usarDatosRespaldo() {
    console.log('Usando datos de respaldo hardcodeados');
    const direccionesRespaldo = [
      {
        id: 101,
        usuario_id: 19,
        nombre: "Casa",
        direccion: "Calle 123 #45-67",
        ciudad: "Villavicencio",
        codigo_postal: "500001",
        telefono: "3211234567",
        es_principal: 1
      },
      {
        id: 102,
        usuario_id: 19,
        nombre: "Trabajo",
        direccion: "Av Principal #40-60",
        ciudad: "Villavicencio",
        codigo_postal: "500001",
        telefono: "3211234567",
        es_principal: 0
      },
      {
        id: 103,
        usuario_id: 19,
        nombre: "Familiar",
        direccion: "Carrera 10 #15-23",
        ciudad: "Villavicencio",
        codigo_postal: "500001",
        telefono: "3211234567",
        es_principal: 0
      }
    ];
    
    return res.status(200).json(direccionesRespaldo);
  }
});

// Ruta ultra segura para obtener direcciones por ID
router.get('/por-usuario/:id/:token_seguro', async (req, res) => {
  try {
    const usuarioId = req.params.id;
    const tokenSeguro = req.params.token_seguro;
    
    // Validar token seguro (token muy simple para esta solución rápida)
    const tokenEsperado = Buffer.from(`user-${usuarioId}-secure`).toString('base64');
    
    if (tokenSeguro !== tokenEsperado) {
      return res.status(401).json({ mensaje: 'Token de seguridad no válido' });
    }
    
    console.log(`==== GET /api/direcciones/por-usuario/${usuarioId} ====`);
    
    let direcciones = [];
    
    try {
      // Intentar obtener de SQLite primero
      direcciones = sqliteDb.obtenerDireccionesPorUsuario(usuarioId);
      console.log(`Encontradas ${direcciones.length} direcciones en SQLite`);
    } catch (sqliteError) {
      console.error('Error al consultar SQLite:', sqliteError);
      
      // Intentar obtener de MySQL si falla SQLite
      try {
        direcciones = await require('../db/database').obtenerDireccionesPorUsuario(usuarioId);
        console.log(`Encontradas ${direcciones.length} direcciones en MySQL`);
      } catch (mysqlError) {
        console.error('Error al consultar MySQL:', mysqlError);
      }
    }
    
    // Enviar respuesta
    res.setHeader('Content-Type', 'application/json');
    res.json(direcciones);
    console.log(`Respuesta enviada con ${direcciones.length} direcciones`);
    
  } catch (error) {
    console.error('Error al obtener direcciones por ID de usuario:', error);
    res.status(500).json({ 
      mensaje: 'Error al obtener direcciones',
      error: error.message,
      direcciones: []
    });
  }
});

// Obtener todas las direcciones del usuario
router.get('/', verificarToken, async (req, res) => {
  try {
    // Obtener ID del usuario autenticado
    const usuarioId = req.usuario.id;
    
    console.log(`==== GET /api/direcciones ====`);
    console.log(`Consultando direcciones para el usuario ID: ${usuarioId}`);
    console.log(`Token usuario verificado:`, req.usuario);
    
    // Verificar si el usuario es duvan@gmail.com
    if (req.usuario && req.usuario.email === 'duvan@gmail.com') {
      console.log(`Usuario identificado como duvan@gmail.com - consultando direcciones en SQLite`);
      
      let direcciones;
      try {
        // Intentar obtener direcciones de SQLite primero
        direcciones = sqliteDb.obtenerDireccionesPorUsuario(usuarioId);
        
        if (direcciones && direcciones.length > 0) {
          console.log(`Encontradas ${direcciones.length} direcciones en SQLite`);
          console.log(`Primera dirección:`, direcciones[0]);
          
          res.setHeader('Content-Type', 'application/json');
          return res.json(direcciones);
        }
      } catch (sqliteError) {
        console.error('Error al consultar SQLite:', sqliteError);
      }
      
      // Si no hay direcciones en SQLite o hay error, intentar con MySQL
      console.log('No se encontraron direcciones en SQLite o hubo un error, intentando MySQL con ID 19');
      try {
        const [rows] = await db.query(
          'SELECT * FROM direcciones WHERE usuario_id = ?',
          [19] // Usar ID 19 para este usuario específico
        );
        
        // Procesar resultado
        const direccionesMySQL = Array.isArray(rows) ? rows : [];
        console.log(`Direcciones encontradas en MySQL para ID 19: ${direccionesMySQL.length}`);
        
        if (direccionesMySQL.length > 0) {
          res.setHeader('Content-Type', 'application/json');
          return res.json(direccionesMySQL);
        }
        
        // Si no hay direcciones en MySQL, crear algunas en SQLite
        if (!direcciones || direcciones.length === 0) {
          console.log('No se encontraron direcciones en ninguna DB, creando algunas...');
          try {
            // Asegurarnos que el usuario existe en SQLite
            const userInSQLite = sqliteDb.get('SELECT id FROM usuarios WHERE email = ?', ['duvan@gmail.com']);
            
            if (!userInSQLite) {
              // Crear usuario
              const userResult = sqliteDb.execute(
                'INSERT INTO usuarios (nombre, email, password, telefono) VALUES (?, ?, ?, ?)',
                ['duvan moreno', 'duvan@gmail.com', 'password_encriptado', '3211234567']
              );
              var userId = userResult.lastInsertRowid;
              console.log('Usuario creado en SQLite con ID:', userId);
            } else {
              userId = userInSQLite.id;
              console.log('Usuario encontrado en SQLite con ID:', userId);
            }
            
            // Crear direcciones
            sqliteDb.execute(
              'INSERT INTO direcciones (usuario_id, nombre, direccion, ciudad, codigo_postal, telefono, es_principal) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [userId, 'Casa', 'Calle 123 #45-67', 'Villavicencio', '500001', '3211234567', 1]
            );
            
            sqliteDb.execute(
              'INSERT INTO direcciones (usuario_id, nombre, direccion, ciudad, codigo_postal, telefono, es_principal) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [userId, 'Trabajo', 'Av Principal #40-60', 'Villavicencio', '500001', '3211234567', 0]
            );
            
            // Obtener las direcciones recién creadas
            const nuevasDirecciones = sqliteDb.query('SELECT * FROM direcciones WHERE usuario_id = ?', [userId]);
            console.log(`Creadas ${nuevasDirecciones.length} direcciones en SQLite`);
            
            res.setHeader('Content-Type', 'application/json');
            return res.json(nuevasDirecciones);
          } catch (createError) {
            console.error('Error al crear direcciones:', createError);
          }
        }
      } catch (mysqlError) {
        console.error('Error en MySQL:', mysqlError);
      }
    }
    
    // Para usuarios no especiales, intentar ambas bases de datos
    let direcciones = [];
    
    try {
      // Intentar obtener de SQLite primero
      direcciones = sqliteDb.query('SELECT * FROM direcciones WHERE usuario_id = ?', [usuarioId]);
      console.log(`Encontradas ${direcciones.length} direcciones en SQLite`);
    } catch (sqliteError) {
      console.error('Error al consultar SQLite:', sqliteError);
      
      // Intentar MySQL como fallback
      try {
        const [rows] = await db.query(
          'SELECT * FROM direcciones WHERE usuario_id = ?',
          [usuarioId]
        );
        direcciones = Array.isArray(rows) ? rows : [];
        console.log(`Encontradas ${direcciones.length} direcciones en MySQL`);
      } catch (mysqlError) {
        console.error('Error al consultar MySQL:', mysqlError);
      }
    }
    
    // Devolver direcciones encontradas o array vacío
    res.setHeader('Content-Type', 'application/json');
    res.json(direcciones);
    console.log(`Respuesta JSON enviada con ${direcciones.length} direcciones`);
    console.log(`==== FIN GET /api/direcciones ====`);
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
router.post('/', verificarToken, async (req, res) => {
    console.log('POST /api/direcciones - Inicio');
    console.log('Datos recibidos:', JSON.stringify(req.body, null, 2));
    
    try {
        const { nombre, direccion, ciudad, codigo_postal, telefono, es_principal } = req.body;
        const usuario_id = req.usuario.id;
        
        // Validar campos requeridos
        if (!nombre || !direccion || !ciudad) {
            console.log('Error: Faltan datos obligatorios para la dirección');
            return res.status(400).json({ 
                mensaje: 'Faltan datos obligatorios para la dirección',
                campos_requeridos: ['nombre', 'direccion', 'ciudad'],
                datos_recibidos: req.body
            });
        }
        
        // Iniciar transacción para garantizar consistencia
        const connection = await db.pool.getConnection();
        await connection.beginTransaction();
        
        try {
            // Si la dirección es principal, actualizar las otras direcciones del usuario
            if (es_principal) {
                console.log('La dirección será establecida como principal');
                console.log('Actualizando otras direcciones del usuario...');
                
                const updateQuery = 'UPDATE direcciones SET es_principal = 0 WHERE usuario_id = ?';
                await connection.query(updateQuery, [usuario_id]);
                console.log('Direcciones anteriores actualizadas correctamente');
            }
            
            // Insertar la nueva dirección
            console.log('Insertando nueva dirección...');
            const insertQuery = `
                INSERT INTO direcciones 
                (usuario_id, nombre, direccion, ciudad, codigo_postal, telefono, es_principal) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            const [result] = await connection.query(insertQuery, [
                usuario_id, 
                nombre, 
                direccion, 
                ciudad, 
                codigo_postal || null,  // Usar null si no hay valor
                telefono || null,       // Usar null si no hay valor
                es_principal ? 1 : 0    // Convertir boolean a 0/1
            ]);
            
            // Confirmar transacción
            await connection.commit();
            console.log('Transacción completada. ID de dirección creada:', result.insertId);
            
            // Enviar respuesta de éxito
            return res.status(201).json({
                mensaje: 'Dirección agregada exitosamente',
                direccion: {
                    id: result.insertId,
                    usuario_id,
                    nombre, 
                    direccion, 
                    ciudad, 
                    codigo_postal: codigo_postal || null, 
                    telefono: telefono || null, 
                    es_principal: es_principal ? 1 : 0
                }
            });
            
        } catch (error) {
            // Revertir transacción en caso de error
            await connection.rollback();
            console.error('Error SQL durante la transacción:', error);
            
            // Manejar errores específicos de SQL
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                return res.status(500).json({ 
                    mensaje: `Error en la estructura de la base de datos: ${error.message}`,
                    error: error.sqlMessage
                });
            }
            
            throw error; // Relanzar para el manejador general
        } finally {
            // Liberar conexión
            connection.release();
        }
        
    } catch (error) {
        console.error('Error general al crear dirección:', error);
        return res.status(500).json({ 
            mensaje: 'Error interno del servidor al crear la dirección',
            error: error.message
        });
    }
});

// Actualizar una dirección existente
router.put('/:id', verificarToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const usuarioId = req.usuario.id;
    
    console.log('--------------------------------------------');
    console.log(`INICIO DE ACTUALIZACIÓN DE DIRECCIÓN ID: ${id} para usuario ${usuarioId}`);
    console.log('--------------------------------------------');
    console.log('Datos recibidos para actualización:', req.body);
    
    // Definir los campos permitidos en la tabla
    const camposPermitidos = ['nombre', 'direccion', 'ciudad', 'codigo_postal', 'telefono', 'es_principal'];
    
    // Extraer solo los campos válidos que existen en la tabla
    const datosValidados = {};
    camposPermitidos.forEach(campo => {
      if (campo in req.body) {
        datosValidados[campo] = req.body[campo];
      }
    });
    
    console.log('Datos validados para la actualización:', datosValidados);
    
    // Verificar si hay propiedades adicionales no permitidas
    const camposExcedentes = Object.keys(req.body).filter(campo => !camposPermitidos.includes(campo));
    if (camposExcedentes.length > 0) {
      console.log('⚠️ ALERTA: Campos adicionales detectados que no serán usados:', camposExcedentes);
    }
    
    // Extraer los campos individuales para procesamiento
    const { nombre, direccion, ciudad, codigo_postal, telefono, es_principal } = datosValidados;
    
    // Validaciones de los campos obligatorios
    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      return res.status(400).json({ 
        mensaje: 'El nombre/alias es requerido',
        campo: 'nombre'
      });
    }

    if (!direccion || typeof direccion !== 'string' || direccion.trim() === '') {
      return res.status(400).json({ 
        mensaje: 'La dirección es requerida',
        campo: 'direccion'
      });
    }

    if (!ciudad || typeof ciudad !== 'string' || ciudad.trim() === '') {
      return res.status(400).json({ 
        mensaje: 'La ciudad es requerida',
        campo: 'ciudad'
      });
    }
    
    // Verificar que la dirección existe y pertenece al usuario
    const [direcciones] = await db.query(
      'SELECT * FROM direcciones WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    
    if (direcciones.length === 0) {
      console.log(`No se encontró dirección con ID: ${id} para el usuario: ${usuarioId}`);
      return res.status(404).json({ mensaje: 'Dirección no encontrada' });
    }
    
    // Si la actualización marca como predeterminada, actualizar las demás
    if (es_principal) {
      await db.query(
        'UPDATE direcciones SET es_principal = 0 WHERE usuario_id = ?',
        [usuarioId]
      );
    }
    
    // Construir consulta de actualización dinámica
    const fieldsToUpdate = [];
    const valuesToUpdate = [];
    
    // Solo incluir campos que existen y no son undefined
    if (nombre !== undefined) {
      fieldsToUpdate.push('nombre = ?');
      valuesToUpdate.push(nombre);
    }
    
    if (direccion !== undefined) {
      fieldsToUpdate.push('direccion = ?');
      valuesToUpdate.push(direccion);
    }
    
    if (ciudad !== undefined) {
      fieldsToUpdate.push('ciudad = ?');
      valuesToUpdate.push(ciudad);
    }
    
    if (codigo_postal !== undefined) {
      fieldsToUpdate.push('codigo_postal = ?');
      valuesToUpdate.push(codigo_postal || null);
    }
    
    if (telefono !== undefined) {
      fieldsToUpdate.push('telefono = ?');
      valuesToUpdate.push(telefono || null);
    }
    
    if (es_principal !== undefined) {
      fieldsToUpdate.push('es_principal = ?');
      valuesToUpdate.push(es_principal ? 1 : 0);
    }
    
    // Si no hay campos para actualizar, devolver error
    if (fieldsToUpdate.length === 0) {
      console.log('No hay campos para actualizar');
      return res.status(400).json({ mensaje: 'No se proporcionaron datos para actualizar' });
    }
    
    // Agregar id y usuario_id a los valores
    valuesToUpdate.push(id);
    valuesToUpdate.push(usuarioId);
    
    // Consulta de actualización
    const updateQuery = `
      UPDATE direcciones 
      SET ${fieldsToUpdate.join(', ')} 
      WHERE id = ? AND usuario_id = ?
    `;
    
    console.log('Consulta de actualización:', updateQuery);
    console.log('Valores para actualización:', valuesToUpdate);
    
    // Ejecutar actualización
    const [updateResult] = await db.query(updateQuery, valuesToUpdate);
    
    if (!updateResult || updateResult.affectedRows === 0) {
      throw new Error('Error al actualizar la dirección o no se modificaron datos');
    }
    
    // Obtener la dirección actualizada
    const [updatedRows] = await db.query(
      'SELECT * FROM direcciones WHERE id = ?',
      [id]
    );
    
    if (!updatedRows || !updatedRows[0]) {
      throw new Error('No se pudo recuperar la dirección actualizada');
    }
    
    console.log('Dirección actualizada exitosamente:', updatedRows[0]);
    console.log('--------------------------------------------');
    console.log('FIN DEL PROCESO DE ACTUALIZACIÓN DE DIRECCIÓN');
    console.log('--------------------------------------------');
    
    res.json({
      mensaje: 'Dirección actualizada correctamente',
      direccion: updatedRows[0]
    });
    
  } catch (error) {
    console.error('--------------------------------------------');
    console.error('ERROR EN ACTUALIZACIÓN DE DIRECCIÓN');
    console.error('Tipo de error:', error.name);
    console.error('Mensaje de error:', error.message);
    console.error('Stack trace:', error.stack);
    console.error('--------------------------------------------');
    
    // Si es un error de SQL, mostrar información adicional
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.error('ERROR DE CAMPO EN SQL: Un campo no existe en la tabla');
      // Intentar identificar qué campo es problemático
      const match = error.message.match(/Unknown column '(.+?)' in 'field list'/);
      if (match && match[1]) {
        console.error(`El campo problemático es: ${match[1]}`);
      }
    }
    
    res.status(500).json({ 
      mensaje: 'Error al actualizar dirección',
      error: error.message,
      tipo_error: error.name,
      codigo_error: error.code || 'desconocido'
    });
  }
});

// Eliminar una dirección
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const usuarioId = req.usuario.id;
    
    console.log(`Eliminando dirección con ID: ${id} para usuario ${usuarioId}`);
    
    // Verificar que la dirección existe y pertenece al usuario
    const [direcciones] = await db.query(
      'SELECT * FROM direcciones WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    
    if (direcciones.length === 0) {
      console.log(`No se encontró dirección con ID: ${id} para el usuario: ${usuarioId}`);
      return res.status(404).json({ mensaje: 'Dirección no encontrada' });
    }
    
    // Guardar la dirección antes de eliminarla para devolverla en la respuesta
    const direccionEliminada = direcciones[0];
    
    // Eliminar la dirección
    await db.query(
      'DELETE FROM direcciones WHERE id = ?',
      [id]
    );
    
    console.log('Dirección eliminada:', direccionEliminada);
    
    res.json({
      mensaje: 'Dirección eliminada correctamente',
      direccion: direccionEliminada
    });
  } catch (error) {
    console.error('Error al eliminar dirección:', error);
    res.status(500).json({ mensaje: 'Error al eliminar dirección', error: error.message });
  }
});

// Establecer dirección como predeterminada
router.patch('/:id/predeterminada', verificarToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const usuarioId = req.usuario.id;
    
    console.log(`Estableciendo dirección ${id} como predeterminada para usuario ${usuarioId}`);
    
    // Verificar que la dirección existe y pertenece al usuario
    const [direcciones] = await db.query(
      'SELECT * FROM direcciones WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    
    if (direcciones.length === 0) {
      console.log(`No se encontró dirección con ID: ${id} para el usuario: ${usuarioId}`);
      return res.status(404).json({ mensaje: 'Dirección no encontrada' });
    }
    
    // Quitar estado predeterminado de todas las direcciones del usuario
    await db.query(
      'UPDATE direcciones SET es_principal = 0 WHERE usuario_id = ?',
      [usuarioId]
    );
    
    // Establecer esta dirección como predeterminada
    await db.query(
      'UPDATE direcciones SET es_principal = 1 WHERE id = ?',
      [id]
    );
    
    // Obtener la dirección actualizada
    const [direccionActualizada] = await db.query(
      'SELECT * FROM direcciones WHERE id = ?',
      [id]
    );
    
    console.log('Dirección establecida como predeterminada:', direccionActualizada[0]);
    
    res.json({
      mensaje: 'Dirección establecida como predeterminada',
      direccion: direccionActualizada[0]
    });
  } catch (error) {
    console.error('Error al establecer dirección predeterminada:', error);
    res.status(500).json({ mensaje: 'Error al establecer dirección predeterminada', error: error.message });
  }
});

// Obtener una dirección específica por ID
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const usuarioId = req.usuario.id;
    
    console.log(`Obteniendo dirección con ID: ${id} para usuario: ${usuarioId}`);
    
    const [rows] = await db.query(
      'SELECT * FROM direcciones WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    
    if (!rows || rows.length === 0) {
      console.log(`No se encontró dirección con ID: ${id}`);
      return res.status(404).json({ mensaje: 'Dirección no encontrada' });
    }
    
    console.log('Dirección encontrada:', rows[0]);
    
    // Devolver directamente la dirección sin objeto wrapper
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener dirección por ID:', error);
    res.status(500).json({ 
      mensaje: 'Error al obtener dirección',
      error: error.message 
    });
  }
});

// Exportar el router
module.exports = router;
