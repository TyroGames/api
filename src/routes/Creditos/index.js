/**
 * Índice de rutas para el módulo de créditos hipotecarios
 * @module routes/Creditos/index
 */

const express = require('express');
const router = express.Router();

// Importar rutas específicas de cada módulo
const creditTypesRoutes = require('./creditTypesRoutes');
const quotaConfigurationsRoutes = require('./quotaConfigurationsRoutes');
const notariesRoutes = require('./notariesRoutes');
const propertiesRoutes = require('./propertiesRoutes');
const propertyOwnersRoutes = require('./propertyOwnersRoutes');
const documentCategoriesRoutes = require('./documentCategoriesRoutes');
const documentTypesRoutes = require('./documentTypesRoutes');
const mortgageDocumentsRoutes = require('./mortgageDocumentsRoutes');
const mortgagesRoutes = require('./mortgagesRoutes');
const mortgageDebtorsRoutes = require('./mortgageDebtorsRoutes');
const mortgageCreditorsRoutes = require('./mortgageCreditorsRoutes');

// ============================================================
// MÓDULOS BASE Y CONFIGURACIÓN
// ============================================================

/**
 * @route /api/credits/types/*
 * @desc Rutas para gestión de tipos de créditos hipotecarios
 */
router.use('/types', creditTypesRoutes);

/**
 * @route /api/credits/quota-configurations/*
 * @desc Rutas para gestión de configuraciones de cuotas
 */
router.use('/quota-configurations', quotaConfigurationsRoutes);

/**
 * @route /api/credits/notaries/*
 * @desc Rutas para gestión de notarías
 */
router.use('/notaries', notariesRoutes);

// ============================================================
// FASE 2 - PROPIEDADES
// ============================================================

/**
 * @route /api/credits/properties/*
 * @desc Rutas para gestión de propiedades hipotecarias
 */
router.use('/properties', propertiesRoutes);

/**
 * @route /api/credits/property-owners/*
 * @desc Rutas para gestión de propietarios de propiedades
 */
router.use('/property-owners', propertyOwnersRoutes);

// ============================================================
// FASE 3 - DOCUMENTACIÓN
// ============================================================

/**
 * @route /api/credits/document-categories/*
 * @desc Rutas para gestión de categorías de documentos
 */
router.use('/document-categories', documentCategoriesRoutes);

/**
 * @route /api/credits/document-types/*
 * @desc Rutas para gestión de tipos de documentos
 */
router.use('/document-types', documentTypesRoutes);

/**
 * @route /api/credits/mortgage-documents/*
 * @desc Rutas para gestión de documentos de créditos hipotecarios
 */
router.use('/mortgage-documents', mortgageDocumentsRoutes);

// ============================================================
// FASE 4 - CRÉDITOS PRINCIPALES
// ============================================================

/**
 * @route /api/credits/mortgages/*
 * @desc Rutas para gestión de créditos hipotecarios principales
 */
router.use('/mortgages', mortgagesRoutes);

/**
 * @route /api/credits/debtors/*
 * @desc Rutas para gestión de deudores de créditos hipotecarios
 */
router.use('/debtors', mortgageDebtorsRoutes);

/**
 * @route /api/credits/creditors/*
 * @desc Rutas para gestión de acreedores de créditos hipotecarios
 */
router.use('/creditors', mortgageCreditorsRoutes);


// TODO: FASE 5 - Liquidación
// router.use('/interest-liquidations', interestLiquidationsRoutes);
// router.use('/scheduled-quotas', scheduledQuotasRoutes);

// TODO: FASE 6 - Pagos
// router.use('/payments', mortgagePaymentsRoutes);
// router.use('/payment-lines', paymentLinesRoutes);
// router.use('/pending-balances', quotaPendingBalancesRoutes);

// TODO: FASE 7 - Cobranza
// router.use('/collection-portfolio', collectionPortfolioRoutes);
// router.use('/collection-cases', collectionCasesRoutes);
// router.use('/collection-activities', collectionActivitiesRoutes);

// TODO: FASE 8 - Soporte
// router.use('/payment-agreements', paymentAgreementsRoutes);
// router.use('/accounting-configuration', accountingConfigurationRoutes);
// router.use('/balance-history', balanceHistoryRoutes);

/**
 * @route GET /api/credits/status
 * @desc Obtener estado general del módulo de créditos
 * @access Privado
 */
router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      module: 'Créditos Hipotecarios',
      version: '1.0.0',
      status: 'En desarrollo',
      modules_implemented: [
        'Types (Tipos de Crédito)',
        'Quota Configurations (Configuración de Cuotas)',
        'Notaries (Notarías)',
        'Properties (Propiedades Hipotecarias)',
        'Property Owners (Propietarios de Propiedades)',
        'Document Categories (Categorías de Documentos)',
        'Document Types (Tipos de Documentos)',
        'Mortgage Documents (Documentos de Créditos)',
        'Mortgages (Créditos Hipotecarios Principales)',
        'Mortgage Debtors (Deudores de Créditos)'
      ],
      modules_pending: [
        'Creditors (Acreedores de Créditos)',
        'Interest Liquidations (Liquidaciones de Intereses)',
        'Scheduled Quotas (Cuotas Programadas)',
        'Payments (Pagos)',
        'Collection (Cobranza)'
      ],
      current_phase: 'FASE 4: CRÉDITOS PRINCIPALES - EN DESARROLLO 🔄'
    },
    message: 'Estado del módulo de créditos obtenido correctamente'
  });
});

module.exports = router; 