const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth');

/**
 * @route POST /api/auth/login
 * @desc Iniciar sesión y obtener token
 * @access Público
 */
router.post('/login', AuthController.login);

/**
 * @route POST /api/auth/register
 * @desc Registrar un nuevo usuario
 * @access Público
 */
router.post('/register', AuthController.register);

/**
 * @route GET /api/auth/verify
 * @desc Verificar token de autenticación
 * @access Privado - requiere token
 */
router.get('/verify', verifyToken, AuthController.verifyToken);

module.exports = router; 