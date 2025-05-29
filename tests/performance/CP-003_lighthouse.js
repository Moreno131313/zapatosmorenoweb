const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Directorio para los resultados
const resultsDir = path.join(__dirname, '../../evidencias/CP-003');

// Asegurar que el directorio existe
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// URL a probar
const url = 'http://localhost:3000';

// Función para ejecutar Lighthouse
function runLighthouse() {
  console.log('Ejecutando prueba de rendimiento con Lighthouse...');
  
  try {
    // Ejecutar Lighthouse con opciones específicas
    const command = `lighthouse ${url} --output=html,json --output-path=${path.join(resultsDir, 'lighthouse')} --chrome-flags="--headless" --only-categories=performance --throttling.cpuSlowdownMultiplier=4`;
    
    execSync(command, { stdio: 'inherit' });
    
    console.log(`✅ Prueba completada. Resultados guardados en ${path.join(resultsDir, 'lighthouse.report.html')}`);
  } catch (error) {
    console.error('❌ Error al ejecutar Lighthouse:', error);
  }
}

// Ejecutar la prueba
runLighthouse();

// Reporte de resultados
console.log('\n📊 RESUMEN DE CP-003: Prueba de rendimiento');
console.log('===========================================');
console.log('Fecha de ejecución:', new Date().toLocaleString());
console.log('Herramienta: Lighthouse 9.6.0');
console.log('Entorno: Navegador Chrome en modo headless');
console.log('URL probada:', url);
console.log('Métricas evaluadas:');
console.log('  - Tiempo de carga');
console.log('  - First Meaningful Paint (FMP)');
console.log('  - Time to Interactive (TTI)');
console.log('  - Uso de CPU');
console.log('  - Errores en consola');
console.log('\nRevise los resultados detallados en los archivos de evidencia generados.'); 