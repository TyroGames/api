/**
 * Rutas para la gestión de módulos del sistema
 * @module routes/Configuracion/moduleRoutes
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middlewares/auth');
const ModuleController = require('../../controllers/Configuracion/moduleController');

// Middleware para proteger todas las rutas
router.use(verifyToken);

// ============================================================
// Rutas para Módulos del Sistema
// ============================================================

/**
 * @route GET /api/modules
 * @desc Obtener todos los módulos
 * @access Privado
 */
router.get('/', ModuleController.getAll);

/**
 * @route GET /api/modules/:id
 * @desc Obtener un módulo por ID
 * @access Privado
 */
router.get('/:id', ModuleController.getById);

/**
 * @route GET /api/modules/name/:name
 * @desc Obtener un módulo por su nombre
 * @access Privado
 */
router.get('/name/:name', ModuleController.getByName);

/**
 * @route GET /api/modules/structure/tree
 * @desc Obtener la estructura jerárquica de módulos
 * @access Privado
 */
router.get('/structure/tree', ModuleController.getModuleTree);

/**
 * @route POST /api/modules
 * @desc Crear un nuevo módulo
 * @access Privado
 */
router.post('/', ModuleController.create);

/**
 * @route PUT /api/modules/:id
 * @desc Actualizar un módulo existente
 * @access Privado
 */
router.put('/:id', ModuleController.update);

/**
 * @route PATCH /api/modules/:id/status
 * @desc Cambiar el estado activo/inactivo de un módulo
 * @access Privado
 */
router.patch('/:id/status', ModuleController.changeStatus);

/**
 * @route PATCH /api/modules/:id/order
 * @desc Reordenar un módulo
 * @access Privado
 */
router.patch('/:id/order', ModuleController.reorder);

/**
 * @route DELETE /api/modules/:id
 * @desc Eliminar un módulo
 * @access Privado
 */
router.delete('/:id', ModuleController.delete);

module.exports = router; 