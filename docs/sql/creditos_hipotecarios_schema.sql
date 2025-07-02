-- =============================================================================
-- MÓDULO DE CRÉDITOS HIPOTECARIOS - ESQUEMA COMPLETO
-- Integración con Sistema Contable Existente
-- =============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- -----------------------------------------------------
-- 1. PRODUCTOS CREDITICIOS
-- -----------------------------------------------------

CREATE TABLE credit_products (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID único del producto crediticio',
    code VARCHAR(20) NOT NULL UNIQUE COMMENT 'Código único del producto',
    name VARCHAR(100) NOT NULL COMMENT 'Nombre del producto crediticio',
    description TEXT COMMENT 'Descripción detallada del producto',
    product_type ENUM('hipotecario', 'consumo', 'comercial', 'microcredito') NOT NULL COMMENT 'Tipo de producto crediticio',
    
    -- Configuración financiera
    min_amount DECIMAL(15,2) NOT NULL COMMENT 'Monto mínimo del crédito',
    max_amount DECIMAL(15,2) NOT NULL COMMENT 'Monto máximo del crédito',
    min_term_months INT NOT NULL COMMENT 'Plazo mínimo en meses',
    max_term_months INT NOT NULL COMMENT 'Plazo máximo en meses',
    
    -- Tasas de interés
    base_interest_rate DECIMAL(8,4) NOT NULL COMMENT 'Tasa de interés base anual',
    interest_type ENUM('fijo', 'variable') DEFAULT 'fijo' COMMENT 'Tipo de tasa de interés',
    grace_period_months INT DEFAULT 0 COMMENT 'Período de gracia en meses',
    
    -- Configuración de pagos
    payment_frequency ENUM('mensual', 'bimestral', 'trimestral', 'semestral', 'anual') DEFAULT 'mensual' COMMENT 'Frecuencia de pago',
    payment_method ENUM('cuota_fija', 'cuota_variable', 'solo_interes') DEFAULT 'cuota_fija' COMMENT 'Método de pago',
    
    -- Configuración de seguros y comisiones
    requires_life_insurance BOOLEAN DEFAULT TRUE COMMENT 'Requiere seguro de vida',
    requires_fire_insurance BOOLEAN DEFAULT TRUE COMMENT 'Requiere seguro de incendio',
    origination_fee_percentage DECIMAL(5,4) DEFAULT 0.0000 COMMENT 'Comisión de originación (%)',
    processing_fee DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Comisión de procesamiento (monto fijo)',
    
    -- Cuentas contables asociadas
    loan_account_id INT NOT NULL COMMENT 'Cuenta contable para el capital del préstamo',
    interest_income_account_id INT NOT NULL COMMENT 'Cuenta de ingresos por intereses',
    fee_income_account_id INT NULL COMMENT 'Cuenta de ingresos por comisiones',
    provision_account_id INT NULL COMMENT 'Cuenta de provisiones',
    
    -- Estados y auditoría
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Producto activo',
    requires_collateral BOOLEAN DEFAULT TRUE COMMENT 'Requiere garantía',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_at TIMESTAMP NULL,
    updated_by INT NULL,
    
    FOREIGN KEY (loan_account_id) REFERENCES chart_of_accounts(id),
    FOREIGN KEY (interest_income_account_id) REFERENCES chart_of_accounts(id),
    FOREIGN KEY (fee_income_account_id) REFERENCES chart_of_accounts(id),
    FOREIGN KEY (provision_account_id) REFERENCES chart_of_accounts(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
) COMMENT 'Tabla de productos crediticios configurables';

-- -----------------------------------------------------
-- 2. SOLICITUDES DE CRÉDITO
-- -----------------------------------------------------

CREATE TABLE credit_applications (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID único de la solicitud',
    application_number VARCHAR(20) NOT NULL UNIQUE COMMENT 'Número único de solicitud',
    third_party_id INT NOT NULL COMMENT 'ID del cliente solicitante',
    credit_product_id INT NOT NULL COMMENT 'Producto crediticio solicitado',
    
    -- Datos de la solicitud
    requested_amount DECIMAL(15,2) NOT NULL COMMENT 'Monto solicitado',
    requested_term_months INT NOT NULL COMMENT 'Plazo solicitado en meses',
    purpose TEXT COMMENT 'Destino del crédito',
    application_date DATE NOT NULL COMMENT 'Fecha de solicitud',
    
    -- Información financiera del solicitante
    monthly_income DECIMAL(12,2) NOT NULL COMMENT 'Ingresos mensuales declarados',
    monthly_expenses DECIMAL(12,2) NOT NULL COMMENT 'Gastos mensuales declarados',
    other_debts DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Otras deudas del solicitante',
    debt_to_income_ratio DECIMAL(5,2) COMMENT 'Relación deuda/ingreso (%)',
    
    -- Evaluación crediticia
    credit_score INT COMMENT 'Puntaje crediticio',
    risk_rating ENUM('A', 'B', 'C', 'D', 'E') COMMENT 'Calificación de riesgo',
    approved_amount DECIMAL(15,2) COMMENT 'Monto aprobado',
    approved_term_months INT COMMENT 'Plazo aprobado',
    approved_rate DECIMAL(8,4) COMMENT 'Tasa aprobada',
    
    -- Estados y fechas
    status ENUM('borrador', 'enviada', 'en_evaluacion', 'aprobada', 'rechazada', 'cancelada') DEFAULT 'borrador',
    submitted_at DATETIME NULL COMMENT 'Fecha de envío',
    evaluated_at DATETIME NULL COMMENT 'Fecha de evaluación',
    approved_at DATETIME NULL COMMENT 'Fecha de aprobación',
    rejection_reason TEXT COMMENT 'Motivo de rechazo',
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_at TIMESTAMP NULL,
    updated_by INT NULL,
    evaluated_by INT NULL,
    approved_by INT NULL,
    
    FOREIGN KEY (third_party_id) REFERENCES third_parties(id),
    FOREIGN KEY (credit_product_id) REFERENCES credit_products(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (evaluated_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
) COMMENT 'Solicitudes de crédito de los clientes';

-- -----------------------------------------------------
-- 3. CRÉDITOS (PRÉSTAMOS ACTIVOS)
-- -----------------------------------------------------

CREATE TABLE credits (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID único del crédito',
    credit_number VARCHAR(20) NOT NULL UNIQUE COMMENT 'Número único del crédito',
    application_id INT NULL COMMENT 'Solicitud que originó este crédito',
    third_party_id INT NOT NULL COMMENT 'Cliente del crédito',
    credit_product_id INT NOT NULL COMMENT 'Producto crediticio',
    
    -- Condiciones del crédito
    principal_amount DECIMAL(15,2) NOT NULL COMMENT 'Capital inicial del crédito',
    interest_rate DECIMAL(8,4) NOT NULL COMMENT 'Tasa de interés anual',
    term_months INT NOT NULL COMMENT 'Plazo total en meses',
    payment_frequency ENUM('mensual', 'bimestral', 'trimestral', 'semestral', 'anual') DEFAULT 'mensual',
    payment_method ENUM('cuota_fija', 'cuota_variable', 'solo_interes') DEFAULT 'cuota_fija',
    payment_amount DECIMAL(12,2) NOT NULL COMMENT 'Monto de cuota calculada',
    
    -- Fechas importantes
    disbursement_date DATE NOT NULL COMMENT 'Fecha de desembolso',
    first_payment_date DATE NOT NULL COMMENT 'Fecha primer pago',
    maturity_date DATE NOT NULL COMMENT 'Fecha de vencimiento',
    
    -- Saldos actuales
    outstanding_balance DECIMAL(15,2) NOT NULL COMMENT 'Saldo de capital pendiente',
    accrued_interest DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Intereses acumulados',
    total_paid_principal DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Capital pagado acumulado',
    total_paid_interest DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Intereses pagados acumulados',
    
    -- Control de pagos
    payments_made INT DEFAULT 0 COMMENT 'Número de pagos realizados',
    days_in_arrears INT DEFAULT 0 COMMENT 'Días de mora',
    late_payment_fee DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Multas por mora acumuladas',
    
    -- Seguros
    life_insurance_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Monto seguro de vida mensual',
    fire_insurance_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Monto seguro incendio mensual',
    
    -- Estados
    status ENUM('activo', 'en_mora', 'vencido', 'cancelado', 'castigado') DEFAULT 'activo',
    risk_rating ENUM('A', 'B', 'C', 'D', 'E') DEFAULT 'A' COMMENT 'Calificación actual de riesgo',
    
    -- Cuentas contables específicas del crédito
    individual_loan_account_id INT NULL COMMENT 'Cuenta individual del préstamo (si aplica)',
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_at TIMESTAMP NULL,
    updated_by INT NULL,
    closed_at DATETIME NULL COMMENT 'Fecha de cierre del crédito',
    closed_by INT NULL,
    
    FOREIGN KEY (application_id) REFERENCES credit_applications(id),
    FOREIGN KEY (third_party_id) REFERENCES third_parties(id),
    FOREIGN KEY (credit_product_id) REFERENCES credit_products(id),
    FOREIGN KEY (individual_loan_account_id) REFERENCES chart_of_accounts(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (closed_by) REFERENCES users(id)
) COMMENT 'Créditos activos y sus saldos';

-- -----------------------------------------------------
-- 4. TABLA DE AMORTIZACIÓN
-- -----------------------------------------------------

CREATE TABLE amortization_schedule (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID único de la cuota',
    credit_id INT NOT NULL COMMENT 'Crédito al que pertenece',
    payment_number INT NOT NULL COMMENT 'Número de cuota',
    
    -- Fechas
    due_date DATE NOT NULL COMMENT 'Fecha de vencimiento de la cuota',
    
    -- Composición de la cuota
    payment_amount DECIMAL(12,2) NOT NULL COMMENT 'Monto total de la cuota',
    principal_amount DECIMAL(12,2) NOT NULL COMMENT 'Capital de la cuota',
    interest_amount DECIMAL(12,2) NOT NULL COMMENT 'Intereses de la cuota',
    life_insurance DECIMAL(8,2) DEFAULT 0.00 COMMENT 'Seguro de vida',
    fire_insurance DECIMAL(8,2) DEFAULT 0.00 COMMENT 'Seguro incendio',
    
    -- Saldos proyectados
    beginning_balance DECIMAL(15,2) NOT NULL COMMENT 'Saldo inicial del período',
    ending_balance DECIMAL(15,2) NOT NULL COMMENT 'Saldo final del período',
    
    -- Control de pago
    is_paid BOOLEAN DEFAULT FALSE COMMENT 'Cuota pagada',
    paid_date DATE NULL COMMENT 'Fecha real de pago',
    paid_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Monto realmente pagado',
    days_late INT DEFAULT 0 COMMENT 'Días de atraso en el pago',
    late_fee DECIMAL(8,2) DEFAULT 0.00 COMMENT 'Multa por mora',
    
    -- Referencia contable
    journal_entry_id INT NULL COMMENT 'Asiento contable del pago',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (credit_id) REFERENCES credits(id) ON DELETE CASCADE,
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id),
    UNIQUE KEY unique_credit_payment (credit_id, payment_number)
) COMMENT 'Tabla de amortización de créditos';

-- -----------------------------------------------------
-- 5. PAGOS DE CRÉDITOS
-- -----------------------------------------------------

CREATE TABLE credit_payments (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID único del pago',
    payment_number VARCHAR(20) NOT NULL UNIQUE COMMENT 'Número único del pago',
    credit_id INT NOT NULL COMMENT 'Crédito al que aplica el pago',
    third_party_id INT NOT NULL COMMENT 'Cliente que realizó el pago',
    
    -- Detalles del pago
    payment_date DATE NOT NULL COMMENT 'Fecha del pago',
    payment_method ENUM('efectivo', 'cheque', 'transferencia', 'tarjeta_credito', 'debito_automatico') NOT NULL,
    reference_number VARCHAR(50) COMMENT 'Número de referencia del pago',
    
    -- Montos del pago
    total_amount DECIMAL(12,2) NOT NULL COMMENT 'Monto total pagado',
    principal_payment DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Abono a capital',
    interest_payment DECIMAL(12,2) DEFAULT 0.00 COMMENT 'Pago de intereses',
    late_fee_payment DECIMAL(8,2) DEFAULT 0.00 COMMENT 'Pago de multas',
    insurance_payment DECIMAL(8,2) DEFAULT 0.00 COMMENT 'Pago de seguros',
    
    -- Aplicación del pago
    overpayment_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Monto de sobrepago',
    
    -- Estados
    status ENUM('pendiente', 'aplicado', 'reversado') DEFAULT 'pendiente',
    applied_at DATETIME NULL COMMENT 'Fecha de aplicación del pago',
    reversed_at DATETIME NULL COMMENT 'Fecha de reversión',
    reversal_reason TEXT COMMENT 'Motivo de reversión',
    
    -- Información bancaria
    bank_account_id INT NULL COMMENT 'Cuenta bancaria donde se recibió',
    bank_transaction_id INT NULL COMMENT 'Transacción bancaria relacionada',
    
    -- Contabilización
    journal_entry_id INT NULL COMMENT 'Asiento contable generado',
    accounting_voucher_id INT NULL COMMENT 'Comprobante contable',
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    applied_by INT NULL,
    reversed_by INT NULL,
    
    FOREIGN KEY (credit_id) REFERENCES credits(id),
    FOREIGN KEY (third_party_id) REFERENCES third_parties(id),
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
    FOREIGN KEY (bank_transaction_id) REFERENCES bank_transactions(id),
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id),
    FOREIGN KEY (accounting_voucher_id) REFERENCES accounting_vouchers(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (applied_by) REFERENCES users(id),
    FOREIGN KEY (reversed_by) REFERENCES users(id)
) COMMENT 'Pagos realizados a los créditos';

-- -----------------------------------------------------
-- 6. GARANTÍAS HIPOTECARIAS
-- -----------------------------------------------------

CREATE TABLE collaterals (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID único de la garantía',
    credit_id INT NOT NULL COMMENT 'Crédito garantizado',
    
    -- Tipo de garantía
    collateral_type ENUM('inmueble', 'vehiculo', 'deposito', 'fianza', 'prenda', 'otro') NOT NULL,
    description TEXT NOT NULL COMMENT 'Descripción de la garantía',
    
    -- Información del inmueble (para hipotecas)
    property_address TEXT COMMENT 'Dirección del inmueble',
    property_registration VARCHAR(50) COMMENT 'Matrícula inmobiliaria',
    property_area_m2 DECIMAL(10,2) COMMENT 'Area en metros cuadrados',
    property_type ENUM('casa', 'apartamento', 'lote', 'local_comercial', 'oficina', 'bodega', 'otro') COMMENT 'Tipo de inmueble',
    
    -- Valoración
    appraised_value DECIMAL(15,2) NOT NULL COMMENT 'Valor de avalúo',
    appraisal_date DATE NOT NULL COMMENT 'Fecha del avalúo',
    appraiser_name VARCHAR(100) NOT NULL COMMENT 'Nombre del perito avaluador',
    current_market_value DECIMAL(15,2) COMMENT 'Valor comercial actual',
    
    -- Relación préstamo-valor
    loan_to_value_ratio DECIMAL(5,2) COMMENT 'Relación préstamo/valor (%)',
    
    -- Estados legales
    legal_status ENUM('libre', 'hipotecado', 'embargado', 'en_sucesion', 'litigio') DEFAULT 'libre',
    registration_number VARCHAR(50) COMMENT 'Número de registro hipotecario',
    registration_date DATE COMMENT 'Fecha de registro',
    
    -- Seguros de la garantía
    insurance_policy_number VARCHAR(50) COMMENT 'Número de póliza de seguro',
    insurance_company VARCHAR(100) COMMENT 'Compañía aseguradora',
    insurance_expiry_date DATE COMMENT 'Fecha vencimiento seguro',
    
    -- Estados
    status ENUM('activa', 'liberada', 'ejecutada', 'sustituida') DEFAULT 'activa',
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_at TIMESTAMP NULL,
    updated_by INT NULL,
    released_at DATETIME NULL,
    released_by INT NULL,
    
    FOREIGN KEY (credit_id) REFERENCES credits(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (released_by) REFERENCES users(id)
) COMMENT 'Garantías asociadas a los créditos';

-- -----------------------------------------------------
-- 7. GESTIÓN DE COBRANZA
-- -----------------------------------------------------

CREATE TABLE collection_cases (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID único del caso de cobranza',
    credit_id INT NOT NULL COMMENT 'Crédito en cobranza',
    case_number VARCHAR(20) NOT NULL UNIQUE COMMENT 'Número del caso',
    
    -- Información del caso
    opened_date DATE NOT NULL COMMENT 'Fecha de apertura del caso',
    days_overdue INT NOT NULL COMMENT 'Días de mora al abrir caso',
    overdue_amount DECIMAL(12,2) NOT NULL COMMENT 'Monto vencido',
    total_debt DECIMAL(15,2) NOT NULL COMMENT 'Deuda total',
    
    -- Clasificación
    collection_stage ENUM('preventiva', 'administrativa', 'prejudicial', 'judicial') DEFAULT 'preventiva',
    priority ENUM('baja', 'media', 'alta', 'critica') DEFAULT 'media',
    
    -- Asignación
    assigned_to INT NULL COMMENT 'Usuario asignado al caso',
    assigned_date DATE NULL COMMENT 'Fecha de asignación',
    
    -- Estado
    status ENUM('abierto', 'en_gestion', 'negociacion', 'acuerdo_pago', 'cerrado', 'juridico') DEFAULT 'abierto',
    closed_date DATE NULL COMMENT 'Fecha de cierre',
    closure_reason TEXT COMMENT 'Motivo de cierre',
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_at TIMESTAMP NULL,
    updated_by INT NULL,
    closed_by INT NULL,
    
    FOREIGN KEY (credit_id) REFERENCES credits(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (closed_by) REFERENCES users(id)
) COMMENT 'Casos de cobranza de créditos morosos';

CREATE TABLE collection_activities (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID única de la actividad',
    collection_case_id INT NOT NULL COMMENT 'Caso de cobranza',
    
    -- Detalles de la actividad
    activity_date DATETIME NOT NULL COMMENT 'Fecha y hora de la actividad',
    activity_type ENUM('llamada', 'visita', 'carta', 'email', 'sms', 'whatsapp', 'reunion', 'acuerdo', 'pago', 'otro') NOT NULL,
    description TEXT NOT NULL COMMENT 'Descripción de la actividad',
    
    -- Resultado
    contact_result ENUM('contacto_exitoso', 'no_contesta', 'numero_equivocado', 'ocupado', 'cliente_ausente', 'promesa_pago', 'disputa', 'otro') NOT NULL,
    next_action VARCHAR(255) COMMENT 'Próxima acción a realizar',
    next_action_date DATE COMMENT 'Fecha programada para próxima acción',
    
    -- Compromiso de pago
    payment_promise_date DATE NULL COMMENT 'Fecha prometida de pago',
    payment_promise_amount DECIMAL(12,2) NULL COMMENT 'Monto prometido',
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    
    FOREIGN KEY (collection_case_id) REFERENCES collection_cases(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
) COMMENT 'Actividades de gestión de cobranza';

-- -----------------------------------------------------
-- 8. REESTRUCTURACIONES Y NOVACIONES
-- -----------------------------------------------------

CREATE TABLE credit_restructures (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID única de la reestructuración',
    original_credit_id INT NOT NULL COMMENT 'Crédito original',
    new_credit_id INT NULL COMMENT 'Nuevo crédito (si se genera uno nuevo)',
    
    -- Tipo de reestructuración
    restructure_type ENUM('refinanciacion', 'novacion', 'quita', 'ampliacion_plazo', 'reduccion_tasa', 'capitalizacion_intereses') NOT NULL,
    reason TEXT NOT NULL COMMENT 'Motivo de la reestructuración',
    
    -- Condiciones originales
    original_balance DECIMAL(15,2) NOT NULL COMMENT 'Saldo original',
    original_rate DECIMAL(8,4) NOT NULL COMMENT 'Tasa original',
    original_term_remaining INT NOT NULL COMMENT 'Plazo restante original',
    
    -- Nuevas condiciones
    new_balance DECIMAL(15,2) NOT NULL COMMENT 'Nuevo saldo',
    new_rate DECIMAL(8,4) NOT NULL COMMENT 'Nueva tasa',
    new_term_months INT NOT NULL COMMENT 'Nuevo plazo',
    new_payment_amount DECIMAL(12,2) NOT NULL COMMENT 'Nueva cuota',
    
    -- Fechas
    restructure_date DATE NOT NULL COMMENT 'Fecha de reestructuración',
    new_first_payment_date DATE NOT NULL COMMENT 'Primera fecha de pago nueva',
    
    -- Aprobaciones
    status ENUM('propuesta', 'aprobada', 'rechazada', 'aplicada') DEFAULT 'propuesta',
    approved_by INT NULL COMMENT 'Usuario que aprobó',
    approved_at DATETIME NULL COMMENT 'Fecha de aprobación',
    
    -- Contabilización
    journal_entry_id INT NULL COMMENT 'Asiento contable de la reestructuración',
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_at TIMESTAMP NULL,
    updated_by INT NULL,
    
    FOREIGN KEY (original_credit_id) REFERENCES credits(id),
    FOREIGN KEY (new_credit_id) REFERENCES credits(id),
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
) COMMENT 'Reestructuraciones de créditos';

-- -----------------------------------------------------
-- 9. PROVISIONES CONTABLES
-- -----------------------------------------------------

CREATE TABLE credit_provisions (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID única de la provisión',
    credit_id INT NOT NULL COMMENT 'Crédito provisionado',
    
    -- Período de la provisión
    provision_date DATE NOT NULL COMMENT 'Fecha de la provisión',
    fiscal_period_id INT NOT NULL COMMENT 'Período fiscal',
    
    -- Clasificación de riesgo
    risk_category ENUM('A', 'B', 'C', 'D', 'E') NOT NULL COMMENT 'Categoría de riesgo',
    days_overdue INT NOT NULL COMMENT 'Días de mora',
    outstanding_balance DECIMAL(15,2) NOT NULL COMMENT 'Saldo pendiente',
    
    -- Cálculo de provisión
    provision_percentage DECIMAL(5,2) NOT NULL COMMENT 'Porcentaje de provisión aplicado',
    provision_amount DECIMAL(15,2) NOT NULL COMMENT 'Monto de provisión calculado',
    previous_provision DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Provisión anterior',
    provision_movement DECIMAL(15,2) NOT NULL COMMENT 'Movimiento de provisión (+ constitución, - liberación)',
    
    -- Contabilización
    journal_entry_id INT NULL COMMENT 'Asiento contable de la provisión',
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    
    FOREIGN KEY (credit_id) REFERENCES credits(id),
    FOREIGN KEY (fiscal_period_id) REFERENCES fiscal_periods(id),
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE KEY unique_credit_period_provision (credit_id, provision_date)
) COMMENT 'Provisiones contables de cartera de créditos';

-- -----------------------------------------------------
-- 10. DESEMBOLSOS
-- -----------------------------------------------------

CREATE TABLE credit_disbursements (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID único del desembolso',
    credit_id INT NOT NULL COMMENT 'Crédito a desembolsar',
    disbursement_number VARCHAR(20) NOT NULL UNIQUE COMMENT 'Número de desembolso',
    
    -- Detalles del desembolso
    disbursement_date DATE NOT NULL COMMENT 'Fecha del desembolso',
    disbursement_amount DECIMAL(15,2) NOT NULL COMMENT 'Monto desembolsado',
    disbursement_method ENUM('efectivo', 'cheque', 'transferencia', 'abono_cuenta') NOT NULL,
    
    -- Información bancaria
    bank_account_id INT NULL COMMENT 'Cuenta bancaria de desembolso',
    bank_transaction_id INT NULL COMMENT 'Transacción bancaria',
    check_number VARCHAR(20) NULL COMMENT 'Número de cheque (si aplica)',
    
    -- Deducciones
    origination_fee DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Comisión de originación deducida',
    processing_fee DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Gastos de procesamiento deducidos',
    insurance_fee DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Prima de seguro deducida',
    other_deductions DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Otras deducciones',
    net_disbursement DECIMAL(15,2) NOT NULL COMMENT 'Desembolso neto al cliente',
    
    -- Estado
    status ENUM('programado', 'procesado', 'entregado', 'cancelado') DEFAULT 'programado',
    processed_at DATETIME NULL COMMENT 'Fecha de procesamiento',
    delivered_at DATETIME NULL COMMENT 'Fecha de entrega',
    
    -- Contabilización
    journal_entry_id INT NOT NULL COMMENT 'Asiento contable del desembolso',
    accounting_voucher_id INT NULL COMMENT 'Comprobante contable',
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    processed_by INT NULL,
    delivered_by INT NULL,
    
    FOREIGN KEY (credit_id) REFERENCES credits(id),
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
    FOREIGN KEY (bank_transaction_id) REFERENCES bank_transactions(id),
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id),
    FOREIGN KEY (accounting_voucher_id) REFERENCES accounting_vouchers(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (processed_by) REFERENCES users(id),
    FOREIGN KEY (delivered_by) REFERENCES users(id)
) COMMENT 'Desembolsos de créditos aprobados';

-- -----------------------------------------------------
-- ÍNDICES PARA OPTIMIZACIÓN
-- -----------------------------------------------------

-- Índices para búsquedas frecuentes
CREATE INDEX idx_credits_status ON credits(status);
CREATE INDEX idx_credits_third_party ON credits(third_party_id);
CREATE INDEX idx_credits_product ON credits(credit_product_id);
CREATE INDEX idx_credits_disbursement_date ON credits(disbursement_date);
CREATE INDEX idx_credits_maturity_date ON credits(maturity_date);
CREATE INDEX idx_credits_days_arrears ON credits(days_in_arrears);

CREATE INDEX idx_amortization_due_date ON amortization_schedule(due_date);
CREATE INDEX idx_amortization_paid ON amortization_schedule(is_paid);
CREATE INDEX idx_amortization_credit_payment ON amortization_schedule(credit_id, payment_number);

CREATE INDEX idx_payments_date ON credit_payments(payment_date);
CREATE INDEX idx_payments_status ON credit_payments(status);
CREATE INDEX idx_payments_credit ON credit_payments(credit_id);

CREATE INDEX idx_applications_status ON credit_applications(status);
CREATE INDEX idx_applications_date ON credit_applications(application_date);
CREATE INDEX idx_applications_third_party ON credit_applications(third_party_id);

CREATE INDEX idx_collection_cases_status ON collection_cases(status);
CREATE INDEX idx_collection_cases_stage ON collection_cases(collection_stage);
CREATE INDEX idx_collection_cases_assigned ON collection_cases(assigned_to);

CREATE INDEX idx_collaterals_credit ON collaterals(credit_id);
CREATE INDEX idx_collaterals_status ON collaterals(status);

-- -----------------------------------------------------
-- TRIGGERS PARA AUTOMATIZACIÓN
-- -----------------------------------------------------

DELIMITER //

-- Trigger para actualizar saldos después de un pago
CREATE TRIGGER tr_update_credit_balance_after_payment
    AFTER INSERT ON credit_payments
    FOR EACH ROW
BEGIN
    IF NEW.status = 'aplicado' THEN
        UPDATE credits 
        SET outstanding_balance = outstanding_balance - NEW.principal_payment,
            total_paid_principal = total_paid_principal + NEW.principal_payment,
            total_paid_interest = total_paid_interest + NEW.interest_payment,
            payments_made = payments_made + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.credit_id;
    END IF;
END //

-- Trigger para actualizar días de mora
CREATE TRIGGER tr_update_days_in_arrears
    BEFORE UPDATE ON credits
    FOR EACH ROW
BEGIN
    DECLARE overdue_days INT DEFAULT 0;
    
    SELECT GREATEST(0, DATEDIFF(CURDATE(), MIN(due_date)))
    INTO overdue_days
    FROM amortization_schedule 
    WHERE credit_id = NEW.id AND is_paid = FALSE AND due_date < CURDATE();
    
    SET NEW.days_in_arrears = COALESCE(overdue_days, 0);
    
    -- Actualizar estado basado en días de mora
    IF NEW.days_in_arrears = 0 THEN
        SET NEW.status = 'activo';
    ELSEIF NEW.days_in_arrears BETWEEN 1 AND 90 THEN
        SET NEW.status = 'en_mora';
    ELSE
        SET NEW.status = 'vencido';
    END IF;
END //

DELIMITER ;

-- =============================================================================
-- DATOS INICIALES
-- =============================================================================

-- Insertar cuentas contables básicas para créditos (ajustar códigos según PUC)
INSERT INTO chart_of_accounts (code, name, description, account_type_id, allows_entries, level, balance_type, created_by) 
VALUES 
    ('1365', 'CARTERA DE CREDITOS', 'Cartera de créditos hipotecarios', 1, FALSE, 1, 'debit', 1),
    ('136505', 'Créditos Hipotecarios Vigentes', 'Cartera hipotecaria vigente', 1, TRUE, 2, 'debit', 1),
    ('136510', 'Créditos Hipotecarios Vencidos', 'Cartera hipotecaria vencida', 1, TRUE, 2, 'debit', 1),
    ('139505', 'Provisión Cartera Créditos', 'Provisión cartera de créditos', 1, TRUE, 2, 'credit', 1),
    ('4135', 'INGRESOS POR INTERESES', 'Ingresos financieros por intereses', 4, FALSE, 1, 'credit', 1),
    ('413505', 'Intereses Créditos Hipotecarios', 'Intereses ganados cartera hipotecaria', 4, TRUE, 2, 'credit', 1),
    ('4175', 'INGRESOS POR COMISIONES', 'Comisiones y honorarios', 4, FALSE, 1, 'credit', 1),
    ('417505', 'Comisiones Créditos', 'Comisiones por manejo de créditos', 4, TRUE, 2, 'credit', 1);

-- Insertar producto crediticio base
INSERT INTO credit_products (
    code, name, description, product_type, 
    min_amount, max_amount, min_term_months, max_term_months,
    base_interest_rate, interest_type, payment_frequency, payment_method,
    requires_life_insurance, requires_fire_insurance,
    origination_fee_percentage, processing_fee,
    loan_account_id, interest_income_account_id, fee_income_account_id,
    created_by
) VALUES (
    'HIP001', 'Crédito Hipotecario Estándar', 'Crédito hipotecario para adquisición de vivienda',
    'hipotecario', 50000000, 500000000, 60, 300, 12.50, 'fijo', 'mensual', 'cuota_fija',
    TRUE, TRUE, 1.5000, 500000,
    (SELECT id FROM chart_of_accounts WHERE code = '136505'),
    (SELECT id FROM chart_of_accounts WHERE code = '413505'),
    (SELECT id FROM chart_of_accounts WHERE code = '417505'),
    1
);

-- =============================================================================
-- COMENTARIOS FINALES
-- =============================================================================

/*
INTEGRACIÓN CON SISTEMA CONTABLE EXISTENTE:

1. TERCEROS (third_parties):
   - Los clientes de créditos se registran como terceros con is_customer = TRUE
   - Se utilizan para la contabilización automática en cuentas auxiliares

2. ASIENTOS CONTABLES (journal_entries):
   - Cada operación crediticia genera asientos automáticos
   - Desembolsos, pagos, provisiones, etc. se contabilizan automáticamente

3. COMPROBANTES (accounting_vouchers):
   - Los pagos y desembolsos generan comprobantes contables
   - Integración completa con el flujo de aprobación existente

4. CUENTAS BANCARIAS (bank_accounts):
   - Los desembolsos y pagos se integran con las cuentas bancarias
   - Conciliación automática de transacciones

5. PERÍODOS FISCALES (fiscal_periods):
   - Las provisiones y cálculos se realizan por período fiscal
   - Reportes financieros integrados

6. MONEDAS (currencies):
   - Soporte para créditos en moneda extranjera
   - Cálculo automático de diferencias de cambio

Esta estructura permite:
- Contabilización automática de todas las operaciones
- Trazabilidad completa de transacciones
- Integración con estados financieros
- Cumplimiento de normativas contables
- Reportes regulatorios automáticos
*/ 