// setup.js - Configuración para entorno de pruebas
const db = require('../db/database');
const sqlite = require('../db/sqlite-database');

// Mock de la función inicializarBaseDatos
jest.mock('../db/database', () => {
  const originalModule = jest.requireActual('../db/database');
  
  return {
    ...originalModule,
    inicializarBaseDatos: jest.fn().mockResolvedValue(true),
    query: jest.fn().mockResolvedValue([]),
    pool: {
      query: jest.fn().mockResolvedValue([[]])
    }
  };
});

// Mock de SQLite
jest.mock('../db/sqlite-database', () => {
  return {
    db: {
      prepare: jest.fn().mockReturnValue({
        run: jest.fn(),
        get: jest.fn(),
        all: jest.fn().mockReturnValue([])
      })
    },
    inicializarBaseDatosSQLite: jest.fn().mockResolvedValue(true)
  };
});

// Evitar que los tests terminen por process.exit()
jest.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit llamado');
});

// Configuración global para todos los tests
global.beforeAll(() => {
  // Configuraciones adicionales antes de todos los tests
});

global.afterAll(() => {
  // Limpiar después de todos los tests
}); 