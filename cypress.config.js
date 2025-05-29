const { defineConfig } = require("cypress");
const fs = require('fs');
const path = require('path');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // Implementar event listeners
      on('task', {
        // Tarea para registrar evidencias en un archivo
        logEvidencia({ descripcion, fecha, url }) {
          const evidenciaPath = path.join(__dirname, 'evidencias', 'evidencias.json');
          
          let evidencias = [];
          try {
            if (fs.existsSync(evidenciaPath)) {
              const contenido = fs.readFileSync(evidenciaPath, 'utf8');
              evidencias = JSON.parse(contenido);
            }
          } catch (error) {
            console.error('Error al leer archivo de evidencias:', error);
          }
          
          evidencias.push({ descripcion, fecha, url });
          
          fs.writeFileSync(evidenciaPath, JSON.stringify(evidencias, null, 2), 'utf8');
          
          return null;
        },
        
        // Tarea para guardar los resultados de la prueba
        guardarResultados(resultados) {
          const resultadosPath = path.join(__dirname, 'evidencias', 'resultados-test.json');
          fs.writeFileSync(resultadosPath, JSON.stringify(resultados, null, 2), 'utf8');
          return null;
        }
      });
    },
    // Configuración específica para este proyecto
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    // Añadir etiquetas de metadatos personalizadas para el informe
    env: {
      project: 'E-Commerce Zapatos Moreno',
      version: 'Web 2.5.3',
      environment: 'test-server.zapatos-moreno.com'
    }
  },
});
