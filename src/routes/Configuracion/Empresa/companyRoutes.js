/**
 * Rutas para la gestión de empresas
 * @module routes/Configuracion/Empresa/companyRoutes
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../../middlewares/auth');
const { uploadCompanyLogo, handleMulterError } = require('../../../middlewares/fileUpload');
const CompanyController = require('../../../controllers/Configuracion/Empresa/companyController');

// Middleware para proteger todas las rutas
router.use(verifyToken);

// ============================================================
// Rutas para Empresas
// ============================================================

/**
 * @route GET /api/companies
 * @desc Obtener todas las empresas
 * @access Privado
 */
router.get('/', CompanyController.getAll);

/**
 * @route GET /api/companies/:id
 * @desc Obtener una empresa por ID
 * @access Privado
 */
router.get('/:id', CompanyController.getById);

/**
 * @route POST /api/companies
 * @desc Crear una nueva empresa (con posibilidad de logo)
 * @access Privado
 */
router.post('/', uploadCompanyLogo.single('logo'), handleMulterError, CompanyController.create);

/**
 * @route PUT /api/companies/:id
 * @desc Actualizar una empresa existente (con posibilidad de logo)
 * @access Privado
 */
router.put('/:id', uploadCompanyLogo.single('logo'), handleMulterError, CompanyController.update);

/**
 * @route POST /api/companies/:id/logo
 * @desc Subir/actualizar solo el logo de una empresa
 * @access Privado
 */
router.post('/:id/logo', uploadCompanyLogo.single('logo'), handleMulterError, CompanyController.uploadLogo);

/**
 * @route DELETE /api/companies/:id/logo
 * @desc Eliminar el logo de una empresa
 * @access Privado
 */
router.delete('/:id/logo', CompanyController.deleteLogo);

/**
 * @route GET /api/companies/:id/logo
 * @desc Obtener el logo de una empresa
 * @access Privado
 */
router.get('/:id/logo', CompanyController.getLogo);

// ============================================================
// Rutas para Generación de PDFs
// ============================================================

/**
 * @route GET /api/companies/pdf/list
 * @desc Generar PDF con listado de todas las empresas
 * @access Privado
 */
router.get('/pdf/list', CompanyController.generateListPDF);

/**
 * @route GET /api/companies/:id/pdf
 * @desc Generar y descargar PDF de una empresa específica
 * @access Privado
 */
router.get('/:id/pdf', CompanyController.generatePDF);

/**
 * @route GET /api/companies/:id/pdf/preview
 * @desc Generar y mostrar preview del PDF de una empresa
 * @access Privado
 */
router.get('/:id/pdf/preview', CompanyController.previewPDF);

/**
 * @route DELETE /api/companies/:id
 * @desc Eliminar una empresa
 * @access Privado
 */
router.delete('/:id', CompanyController.delete);

module.exports = router; 