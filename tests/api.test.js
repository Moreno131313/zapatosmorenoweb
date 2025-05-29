const request = require('supertest');
const express = require('express');

// Crear una mini aplicación Express para las pruebas
const app = express();

// Añadir la ruta de estado que estamos probando
app.get('/api/status', (req, res) => {
  res.json({
    status: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

describe('API Tests', () => {
  test('GET /api/status devuelve estado correcto', async () => {
    const response = await request(app)
      .get('/api/status')
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body).toHaveProperty('status', 'API funcionando correctamente');
    expect(response.body).toHaveProperty('timestamp');
  });
}); 