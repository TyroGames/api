-- =============================================================================
-- SCRIPTS DE MEJORA PARA LA BASE DE DATOS DEL SISTEMA CONTABLE
-- Estos scripts agregan y modifican tablas para alinearlas con el código del backend
-- =============================================================================

-- -----------------------------------------------------
-- 1. TABLA PARA DETALLES DE DOCUMENTOS LEGALES 
-- -----------------------------------------------------

-- Verificar si la tabla ya existe para evitar errores
CREATE TABLE IF NOT EXISTS legal_document_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    document_id INT NOT NULL,
    line_number INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1.00,
    unit_price DECIMAL(15,2) DEFAULT 0.00,
    amount DECIMAL(15,2) NOT NULL,
    tax_percentage DECIMAL(5,2) DEFAULT 0.00,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(15,2) DEFAULT 0.00,
    account_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES legal_documents(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id),
    UNIQUE KEY unique_document_line (document_id, line_number)
) COMMENT 'Tabla para almacenar los detalles o líneas de documentos legales';

-- -----------------------------------------------------
-- 2. TABLA PARA LÍNEAS DE COMPROBANTES CONTABLES
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS voucher_lines (
    id INT PRIMARY KEY AUTO_INCREMENT,
    voucher_id INT NOT NULL,
    line_number INT NOT NULL,
    account_id INT NOT NULL,
    description TEXT NULL,
    debit_amount DECIMAL(15,2) DEFAULT 0.00,
    credit_amount DECIMAL(15,2) DEFAULT 0.00,
    reference VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (voucher_id) REFERENCES accounting_vouchers(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id),
    UNIQUE KEY unique_voucher_line (voucher_id, line_number)
) COMMENT 'Tabla para almacenar las líneas de los comprobantes contables';

-- -----------------------------------------------------
-- 3. TABLA PARA NOTAS DÉBITO DE VENTAS
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS debit_notes_sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    debit_note_number VARCHAR(20) UNIQUE NOT NULL,
    invoice_id INT NULL,
    customer_id INT NOT NULL,
    date DATE NOT NULL,
    fiscal_period_id INT NOT NULL,
    description TEXT,
    subtotal DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    status ENUM('draft','approved','applied','cancelled') DEFAULT 'draft',
    journal_entry_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    approved_at DATETIME NULL,
    approved_by INT NULL,
    FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (fiscal_period_id) REFERENCES fiscal_periods(id),
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
) COMMENT 'Tabla para notas débito de ventas a clientes';

CREATE TABLE IF NOT EXISTS debit_notes_sales_lines (
    id INT PRIMARY KEY AUTO_INCREMENT,
    debit_note_id INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    tax_percent DECIMAL(5,2) DEFAULT 0.00,
    tax_amount DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    revenue_account_id INT NOT NULL,
    order_number INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (debit_note_id) REFERENCES debit_notes_sales(id) ON DELETE CASCADE,
    FOREIGN KEY (revenue_account_id) REFERENCES chart_of_accounts(id)
) COMMENT 'Tabla para las líneas de notas débito de ventas';

-- -----------------------------------------------------
-- 4. MODIFICACIÓN DE LA TABLA LEGAL_DOCUMENTS
-- -----------------------------------------------------

-- Verificar si los campos existen antes de agregarlos
-- Nota: Esta sintaxis funciona en MySQL 8.0+

-- Agregar campo entity_type si no existe
ALTER TABLE legal_documents 
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50) NULL COMMENT 'Tipo de entidad relacionada con el documento';

-- Agregar campo entity_id si no existe
ALTER TABLE legal_documents 
ADD COLUMN IF NOT EXISTS entity_id INT NULL COMMENT 'ID de la entidad relacionada';

-- Agregar campo entity_name si no existe
ALTER TABLE legal_documents 
ADD COLUMN IF NOT EXISTS entity_name VARCHAR(150) NULL COMMENT 'Nombre de la entidad relacionada';

