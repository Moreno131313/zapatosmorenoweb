const request = require('supertest');
const app = require('../server');
const { expect } = require('chai');

describe('Productos API', () => {
    describe('GET /api/productos', () => {
        it('debería obtener lista de productos', async () => {
            const res = await request(app)
                .get('/api/productos');

            expect(res.status).to.equal(200);
            expect(res.body).to.be.an('array');
            expect(res.body.length).to.be.greaterThan(0);
        });

        it('debería filtrar productos por género', async () => {
            const res = await request(app)
                .get('/api/productos?genero=hombre');

            expect(res.status).to.equal(200);
            expect(res.body).to.be.an('array');
            res.body.forEach(producto => {
                expect(producto.genero).to.equal('hombre');
            });
        });

        it('debería filtrar productos por tipo', async () => {
            const res = await request(app)
                .get('/api/productos?tipo=casual');

            expect(res.status).to.equal(200);
            expect(res.body).to.be.an('array');
            res.body.forEach(producto => {
                expect(producto.tipo).to.equal('casual');
            });
        });

        it('debería filtrar productos por múltiples criterios', async () => {
            const res = await request(app)
                .get('/api/productos?genero=hombre&tipo=casual&color=Negro');

            expect(res.status).to.equal(200);
            expect(res.body).to.be.an('array');
            res.body.forEach(producto => {
                expect(producto.genero).to.equal('hombre');
                expect(producto.tipo).to.equal('casual');
                expect(producto.colores).to.include('Negro');
            });
        });
    });

    describe('GET /api/productos/:id', () => {
        it('debería obtener un producto por ID', async () => {
            const res = await request(app)
                .get('/api/productos/1');

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('id');
            expect(res.body).to.have.property('nombre');
            expect(res.body).to.have.property('precio');
        });

        it('debería manejar ID de producto no existente', async () => {
            const res = await request(app)
                .get('/api/productos/999');

            expect(res.status).to.equal(404);
            expect(res.body).to.have.property('mensaje', 'Producto no encontrado');
        });
    });

    describe('GET /api/productos/:id/inventario', () => {
        it('debería obtener inventario de un producto', async () => {
            const res = await request(app)
                .get('/api/productos/1/inventario');

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('producto_id');
            expect(res.body).to.have.property('inventario');
            expect(res.body.inventario).to.be.an('object');
        });

        it('debería manejar producto sin inventario', async () => {
            const res = await request(app)
                .get('/api/productos/999/inventario');

            expect(res.status).to.equal(404);
            expect(res.body).to.have.property('mensaje', 'Inventario no encontrado');
        });
    });

    describe('Validación de Datos', () => {
        it('debería rechazar ID de producto inválido', async () => {
            const res = await request(app)
                .get('/api/productos/invalid');

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('mensaje', 'ID de producto inválido');
        });

        it('debería manejar parámetros de filtro inválidos', async () => {
            const res = await request(app)
                .get('/api/productos?precio=invalid');

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('mensaje', 'Parámetros de filtro inválidos');
        });
    });
}); 