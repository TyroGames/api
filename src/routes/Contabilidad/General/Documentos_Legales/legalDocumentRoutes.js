/**
 * Rutas para la gestión de documentos legales
 * @module routes/Contabilidad/General/Documentos_Legales/legalDocumentRoutes
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyToken } = require('../../../../middlewares/auth');
const LegalDocumentController = require('../../../../controllers/Contabilidad/General/Documentos_Legales/legalDocumentController');

// Configuración de multer para subida de archivos
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  // Extensiones permitidas para documentos
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.tif', '.tiff'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido. Extensiones permitidas: ${allowedExtensions.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Máximo 10MB
  }
});

// Middleware para proteger todas las rutas
router.use(verifyToken);

// ============================================================
// Rutas para Documentos Legales
// ============================================================

/**
 * @route GET /api/accounting/legal-documents
 * @desc Obtener todos los documentos legales
 * @access Privado
 */
router.get('/', LegalDocumentController.getAll);

/**
 * @route GET /api/accounting/legal-documents/:id
 * @desc Obtener un documento legal por ID
 * @access Privado
 */
router.get('/:id', LegalDocumentController.getById);

/**
 * @route GET /api/accounting/legal-documents/tipo/:tipo/numero/:numero
 * @desc Obtener un documento legal por tipo y número
 * @access Privado
 */
router.get('/tipo/:tipo/numero/:numero', LegalDocumentController.getByTipoNumero);

/**
 * @route GET /api/accounting/legal-documents/types
 * @desc Obtener todos los tipos de documentos legales
 * @access Privado
 */
router.get('/types/all', LegalDocumentController.getAllDocumentTypes);

/**
 * @route POST /api/accounting/legal-documents
 * @desc Crear un nuevo documento legal
 * @access Privado
 */
router.post('/', upload.single('archivo'), LegalDocumentController.create);

/**
 * @route PUT /api/accounting/legal-documents/:id
 * @desc Actualizar un documento legal existente
 * @access Privado
 */
router.put('/:id', upload.single('archivo'), LegalDocumentController.update);

/**
 * @route PATCH /api/accounting/legal-documents/:id/status
 * @desc Cambiar el estado de un documento legal
 * @access Privado
 */
router.patch('/:id/status', LegalDocumentController.changeStatus);

/**
 * @route DELETE /api/accounting/legal-documents/:id
 * @desc Eliminar un documento legal
 * @access Privado
 */
router.delete('/:id', LegalDocumentController.delete);

/**
 * @route GET /api/accounting/legal-documents/:id/download
 * @desc Descargar el archivo adjunto de un documento
 * @access Privado
 */
router.get('/:id/download', LegalDocumentController.downloadFile);

/**
 * @route GET /api/accounting/legal-documents/:id/history
 * @desc Obtener el historial de estados de un documento legal
 * @access Privado
 */
router.get('/:id/history', LegalDocumentController.getStatusHistory);

/**
 * @route GET /api/accounting/legal-documents/:id/vouchers
 * @desc Obtener comprobantes asociados a un documento
 * @access Privado
 */
router.get('/:id/vouchers', LegalDocumentController.getRelatedVouchers);

/**
 * @route POST /api/accounting/legal-documents/:documentId/vouchers/:voucherId
 * @desc Asociar un documento legal a un comprobante contable
 * @access Privado
 */
router.post('/:documentId/vouchers/:voucherId', LegalDocumentController.associateWithVoucher);

/**
 * @route DELETE /api/accounting/legal-documents/:documentId/vouchers/:voucherId
 * @desc Desasociar un documento legal de un comprobante contable
 * @access Privado
 */
router.delete('/:documentId/vouchers/:voucherId', LegalDocumentController.dissociateFromVoucher);

module.exports = router; 