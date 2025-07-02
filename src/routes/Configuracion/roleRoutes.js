/**
 * Rutas para la gestión de roles y permisos
 * @module routes/Configuracion/roleRoutes
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middlewares/auth');
const RoleController = require('../../controllers/Configuracion/roleController');
const PermissionController = require('../../controllers/Configuracion/permissionController');

// Middleware para proteger todas las rutas
router.use(verifyToken);

// ============================================================
// Rutas para Roles
// ============================================================

/**
 * @route GET /api/roles
 * @desc Obtener todos los roles
 * @access Privado
 */
router.get('/', RoleController.getAll);

/**
 * @route GET /api/roles/:id
 * @desc Obtener un rol por ID
 * @access Privado
 */
router.get('/:id', RoleController.getById);

/**
 * @route POST /api/roles
 * @desc Crear un nuevo rol
 * @access Privado
 */
router.post('/', RoleController.create);

/**
 * @route PUT /api/roles/:id
 * @desc Actualizar un rol existente
 * @access Privado
 */
router.put('/:id', RoleController.update);

/**
 * @route DELETE /api/roles/:id
 * @desc Eliminar un rol
 * @access Privado
 */
router.delete('/:id', RoleController.delete);

/**
 * @route GET /api/roles/:id/permissions
 * @desc Obtener permisos asignados a un rol
 * @access Privado
 */
router.get('/:id/permissions', RoleController.getPermissions);

/**
 * @route POST /api/roles/:id/permissions
 * @desc Asignar permisos a un rol
 * @access Privado
 */
router.post('/:id/permissions', RoleController.assignPermissions);

// ============================================================
// Rutas para Permisos
// ============================================================

/**
 * @route GET /api/roles/permissions/all
 * @desc Obtener todos los permisos
 * @access Privado
 */
router.get('/permissions/all', PermissionController.getAll);

/**
 * @route GET /api/roles/permissions/:id
 * @desc Obtener un permiso por ID
 * @access Privado
 */
router.get('/permissions/:id', PermissionController.getById);

/**
 * @route POST /api/roles/permissions
 * @desc Crear un nuevo permiso
 * @access Privado
 */
router.post('/permissions', PermissionController.create);

/**
 * @route PUT /api/roles/permissions/:id
 * @desc Actualizar un permiso existente
 * @access Privado
 */
router.put('/permissions/:id', PermissionController.update);

/**
 * @route DELETE /api/roles/permissions/:id
 * @desc Eliminar un permiso
 * @access Privado
 */
router.delete('/permissions/:id', PermissionController.delete);

/**
 * @route GET /api/roles/permissions/module/:module
 * @desc Obtener permisos por módulo
 * @access Privado
 */
router.get('/permissions/module/:module', PermissionController.getByModule);

/**
 * @route GET /api/roles/permissions/modules
 * @desc Obtener todos los módulos disponibles
 * @access Privado
 */
router.get('/permissions/modules', PermissionController.getAllModules);

module.exports = router; 