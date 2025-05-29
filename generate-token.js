// generate-token.js - Herramienta para generar tokens JWT válidos para desarrollo
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Configuración
const usuarios = [
  {
    id: 19,
    nombre: 'Duvan Moreno',
    email: 'duvan@gmail.com',
    telefono: '3211234567',
    genero: 'Masculino',
    fecha_nacimiento: '1990-01-01'
  },
  {
    id: 1,
    nombre: 'Usuario de Prueba',
    email: 'usuario@ejemplo.com', 
    telefono: '3001234567'
  }
];

// Función para generar un token
function generarToken(usuario, secretKey = 'secreto', expiresIn = '7d') {
  const payload = {
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre
  };
  
  return jwt.sign(payload, secretKey, { expiresIn });
}

// Generar tokens para todos los usuarios de prueba
console.log('==== GENERADOR DE TOKENS JWT PARA DESARROLLO ====');
console.log('Secreto JWT actual en .env:', process.env.JWT_SECRET || 'no establecido');
console.log('\nGenerando tokens con diferentes secretos para compatibilidad:');

const secretos = [
  process.env.JWT_SECRET || 'secreto',
  'clave_secreta_temporal',
  'clave_secreta_para_jwt',
  'secret',
  'clavesupersecreta'
];

// Generar tokens para cada usuario con cada secreto
usuarios.forEach(usuario => {
  console.log(`\n== Usuario: ${usuario.nombre} (ID: ${usuario.id}) ==`);
  
  secretos.forEach(secreto => {
    const token = generarToken(usuario, secreto);
    console.log(`\nToken con secreto "${secreto}":`);
    console.log(token);
    
    // Mostrar contenido decodificado para verificación (sin verificar firma)
    try {
      const decodificado = jwt.decode(token);
      console.log('Contenido decodificado:', decodificado);
    } catch (error) {
      console.error('Error al decodificar token:', error.message);
    }
  });
  
  // Instrucciones para usar en localStorage
  console.log(`\nPara usar este token, ejecuta en la consola del navegador:`);
  console.log(`localStorage.setItem('token', 'PEGAR_TOKEN_AQUÍ');`);
  console.log(`localStorage.setItem('user', '${JSON.stringify(usuario)}');`);
});

console.log('\n==== FIN DEL GENERADOR DE TOKENS ====');
console.log('Copia uno de estos tokens y úsalo en tus pruebas de desarrollo.'); 