const authController = require('../controllers/authController');
const Usuario = require('../models/Usuario');

// Mock del módulo User
jest.mock('../models/Usuario');

// Mock para response y request
const mockRequest = () => {
  return {
    body: {}
  };
};

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    test('debería retornar error si faltan campos obligatorios', async () => {
      // Arrange
      const req = mockRequest();
      req.body = { 
        nombre: 'Test User', 
        // email faltante
        password: 'password123' 
      };
      const res = mockResponse();

      // Act
      await authController.register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'Todos los campos son obligatorios'
        })
      );
    });

    test('debería registrar un usuario exitosamente con datos válidos', async () => {
      // Arrange
      const req = mockRequest();
      req.body = {
        nombre: 'Nuevo Usuario',
        email: 'nuevo@example.com',
        password: 'password123',
        telefono: '123456789',
        fecha_nacimiento: '1990-01-01',
        genero: 'M'
      };
      const res = mockResponse();

      // Mock para findByEmail y create
      Usuario.findByEmail.mockResolvedValue(null); // Usuario no existe
      Usuario.create.mockResolvedValue(1); // ID del usuario creado
      
      // Mock para la verificación posterior
      Usuario.findByEmail.mockResolvedValueOnce(null) // Primera llamada: verificar que no existe
        .mockResolvedValueOnce({ // Segunda llamada: después de crear
          id: 1,
          nombre: 'Nuevo Usuario',
          email: 'nuevo@example.com'
        });

      // Act
      await authController.register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: 'Usuario registrado correctamente',
          userId: 1
        })
      );
    });
  });
}); 