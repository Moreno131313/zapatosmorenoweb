const request = require('supertest');
const app = require('../server');
const { expect } = require('chai');

describe('Carrito API', () => {
    let token;
    let productoId = 1;

    before(async () => {
        // Login para obtener token
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });

        token = loginRes.body.token;
    });

    describe('GET /api/carrito', () => {
        it('debería obtener carrito vacío para usuario nuevo', async () => {
            const res = await request(app)
                .get('/api/carrito')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body.data).to.be.an('array');
            expect(res.body.data.length).to.equal(0);
        });
    });

    describe('POST /api/carrito/agregar', () => {
        it('debería agregar producto al carrito', async () => {
            const productoData = {
                producto_id: productoId,
                cantidad: 1,
                talla: '40',
                color: 'Negro'
            };

            const res = await request(app)
                .post('/api/carrito/agregar')
                .set('Authorization', `Bearer ${token}`)
                .send(productoData);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body.data).to.have.property('producto_id', productoId);
        });

        it('debería validar stock al agregar producto', async () => {
            const productoData = {
                producto_id: productoId,
                cantidad: 999999,
                talla: '40',
                color: 'Negro'
            };

            const res = await request(app)
                .post('/api/carrito/agregar')
                .set('Authorization', `Bearer ${token}`)
                .send(productoData);

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('success', false);
            expect(res.body).to.have.property('mensaje', 'Stock insuficiente');
        });

        it('debería validar datos requeridos', async () => {
            const productoData = {
                producto_id: productoId,
                // Falta talla y color
                cantidad: 1
            };

            const res = await request(app)
                .post('/api/carrito/agregar')
                .set('Authorization', `Bearer ${token}`)
                .send(productoData);

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('success', false);
            expect(res.body).to.have.property('errors').that.is.an('array');
        });
    });

    describe('PUT /api/carrito/actualizar/:id', () => {
        it('debería actualizar cantidad de producto', async () => {
            const res = await request(app)
                .put(`/api/carrito/actualizar/${productoId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ cantidad: 2 });

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body.data).to.have.property('cantidad', 2);
        });

        it('debería validar cantidad mínima', async () => {
            const res = await request(app)
                .put(`/api/carrito/actualizar/${productoId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ cantidad: 0 });

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('success', false);
            expect(res.body).to.have.property('errors').that.is.an('array');
        });
    });

    describe('POST /api/carrito/sincronizar', () => {
        it('debería sincronizar carrito desde localStorage', async () => {
            const carritoData = {
                items: [{
                    producto_id: productoId,
                    cantidad: 1,
                    talla: '40',
                    color: 'Negro'
                }]
            };

            const res = await request(app)
                .post('/api/carrito/sincronizar')
                .set('Authorization', `Bearer ${token}`)
                .send(carritoData);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body.data).to.be.an('array');
            expect(res.body.data.length).to.equal(1);
        });

        it('debería manejar carrito vacío', async () => {
            const res = await request(app)
                .post('/api/carrito/sincronizar')
                .set('Authorization', `Bearer ${token}`)
                .send({ items: [] });

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body.data).to.be.an('array');
            expect(res.body.data.length).to.equal(0);
        });
    });

    describe('Seguridad', () => {
        it('debería requerir autenticación para agregar productos', async () => {
            const res = await request(app)
                .post('/api/carrito/agregar')
                .send({
                    producto_id: productoId,
                    cantidad: 1,
                    talla: '40',
                    color: 'Negro'
                });

            expect(res.status).to.equal(401);
        });

        it('debería validar token inválido', async () => {
            const res = await request(app)
                .post('/api/carrito/agregar')
                .set('Authorization', 'Bearer invalid_token')
                .send({
                    producto_id: productoId,
                    cantidad: 1,
                    talla: '40',
                    color: 'Negro'
                });

            expect(res.status).to.equal(401);
        });
    });
}); 