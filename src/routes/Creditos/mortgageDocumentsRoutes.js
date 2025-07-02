/**
 * Rutas para la gestión de documentos de créditos hipotecarios
 * @module routes/Creditos/mortgageDocumentsRoutes
 */

const express = require('express');
const router = express.Router();
const MortgageDocumentsController = require('../../controllers/Creditos/MortgageDocumentsController');
const { verifyToken } = require('../../middlewares/auth');

// Middleware para autenticación en todas las rutas
router.use(verifyToken);

/**
 * @route GET /api/credits/mortgage-documents
 * @desc Obtener todos los documentos con filtros opcionales
 * @access Private
 * @queryParams {number} mortgage_id - ID del crédito hipotecario
 * @queryParams {string} credit_number - Número de crédito (búsqueda parcial)
 * @queryParams {number} document_type_id - ID del tipo de documento
 * @queryParams {number} category_id - ID de la categoría de documento
 * @queryParams {string} document_number - Número de documento (búsqueda parcial)
 * @queryParams {string} status - Estado del documento (pending, uploaded, validated, expired, rejected)
 * @queryParams {boolean} is_verified - Documento verificado
 * @queryParams {number} verified_by - ID del usuario que verificó
 * @queryParams {string} file_type - Tipo de archivo
 * @queryParams {string} document_date_from - Fecha de documento desde (YYYY-MM-DD)
 * @queryParams {string} document_date_to - Fecha de documento hasta (YYYY-MM-DD)
 * @queryParams {string} expiry_date_from - Fecha de vencimiento desde (YYYY-MM-DD)
 * @queryParams {string} expiry_date_to - Fecha de vencimiento hasta (YYYY-MM-DD)
 * @queryParams {boolean} expired_documents - Solo documentos vencidos
 * @queryParams {number} limit - Límite de resultados
 */
router.get('/', MortgageDocumentsController.getAll);

/**
 * @route GET /api/credits/mortgage-documents/expired
 * @desc Obtener documentos vencidos
 * @access Private
 */
router.get('/expired', MortgageDocumentsController.getExpiredDocuments);

/**
 * @route GET /api/credits/mortgage-documents/expiring-soon
 * @desc Obtener documentos próximos a vencer
 * @access Private
 * @queryParams {number} days_ahead - Días de anticipación (default: 30, máx: 365)
 */
router.get('/expiring-soon', MortgageDocumentsController.getDocumentsExpiringSoon);

/**
 * @route GET /api/credits/mortgage-documents/statistics
 * @desc Obtener estadísticas de documentos
 * @access Private
 */
router.get('/statistics', MortgageDocumentsController.getStatistics);

/**
 * @route GET /api/credits/mortgage-documents/form-options
 * @desc Obtener opciones para formularios
 * @access Private
 */
router.get('/form-options', MortgageDocumentsController.getFormOptions);

/**
 * @route GET /api/credits/mortgage-documents/mortgage/:mortgageId
 * @desc Obtener documentos por ID de crédito hipotecario
 * @access Private
 */
router.get('/mortgage/:mortgageId', MortgageDocumentsController.getByMortgageId);

/**
 * @route GET /api/credits/mortgage-documents/document-type/:documentTypeId
 * @desc Obtener documentos por tipo de documento
 * @access Private
 */
router.get('/document-type/:documentTypeId', MortgageDocumentsController.getByDocumentTypeId);

/**
 * @route GET /api/credits/mortgage-documents/:id
 * @desc Obtener un documento específico por ID
 * @access Private
 */
router.get('/:id', MortgageDocumentsController.getById);

/**
 * @route POST /api/credits/mortgage-documents
 * @desc Crear un nuevo documento de crédito
 * @access Private
 * @body {Object} documentData - Datos del documento
 * @body {number} documentData.mortgage_id - ID del crédito hipotecario (requerido)
 * @body {number} documentData.document_type_id - ID del tipo de documento (requerido)
 * @body {string} [documentData.document_number] - Número del documento (máx. 50 caracteres)
 * @body {string} [documentData.document_date] - Fecha del documento (YYYY-MM-DD)
 * @body {string} [documentData.expiry_date] - Fecha de vencimiento (YYYY-MM-DD)
 * @body {string} [documentData.file_path] - Ruta del archivo (máx. 500 caracteres)
 * @body {string} [documentData.file_name] - Nombre del archivo (máx. 255 caracteres)
 * @body {number} [documentData.file_size] - Tamaño del archivo en bytes (máx. 100MB)
 * @body {string} [documentData.file_type] - Tipo de archivo (pdf, jpg, jpeg, png, doc, docx, etc.)
 * @body {string} [documentData.description] - Descripción adicional (máx. 1000 caracteres)
 * @body {string} [documentData.status=pending] - Estado del documento
 * @body {string} [documentData.validation_notes] - Notas de validación (máx. 1000 caracteres)
 * @body {boolean} [documentData.is_verified=false] - Indica si está verificado
 */
router.post('/', MortgageDocumentsController.create);

/**
 * @route PUT /api/credits/mortgage-documents/:id
 * @desc Actualizar un documento existente
 * @access Private
 * @body {Object} documentData - Datos actualizados del documento
 * @body {number} [documentData.document_type_id] - ID del tipo de documento
 * @body {string} [documentData.document_number] - Número del documento (máx. 50 caracteres)
 * @body {string} [documentData.document_date] - Fecha del documento (YYYY-MM-DD)
 * @body {string} [documentData.expiry_date] - Fecha de vencimiento (YYYY-MM-DD)
 * @body {string} [documentData.file_path] - Ruta del archivo (máx. 500 caracteres)
 * @body {string} [documentData.file_name] - Nombre del archivo (máx. 255 caracteres)
 * @body {number} [documentData.file_size] - Tamaño del archivo en bytes (máx. 100MB)
 * @body {string} [documentData.file_type] - Tipo de archivo
 * @body {string} [documentData.description] - Descripción adicional (máx. 1000 caracteres)
 * @body {string} [documentData.status] - Estado del documento
 * @body {string} [documentData.validation_notes] - Notas de validación (máx. 1000 caracteres)
 * @body {boolean} [documentData.is_verified] - Indica si está verificado
 */
router.put('/:id', MortgageDocumentsController.update);

/**
 * @route PATCH /api/credits/mortgage-documents/:id/verify
 * @desc Verificar un documento
 * @access Private
 * @body {string} [validation_notes] - Notas de validación (máx. 1000 caracteres)
 */
router.patch('/:id/verify', MortgageDocumentsController.verifyDocument);

/**
 * @route PATCH /api/credits/mortgage-documents/:id/reject
 * @desc Rechazar un documento
 * @access Private
 * @body {string} validation_notes - Razón del rechazo (requerido, máx. 1000 caracteres)
 */
router.patch('/:id/reject', MortgageDocumentsController.rejectDocument);

/**
 * @route PATCH /api/credits/mortgage-documents/mark-expired
 * @desc Marcar documentos como vencidos (proceso automático)
 * @access Private
 */
router.patch('/mark-expired', MortgageDocumentsController.markExpiredDocuments);

/**
 * @route DELETE /api/credits/mortgage-documents/:id
 * @desc Eliminar un documento
 * @access Private
 */
router.delete('/:id', MortgageDocumentsController.delete);

module.exports = router; 