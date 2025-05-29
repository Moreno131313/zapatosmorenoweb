/**
 * Script para ejecutar todas las pruebas de rendimiento CP-003
 * Autor: Duvan Moreno
 * Fecha: 15/05/2025
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Directorio para los resultados
const resultsDir = path.join(__dirname, '../../evidencias/CP-003');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Función para ejecutar un comando y mostrar su salida
function runCommand(command, description) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📋 ${description}`);
  console.log(`${'='.repeat(80)}`);
  
  try {
    execSync(command, { stdio: 'inherit', cwd: __dirname });
    console.log(`\n✅ ${description} completado exitosamente\n`);
    return true;
  } catch (error) {
    console.error(`\n❌ Error al ejecutar ${description}:`);
    console.error(error.message);
    return false;
  }
}

// Mostrar encabezado
console.log(`\n${'*'.repeat(100)}`);
console.log(`${'*'.repeat(41)} CP-003 ${'*'.repeat(42)}`);
console.log(`${'*'.repeat(20)} PRUEBA DE RENDIMIENTO - 500 USUARIOS CONCURRENTES ${'*'.repeat(21)}`);
console.log(`${'*'.repeat(100)}`);
console.log(`\nFecha: ${new Date().toLocaleString()}`);
console.log(`Ejecutado por: Duvan Moreno`);

// Verificar que el servidor esté activo
console.log('\n🔍 Verificando que el servidor esté activo...');
try {
  require('http').get('http://localhost:3000', (res) => {
    if (res.statusCode === 200) {
      console.log('✅ El servidor está activo en http://localhost:3000');
      runTests();
    } else {
      console.error(`❌ El servidor respondió con código ${res.statusCode}`);
      console.log('\n⚠️ Asegúrese de que el servidor esté activo con el comando: npm run dev');
    }
  }).on('error', (err) => {
    console.error('❌ No se pudo conectar al servidor:');
    console.error(err.message);
    console.log('\n⚠️ Asegúrese de que el servidor esté activo con el comando: npm run dev');
  });
} catch (error) {
  console.error('❌ Error al verificar el servidor:', error.message);
}

// Función principal para ejecutar todas las pruebas
function runTests() {
  console.log('\n🚀 Iniciando batería de pruebas de rendimiento CP-003...\n');
  
  // 1. Ejecutar monitoreo de CPU y memoria en segundo plano
  const cpuMonitorProcess = require('child_process').spawn(
    'node', 
    [path.join(__dirname, 'CP-003_monitor_cpu.js')], 
    { stdio: 'inherit', detached: true }
  );
  
  console.log(`✅ Monitoreo de CPU y memoria iniciado en segundo plano (PID: ${cpuMonitorProcess.pid})`);
  
  // Arreglo con las pruebas a ejecutar secuencialmente
  const tests = [
    {
      command: 'node CP-003_load_test.js',
      description: 'Prueba de carga con 500 usuarios concurrentes'
    },
    {
      command: 'node CP-003_lighthouse.js',
      description: 'Prueba de métricas de rendimiento con Lighthouse'
    }
  ];
  
  // Ejecutar las pruebas secuencialmente
  let allTestsPassed = true;
  
  // Encadenar promesas para ejecutar los comandos secuencialmente
  tests.reduce((promise, test) => {
    return promise.then(() => {
      const result = runCommand(test.command, test.description);
      if (!result) allTestsPassed = false;
      return Promise.resolve();
    });
  }, Promise.resolve())
  .then(() => {
    // Finalizar y mostrar resumen
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📋 RESUMEN DE EJECUCIÓN DE PRUEBAS CP-003`);
    console.log(`${'='.repeat(80)}`);
    
    if (allTestsPassed) {
      console.log('\n✅ Todas las pruebas se ejecutaron correctamente');
    } else {
      console.log('\n⚠️ Algunas pruebas fallaron. Revise los mensajes de error para más detalles.');
    }
    
    console.log(`\n📊 Los resultados se han guardado en: ${resultsDir}`);
    console.log(`📋 Reporte HTML detallado: ${path.join(__dirname, '../../evidencias/CP-003_resultados.html')}`);
    
    // Terminar el proceso de monitoreo de CPU que se ejecutó en segundo plano
    try {
      process.kill(-cpuMonitorProcess.pid);
      console.log('✅ Proceso de monitoreo de CPU finalizado correctamente');
    } catch (error) {
      console.error('⚠️ No se pudo finalizar el proceso de monitoreo de CPU:', error.message);
    }
  })
  .catch(error => {
    console.error('❌ Error durante la ejecución de las pruebas:', error);
  });
}

// Exportar la función para poder ejecutar este script desde otros lugares
module.exports = { runTests }; 