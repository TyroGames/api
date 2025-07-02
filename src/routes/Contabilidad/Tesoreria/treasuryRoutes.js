/**
 * Router principal para el módulo de Tesorería y Bancos
 * @module routes/Contabilidad/Tesoreria/treasuryRoutes
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../../middlewares/auth');

// Importar todas las rutas del módulo de tesorería
const bankAccountRoutes = require('./bankAccountRoutes');
const bankTransactionRoutes = require('./bankTransactionRoutes');
const bankReconciliationRoutes = require('./bankReconciliationRoutes');
const bankStatementRoutes = require('./bankStatementRoutes');           // ✅ Implementado
const cashAccountRoutes = require('./cashAccountRoutes');               // ✅ Implementado
const cashMovementRoutes = require('./cashMovementRoutes');             // ✅ Implementado
const cashReconciliationRoutes = require('./cashReconciliationRoutes'); // ✅ Implementado
const interBankTransferRoutes = require('./interBankTransferRoutes');   // ✅ Implementado

// Middleware para proteger todas las rutas del módulo
router.use(verifyToken);

// ============================================================
// Registro de rutas por submódulos
// ============================================================

/**
 * Rutas para gestión de cuentas bancarias
 * @route /api/tesoreria/bank-accounts/*
 */
router.use('/bank-accounts', bankAccountRoutes);

/**
 * Rutas para movimientos bancarios
 * @route /api/tesoreria/transactions/*
 */
router.use('/transactions', bankTransactionRoutes);

/**
 * Rutas para conciliación bancaria
 * @route /api/tesoreria/reconciliations/*
 */
router.use('/reconciliations', bankReconciliationRoutes);

/**
 * Rutas para extractos bancarios
 * @route /api/tesoreria/bank-statements/*
 */
router.use('/bank-statements', bankStatementRoutes);

/**
 * Rutas para gestión de cuentas de efectivo
 * @route /api/tesoreria/cash-accounts/*
 */
router.use('/cash-accounts', cashAccountRoutes);

/**
 * Rutas para movimientos de efectivo
 * @route /api/tesoreria/cash-movements/*
 */
router.use('/cash-movements', cashMovementRoutes);

/**
 * Rutas para arqueos de efectivo
 * @route /api/tesoreria/cash-reconciliations/*
 */
router.use('/cash-reconciliations', cashReconciliationRoutes);

/**
 * Rutas para transferencias interbancarias
 * @route /api/tesoreria/inter-bank-transfers/*
 */
router.use('/inter-bank-transfers', interBankTransferRoutes);

// ============================================================
// Ruta de información del módulo
// ============================================================

/**
 * @route GET /api/tesoreria/info
 * @desc Obtener información general del módulo de tesorería
 * @access Privado
 */
router.get('/info', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      module: 'Tesorería y Bancos',
      version: '1.0.0',
      description: 'Módulo para gestión de tesorería, cuentas bancarias, movimientos y conciliaciones',
      available_endpoints: [
        {
          path: '/bank-accounts',
          description: 'Gestión de cuentas bancarias',
          status: 'Implementado ✅'
        },
                 {
           path: '/transactions',
           description: 'Movimientos bancarios',
           status: 'Implementado ✅'
         },
        {
          path: '/reconciliations',
          description: 'Conciliación bancaria',
          status: 'Implementado ✅'
        },
        {
          path: '/bank-statements',
          description: 'Extractos bancarios e importación',
          status: 'Implementado ✅'
        },
        {
          path: '/cash-accounts',
          description: 'Cuentas de efectivo',
          status: 'Implementado ✅'
        },
        {
          path: '/cash-movements',
          description: 'Movimientos de efectivo',
          status: 'Implementado ✅'
        },
        {
          path: '/cash-reconciliations',
          description: 'Arqueos de efectivo',
          status: 'Implementado ✅'
        },
        {
          path: '/inter-bank-transfers',
          description: 'Transferencias interbancarias',
          status: 'Implementado ✅'
        }
      ],
      database_tables: [
        'bank_accounts',
        'bank_transactions',
        'bank_reconciliations',
        'bank_reconciliation_items',
        'bank_statement_imports',
        'bank_statement_movements',
        'bank_statement_processors',
        'bank_reconciliation_differences',
        'cash_accounts',
        'cash_movements',
        'cash_reconciliations',
        'bank_fees',
        'inter_bank_transfers',
        'treasury_positions',
        'customer_payments',
        'supplier_payments'
      ]
    },
    message: 'Información del módulo de tesorería obtenida correctamente'
  });
});

/**
 * @route GET /api/tesoreria/health
 * @desc Verificar el estado de salud del módulo de tesorería
 * @access Privado
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      module: 'Treasury',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      user: req.user?.username || 'unknown'
    },
    message: 'Módulo de tesorería funcionando correctamente'
  });
});

module.exports = router; 