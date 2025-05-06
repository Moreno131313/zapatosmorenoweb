const request = require('supertest');
const app = require('../server');
const { expect } = require('chai');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('Auth API', () => {
    describe('POST /api/auth/registro', () => {
        it('debería registrar un nuevo usuario', async () => {
            const userData = {
                nombre: 'Usuario Test',
                email: 'test@example.com',
                password: 'password123',
                telefono: '1234567890',
                fecha_nacimiento: '1990-01-01'
            };

            const res = await request(app)
                .post('/api/auth/registro')
                .send(userData);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property('token');
        });

        it('debería rechazar registro con email duplicado', async () => {
            const userData = {
                nombre: 'Usuario Test 2',
                email: 'test@example.com',
                password: 'password123'
            };

            const res = await request(app)
                .post('/api/auth/registro')
                .send(userData);

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('success', false);
        });
    });

    describe('POST /api/auth/login', () => {
        it('debería hacer login con credenciales correctas', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'password123'
            };

            const res = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property('token');
        });

        it('debería rechazar login con contraseña incorrecta', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };

            const res = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(res.status).to.equal(401);
            expect(res.body).to.have.property('success', false);
        });
    });

    describe('Middleware de Autenticación', () => {
        let token;

        before(async () => {
            // Generar un token válido para pruebas
            const loginData = {
                email: 'test@example.com',
                password: 'password123'
            };

            const res = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            token = res.body.token;
        });

        it('debería permitir acceso a ruta protegida con token válido', async () => {
            const res = await request(app)
                .get('/api/perfil')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).to.equal(200);
        });

        it('debería rechazar acceso sin token', async () => {
            const res = await request(app)
                .get('/api/perfil');

            expect(res.status).to.equal(401);
        });

        it('debería rechazar token inválido', async () => {
            const res = await request(app)
                .get('/api/perfil')
                .set('Authorization', 'Bearer invalid_token');

            expect(res.status).to.equal(401);
        });
    });
}); 