-- Agregar campo currency_id si no existe
ALTER TABLE legal_documents 
ADD COLUMN IF NOT EXISTS currency_id INT NULL COMMENT 'ID de la moneda del documento',
ADD CONSTRAINT IF NOT EXISTS fk_legal_docs_currency FOREIGN KEY (currency_id) REFERENCES currencies(id);

-- Agregar campo exchange_rate si no existe
ALTER TABLE legal_documents 
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,6) DEFAULT 1.000000 COMMENT 'Tasa de cambio para moneda extranjera';

-- Agregar campo due_date si no existe
ALTER TABLE legal_documents 
ADD COLUMN IF NOT EXISTS due_date DATE NULL COMMENT 'Fecha de vencimiento del documento';

-- Agregar campo reference si no existe
ALTER TABLE legal_documents 
ADD COLUMN IF NOT EXISTS reference VARCHAR(100) NULL COMMENT 'Referencia o número de documento relacionado';

-- Agregar campo tax_amount si no existe
ALTER TABLE legal_documents 
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Monto de impuestos del documento';

-- Agregar campo fiscal_period_id si no existe
ALTER TABLE legal_documents 
ADD COLUMN IF NOT EXISTS fiscal_period_id INT NULL COMMENT 'Período fiscal al que pertenece el documento',
ADD CONSTRAINT IF NOT EXISTS fk_legal_docs_fiscal_period FOREIGN KEY (fiscal_period_id) REFERENCES fiscal_periods(id);

-- Agregar campo approved_by si no existe
ALTER TABLE legal_documents 
ADD COLUMN IF NOT EXISTS approved_by INT NULL COMMENT 'ID del usuario que aprobó el documento',
ADD CONSTRAINT IF NOT EXISTS fk_legal_docs_approved_by FOREIGN KEY (approved_by) REFERENCES users(id);

-- Agregar campo approved_at si no existe
ALTER TABLE legal_documents 
ADD COLUMN IF NOT EXISTS approved_at DATETIME NULL COMMENT 'Fecha y hora de aprobación del documento';

-- -----------------------------------------------------
-- 5. MODIFICACIÓN DE LA TABLA ACCOUNTING_VOUCHERS
-- -----------------------------------------------------

-- Agregar campo voucher_number si no existe
ALTER TABLE accounting_vouchers 
ADD COLUMN IF NOT EXISTS voucher_number VARCHAR(50) NULL COMMENT 'Número del comprobante contable';

-- Agregar campo document_type_id si no existe
ALTER TABLE accounting_vouchers 
ADD COLUMN IF NOT EXISTS document_type_id INT NULL COMMENT 'ID del tipo de documento relacionado',
ADD CONSTRAINT IF NOT EXISTS fk_vouchers_doc_type FOREIGN KEY (document_type_id) REFERENCES legal_document_types(id);

-- Agregar campo document_id si no existe
ALTER TABLE accounting_vouchers 
ADD COLUMN IF NOT EXISTS document_id INT NULL COMMENT 'ID del documento legal relacionado';

-- Agregar campo document_number si no existe
ALTER TABLE accounting_vouchers 
ADD COLUMN IF NOT EXISTS document_number VARCHAR(50) NULL COMMENT 'Número del documento legal relacionado';

-- Agregar campo description si no existe
ALTER TABLE accounting_vouchers 
ADD COLUMN IF NOT EXISTS description TEXT NULL COMMENT 'Descripción detallada del comprobante';

-- Agregar campo reference si no existe
ALTER TABLE accounting_vouchers 
ADD COLUMN IF NOT EXISTS reference VARCHAR(100) NULL COMMENT 'Referencia adicional del comprobante';

-- Agregar campo currency_id si no existe
ALTER TABLE accounting_vouchers 
ADD COLUMN IF NOT EXISTS currency_id INT NULL COMMENT 'ID de la moneda del comprobante',
ADD CONSTRAINT IF NOT EXISTS fk_vouchers_currency FOREIGN KEY (currency_id) REFERENCES currencies(id);

