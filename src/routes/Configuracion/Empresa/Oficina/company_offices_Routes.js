/**
 * Rutas para la gestión de oficinas de empresas
 * @module routes/Configuracion/Empresa/Oficina
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../../../middlewares/auth');
const OfficeController = require('../../../../controllers/Configuracion/Empresa/Oficina/company_offices_Controller');

// Middleware para proteger todas las rutas
router.use(verifyToken);

// ============================================================
// Rutas para Oficinas
// ============================================================

/**
 * @route GET /api/offices
 * @desc Obtener todas las oficinas
 * @access Privado
 */
router.get('/', OfficeController.getAll);

/**
 * @route GET /api/offices/:id
 * @desc Obtener una oficina por su ID
 * @access Privado
 */
router.get('/:id', OfficeController.getById);

/**
 * @route POST /api/offices
 * @desc Crear una nueva oficina
 * @access Privado
 */
router.post('/', OfficeController.create);

/**
 * @route PUT /api/offices/:id
 * @desc Actualizar una oficina existente
 * @access Privado
 */
router.put('/:id', OfficeController.update);

/**
 * @route DELETE /api/offices/:id
 * @desc Eliminar una oficina
 * @access Privado
 */
router.delete('/:id', OfficeController.delete);

module.exports = router; 