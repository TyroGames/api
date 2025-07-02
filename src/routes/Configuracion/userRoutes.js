/**
 * Rutas para la gestión de usuarios
 * @module routes/Configuracion/userRoutes
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middlewares/auth');
const UserController = require('../../controllers/Configuracion/userController');

// Middleware para proteger todas las rutas
router.use(verifyToken);

// ============================================================
// Rutas para Usuarios
// ============================================================

/**
 * @route GET /api/users
 * @desc Obtener todos los usuarios
 * @access Privado
 */
router.get('/', UserController.getAll);

/**
 * @route GET /api/users/:id
 * @desc Obtener un usuario por ID
 * @access Privado
 */
router.get('/:id', UserController.getById);

/**
 * @route POST /api/users
 * @desc Crear un nuevo usuario
 * @access Privado
 */
router.post('/', UserController.create);

/**
 * @route PUT /api/users/:id
 * @desc Actualizar un usuario existente
 * @access Privado
 */
router.put('/:id', UserController.update);

/**
 * @route PATCH /api/users/:id/status
 * @desc Cambiar el estado de un usuario (activo/inactivo)
 * @access Privado
 */
router.patch('/:id/status', UserController.changeStatus);

/**
 * @route PUT /api/users/:id/password
 * @desc Cambiar la contraseña de un usuario
 * @access Privado
 */
router.put('/:id/password', UserController.changePassword);

/**
 * @route GET /api/users/:id/sessions
 * @desc Obtener sesiones activas de un usuario
 * @access Privado
 */
router.get('/:id/sessions', UserController.getSessions);

/**
 * @route DELETE /api/users/:id/sessions
 * @desc Invalidar todas las sesiones de un usuario
 * @access Privado
 */
router.delete('/:id/sessions', UserController.invalidateAllSessions);

/**
 * @route PUT /api/users/profile
 * @desc Actualizar perfil del usuario actual
 * @access Privado
 */
router.put('/profile', UserController.updateProfile);

/**
 * @route PUT /api/users/change-password
 * @desc Cambiar contraseña del usuario actual
 * @access Privado
 */
router.put('/change-password', UserController.updatePassword);

module.exports = router; 