-- Agregar campo exchange_rate si no existe
ALTER TABLE accounting_vouchers 
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,6) DEFAULT 1.000000 COMMENT 'Tasa de cambio para moneda extranjera';

-- Agregar campo total_amount si no existe
ALTER TABLE accounting_vouchers 
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Monto total del comprobante';

-- Agregar campo entity_type si no existe
ALTER TABLE accounting_vouchers 
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50) NULL COMMENT 'Tipo de entidad relacionada con el comprobante';

-- Agregar campo entity_id si no existe
ALTER TABLE accounting_vouchers 
ADD COLUMN IF NOT EXISTS entity_id INT NULL COMMENT 'ID de la entidad relacionada';

-- Agregar campo entity_name si no existe
ALTER TABLE accounting_vouchers 
ADD COLUMN IF NOT EXISTS entity_name VARCHAR(150) NULL COMMENT 'Nombre de la entidad relacionada';

-- Agregar campo journal_entry_id si no existe
ALTER TABLE accounting_vouchers 
ADD COLUMN IF NOT EXISTS journal_entry_id INT NULL COMMENT 'ID del asiento contable generado',
ADD CONSTRAINT IF NOT EXISTS fk_vouchers_journal_entry FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id);

-- Agregar campo approved_by si no existe
ALTER TABLE accounting_vouchers 
ADD COLUMN IF NOT EXISTS approved_by INT NULL COMMENT 'ID del usuario que aprobó el comprobante',
ADD CONSTRAINT IF NOT EXISTS fk_vouchers_approved_by FOREIGN KEY (approved_by) REFERENCES users(id);

-- Agregar campo approved_at si no existe
ALTER TABLE accounting_vouchers 
ADD COLUMN IF NOT EXISTS approved_at DATETIME NULL COMMENT 'Fecha y hora de aprobación del comprobante';

-- Agregar campo updated_by si no existe
ALTER TABLE accounting_vouchers 
ADD COLUMN IF NOT EXISTS updated_by INT NULL COMMENT 'ID del usuario que actualizó el comprobante',
ADD CONSTRAINT IF NOT EXISTS fk_vouchers_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

-- -----------------------------------------------------
-- 6. ACTUALIZACIÓN DE TABLA DE ESTADOS DE CLIENTES
-- -----------------------------------------------------

-- Modificar el enum para incluir notas débito
ALTER TABLE customer_statement_items 
MODIFY COLUMN document_type ENUM('invoice','credit_note','debit_note','payment','adjustment') NOT NULL;

-- -----------------------------------------------------
-- 7. TABLA PARA RELACIÓN DOCUMENTOS-COMPROBANTES
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS legal_document_vouchers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    legal_document_id INT NOT NULL,
    accounting_voucher_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    FOREIGN KEY (legal_document_id) REFERENCES legal_documents(id) ON DELETE CASCADE,
    FOREIGN KEY (accounting_voucher_id) REFERENCES accounting_vouchers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE KEY unique_document_voucher (legal_document_id, accounting_voucher_id)
) COMMENT 'Tabla para relacionar documentos legales con comprobantes contables';

-- -----------------------------------------------------
-- 8. ÍNDICES PARA MEJORAR RENDIMIENTO
-- -----------------------------------------------------

-- Índices para documentos legales
CREATE INDEX IF NOT EXISTS idx_legal_docs_entity ON legal_documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_legal_docs_date ON legal_documents(document_date);
CREATE INDEX IF NOT EXISTS idx_legal_docs_type_number ON legal_documents(document_type_id, document_number);
CREATE INDEX IF NOT EXISTS idx_legal_docs_status ON legal_documents(status);

-- Índices para comprobantes contables
CREATE INDEX IF NOT EXISTS idx_vouchers_document ON accounting_vouchers(document_type_id, document_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_entity ON accounting_vouchers(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_date ON accounting_vouchers(date);
CREATE INDEX IF NOT EXISTS idx_vouchers_journal ON accounting_vouchers(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON accounting_vouchers(status); 