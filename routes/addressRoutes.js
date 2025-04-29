// routes/addressRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db/database');
const verificarToken = require('../middleware/auth');

// Obtener todas las direcciones del usuario
router.get('/', async (req, res) => {
  try {
    const usuarioId = 1;
    
    const [rows] = await db.query(
      'SELECT * FROM direcciones WHERE usuario_id = ?',
      [usuarioId]
    );
    
    // Asegurarnos de que rows sea un array
    const direcciones = Array.isArray(rows) ? rows : [];
    
    console.log('Direcciones encontradas:', direcciones);
    
    res.json({ 
      direcciones: direcciones,
      total: direcciones.length
    });
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
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log('--------------------------------------------');
    console.log(`INICIO DE ACTUALIZACIÓN DE DIRECCIÓN ID: ${id}`);
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
    
    // ID del usuario (en una implementación real vendría del token)
    const usuarioId = 1;
    
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
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    console.log(`Eliminando dirección con ID: ${id}`);
    
    // ID del usuario (en una implementación real vendría del token)
    const usuarioId = 1;
    
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
router.patch('/:id/predeterminada', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    console.log(`Estableciendo dirección ${id} como predeterminada`);
    
    // ID del usuario (en una implementación real vendría del token)
    const usuarioId = 1;
    
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
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const usuarioId = 1; // Por ahora hardcodeado, debería venir del token
    
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
    
    res.json({
      mensaje: 'Dirección encontrada',
      direccion: rows[0]
    });
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
