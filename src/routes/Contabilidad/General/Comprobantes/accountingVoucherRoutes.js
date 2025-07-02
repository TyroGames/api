/**
 * Rutas para la gestión de comprobantes contables
 * @module routes/Contabilidad/General/Comprobantes/accountingVoucherRoutes
 */

const express = require('express');
const router = express.Router();
const AccountingVoucherController = require('../../../../controllers/Contabilidad/General/Comprobantes/accountingVoucherController');
const { authenticateJWT, authorizeRole } = require('../../../../middleware/authMiddleware');

// Middleware para todas las rutas de comprobantes contables
router.use(authenticateJWT);

// Rutas para obtener comprobantes
router.get('/', authorizeRole(['admin', 'contabilidad']), AccountingVoucherController.getAll);
router.get('/:id', authorizeRole(['admin', 'contabilidad']), AccountingVoucherController.getById);
router.get('/by-number/:voucherNumber', authorizeRole(['admin', 'contabilidad']), AccountingVoucherController.getByNumber);

// Rutas para crear y modificar comprobantes
router.post('/', authorizeRole(['admin', 'contabilidad']), AccountingVoucherController.create);
router.put('/:id', authorizeRole(['admin', 'contabilidad']), AccountingVoucherController.update);

// Rutas para aprobar y anular comprobantes
router.post('/:id/approve', authorizeRole(['admin', 'contabilidad']), AccountingVoucherController.approve);
router.post('/:id/cancel', authorizeRole(['admin', 'contabilidad']), AccountingVoucherController.cancel);

module.exports = router; 