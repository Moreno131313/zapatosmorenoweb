const request = require('supertest');
const express = require('express');
const router = require('../routes/productRoutes');
const { query } = require('../db/database');

// En lugar de cargar todo el servidor, solo probamos el router
const app = express();
app.use('/api/productos', router);

// Mock ya está configurado en setup.js

describe('Product Routes', () => {
  test('GET /api/productos devuelve lista de productos', async () => {
    const response = await request(app)
      .get('/api/productos')
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  test('GET /api/productos con filtro de género devuelve productos filtrados', async () => {
    const response = await request(app)
      .get('/api/productos?genero=mujer')
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
    if (response.body.length > 0) {
      response.body.forEach(producto => {
        expect(producto.genero).toBe('mujer');
      });
    }
  });

  test('GET /api/productos/:id devuelve un producto específico', async () => {
    const response = await request(app)
      .get('/api/productos/1')
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.id).toBe('1');
    expect(response.body).toHaveProperty('nombre');
    expect(response.body).toHaveProperty('precio');
  });

  test('GET /api/productos/:id devuelve 404 para ID inexistente', async () => {
    await request(app)
      .get('/api/productos/999')
      .expect('Content-Type', /json/)
      .expect(404);
  });

  test('GET /api/productos/:id/inventario devuelve el inventario de un producto', async () => {
    // Mock de la consulta a la base de datos
    query.mockResolvedValueOnce([
      { producto_id: 1, talla: '38', color: 'Negro', stock: 10 },
      { producto_id: 1, talla: '39', color: 'Negro', stock: 8 },
      { producto_id: 1, talla: '40', color: 'Marrón', stock: 5 }
    ]);

    const response = await request(app)
      .get('/api/productos/1/inventario')
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body).toHaveProperty('inventario');
    expect(response.body).toHaveProperty('inventario_detallado');
    expect(response.body.producto_id).toBe(1);
  });
}); 