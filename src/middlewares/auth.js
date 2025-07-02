const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Middleware para verificar el token de autenticación
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función para continuar con el siguiente middleware
 */
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. Token no proporcionado'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta_jwt');
    req.user = decoded;
    
    next();
  } catch (error) {
    logger.error(`Error al verificar token: ${error.message}`);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado. Por favor, inicie sesión nuevamente'
      });
    }
    
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

/**
 * Middleware para verificar roles de usuario
 * @param {Array} roles - Lista de roles permitidos
 * @returns {Function} Middleware de verificación de roles
 */
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. Usuario no autenticado'
      });
    }
    
    const userRole = req.user.role;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Acceso prohibido. No tiene permisos suficientes'
      });
    }
    
    next();
  };
};

/**
 * Función para generar token JWT
 * @param {Object} user - Datos del usuario
 * @returns {string} Token JWT
 */


const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    full_name: user.full_name
  };
  
  return jwt.sign(
    payload, 
    process.env.JWT_SECRET || 'tu_clave_secreta_jwt', 
    { expiresIn: process.env.JWT_EXPIRATION || '8h' }
  );
};

module.exports = {
  verifyToken,
  checkRole,
  generateToken
}; 