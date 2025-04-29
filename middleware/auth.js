// middleware/auth.js
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const verificarToken = async (req, res, next) => {
    try {
        console.log('Verificando token en middleware...');
        const authHeader = req.headers.authorization;
        console.log('Authorization header:', authHeader);
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('Token no proporcionado o formato inválido');
            return res.status(401).json({ mensaje: 'Token no proporcionado o formato inválido' });
        }
        
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            console.log('Token vacío después de extracción');
            return res.status(401).json({ mensaje: 'Token no proporcionado' });
        }

        try {
            const jwtSecret = process.env.JWT_SECRET || 'clave_secreta_para_jwt';
            console.log('Verificando token con secret (primeros caracteres):', jwtSecret.substring(0, 3) + '...');
            
            const decoded = jwt.verify(token, jwtSecret);
            console.log('Token verificado correctamente. Payload:', decoded);
            
            // Buscar usuario por ID
            const usuario = await Usuario.findById(decoded.id);
            
            if (!usuario) {
                console.log('Usuario no encontrado con ID:', decoded.id);
                return res.status(401).json({ mensaje: 'Usuario no encontrado' });
            }
            
            console.log('Usuario encontrado:', usuario.id, usuario.email);
            req.usuario = usuario;
            next();
        } catch (jwtError) {
            console.error('Error al verificar JWT:', jwtError);
            return res.status(401).json({ mensaje: 'Token inválido', error: jwtError.message });
        }
    } catch (error) {
        console.error('Error general en verificación de token:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

// Exportar el middleware como función predeterminada para mantener compatibilidad
module.exports = verificarToken;

// También exportar verificarToken como propiedad del objeto para los módulos que lo utilizan con destructuring
module.exports.verificarToken = verificarToken;