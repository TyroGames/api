-- =============================================================================
-- TABLAS CON COMENTARIOS COMPLETOS PARA EL SISTEMA CONTABLE
-- =============================================================================

-- -----------------------------------------------------
-- 1. TABLA PARA DETALLES DE DOCUMENTOS LEGALES 
-- -----------------------------------------------------

DROP TABLE IF EXISTS legal_document_details;
CREATE TABLE legal_document_details (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'Identificador único del detalle del documento',
    document_id INT NOT NULL COMMENT 'ID del documento legal al que pertenece esta línea',
    line_number INT NOT NULL COMMENT 'Número de línea u orden dentro del documento',
    description VARCHAR(255) NOT NULL COMMENT 'Descripción del producto o servicio',
    quantity DECIMAL(10,2) DEFAULT 1.00 COMMENT 'Cantidad del producto o servicio',
    unit_price DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Precio unitario sin impuestos',
    amount DECIMAL(15,2) NOT NULL COMMENT 'Importe total de la línea sin impuestos (quantity * unit_price)',
    tax_percentage DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Porcentaje de impuesto aplicado a esta línea',
    tax_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Monto de impuesto calculado para esta línea',
    discount_percentage DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Porcentaje de descuento aplicado a esta línea',
    discount_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Monto de descuento aplicado a esta línea',
    account_id INT NULL COMMENT 'ID de la cuenta contable asociada a esta línea',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de creación del registro',
    FOREIGN KEY (document_id) REFERENCES legal_documents(id) ON DELETE CASCADE COMMENT 'Relación con el documento legal, se elimina en cascada si se borra el documento',
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id) COMMENT 'Relación con la cuenta contable',
    UNIQUE KEY unique_document_line (document_id, line_number) COMMENT 'Restricción para evitar líneas duplicadas en un mismo documento'
) COMMENT 'Tabla para almacenar los detalles o líneas de documentos legales como facturas, notas débito/crédito, etc.';

-- -----------------------------------------------------
-- 2. TABLA PARA LÍNEAS DE COMPROBANTES CONTABLES
-- -----------------------------------------------------

DROP TABLE IF EXISTS voucher_lines;
CREATE TABLE voucher_lines (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'Identificador único de la línea del comprobante',
    voucher_id INT NOT NULL COMMENT 'ID del comprobante contable al que pertenece esta línea',
    line_number INT NOT NULL COMMENT 'Número de línea u orden dentro del comprobante',
    account_id INT NOT NULL COMMENT 'ID de la cuenta contable afectada por esta línea',
    description TEXT NULL COMMENT 'Descripción o concepto de la transacción en esta línea',
    debit_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Monto del débito (cargo) en esta línea',
    credit_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Monto del crédito (abono) en esta línea',
    reference VARCHAR(100) NULL COMMENT 'Referencia adicional para esta línea (ej: número de documento)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de creación del registro',
    FOREIGN KEY (voucher_id) REFERENCES accounting_vouchers(id) ON DELETE CASCADE COMMENT 'Relación con el comprobante contable, se elimina en cascada si se borra el comprobante',
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id) COMMENT 'Relación con la cuenta contable',
    UNIQUE KEY unique_voucher_line (voucher_id, line_number) COMMENT 'Restricción para evitar líneas duplicadas en un mismo comprobante'
) COMMENT 'Tabla para almacenar las líneas de los comprobantes contables que representan la distribución de montos entre cuentas';

-- -----------------------------------------------------
-- 3. TABLA PARA NOTAS DÉBITO DE VENTAS
-- -----------------------------------------------------

DROP TABLE IF EXISTS debit_notes_sales;
CREATE TABLE debit_notes_sales (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'Identificador único de la nota débito',
    debit_note_number VARCHAR(20) UNIQUE NOT NULL COMMENT 'Número único de la nota débito',
    invoice_id INT NULL COMMENT 'ID de la factura a la que se relaciona esta nota (puede ser nula si es independiente)',
    customer_id INT NOT NULL COMMENT 'ID del cliente al que se emite la nota débito',
    date DATE NOT NULL COMMENT 'Fecha de emisión de la nota débito',
    fiscal_period_id INT NOT NULL COMMENT 'ID del período fiscal al que pertenece',
    description TEXT COMMENT 'Descripción o motivo general de la nota débito',
    subtotal DECIMAL(15,2) NOT NULL COMMENT 'Subtotal de la nota débito sin impuestos',
    tax_amount DECIMAL(15,2) NOT NULL COMMENT 'Monto total de impuestos de la nota débito',
    total_amount DECIMAL(15,2) NOT NULL COMMENT 'Monto total de la nota débito (subtotal + impuestos)',
    status ENUM('draft','approved','applied','cancelled') DEFAULT 'draft' COMMENT 'Estado actual de la nota débito (draft=borrador, approved=aprobada, applied=aplicada, cancelled=anulada)',
    journal_entry_id INT NULL COMMENT 'ID del asiento contable generado para esta nota débito',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de creación del registro',
    created_by INT NOT NULL COMMENT 'ID del usuario que creó la nota débito',
    approved_at DATETIME NULL COMMENT 'Fecha y hora en que se aprobó la nota débito',
    approved_by INT NULL COMMENT 'ID del usuario que aprobó la nota débito',
    FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id) COMMENT 'Relación con la factura de venta original',
    FOREIGN KEY (customer_id) REFERENCES customers(id) COMMENT 'Relación con el cliente',
    FOREIGN KEY (fiscal_period_id) REFERENCES fiscal_periods(id) COMMENT 'Relación con el período fiscal',
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) COMMENT 'Relación con el asiento contable generado',
    FOREIGN KEY (created_by) REFERENCES users(id) COMMENT 'Relación con el usuario creador',
    FOREIGN KEY (approved_by) REFERENCES users(id) COMMENT 'Relación con el usuario que aprobó'
) COMMENT 'Tabla para almacenar notas débito emitidas a clientes, que incrementan el valor a cobrar';

DROP TABLE IF EXISTS debit_notes_sales_lines;
CREATE TABLE debit_notes_sales_lines (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'Identificador único de la línea de nota débito',
    debit_note_id INT NOT NULL COMMENT 'ID de la nota débito a la que pertenece esta línea',
    description VARCHAR(255) NOT NULL COMMENT 'Descripción del concepto, producto o servicio',
    quantity DECIMAL(10,2) NOT NULL COMMENT 'Cantidad del producto o servicio',
    unit_price DECIMAL(15,2) NOT NULL COMMENT 'Precio unitario sin impuestos',
    tax_percent DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Porcentaje de impuesto aplicado a esta línea',
    tax_amount DECIMAL(15,2) NOT NULL COMMENT 'Monto de impuesto calculado para esta línea',
    total_amount DECIMAL(15,2) NOT NULL COMMENT 'Monto total de la línea con impuestos incluidos',
    revenue_account_id INT NOT NULL COMMENT 'ID de la cuenta contable de ingreso asociada a esta línea',
    order_number INT NOT NULL COMMENT 'Número de orden de la línea en la nota débito',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de creación del registro',
    FOREIGN KEY (debit_note_id) REFERENCES debit_notes_sales(id) ON DELETE CASCADE COMMENT 'Relación con la nota débito, se elimina en cascada si se borra la nota',
    FOREIGN KEY (revenue_account_id) REFERENCES chart_of_accounts(id) COMMENT 'Relación con la cuenta contable de ingreso'
) COMMENT 'Tabla para almacenar las líneas o detalles de las notas débito de ventas';

-- -----------------------------------------------------
-- 4. TABLA PARA RELACIÓN DOCUMENTOS-COMPROBANTES
-- -----------------------------------------------------

DROP TABLE IF EXISTS legal_document_vouchers;
CREATE TABLE legal_document_vouchers (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'Identificador único de la relación',
    legal_document_id INT NOT NULL COMMENT 'ID del documento legal relacionado',
    accounting_voucher_id INT NOT NULL COMMENT 'ID del comprobante contable relacionado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de creación del registro',
    created_by INT NOT NULL COMMENT 'ID del usuario que estableció la relación',
    FOREIGN KEY (legal_document_id) REFERENCES legal_documents(id) ON DELETE CASCADE COMMENT 'Relación con el documento legal, se elimina en cascada si se borra el documento',
    FOREIGN KEY (accounting_voucher_id) REFERENCES accounting_vouchers(id) ON DELETE CASCADE COMMENT 'Relación con el comprobante contable, se elimina en cascada si se borra el comprobante',
    FOREIGN KEY (created_by) REFERENCES users(id) COMMENT 'Relación con el usuario creador',
    UNIQUE KEY unique_document_voucher (legal_document_id, accounting_voucher_id) COMMENT 'Restricción para evitar relaciones duplicadas'
) COMMENT 'Tabla para relacionar documentos legales con comprobantes contables (relación muchos a muchos)';

-- -----------------------------------------------------
-- 5. MODIFICACIÓN DE TABLA ACCOUNTING_VOUCHERS
-- -----------------------------------------------------

-- Ejemplo de cómo debería quedar la tabla accounting_vouchers con comentarios completos
-- (Esta es una recreación para referencia, ya que modificar directamente la tabla existente
-- con ALTER TABLE requeriría separar cada columna)

/*
CREATE TABLE accounting_vouchers (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'Identificador único del comprobante contable',
    voucher_type_id INT NOT NULL COMMENT 'ID del tipo de comprobante asociado',
    consecutive INT NOT NULL COMMENT 'Número consecutivo del comprobante',
    voucher_number VARCHAR(50) NULL COMMENT 'Número completo del comprobante (generalmente prefijo+consecutivo)',
    date DATE NOT NULL COMMENT 'Fecha del comprobante contable',
    description TEXT NULL COMMENT 'Descripción detallada del comprobante',
    concept TEXT COMMENT 'Concepto general del comprobante',
    reference VARCHAR(100) NULL COMMENT 'Referencia adicional del comprobante',
    fiscal_period_id INT NOT NULL COMMENT 'ID del período fiscal al que pertenece',
    third_party_id INT NULL COMMENT 'ID del tercero relacionado con el comprobante',
    document_type_id INT NULL COMMENT 'ID del tipo de documento relacionado',
    document_id INT NULL COMMENT 'ID del documento legal relacionado',
    document_number VARCHAR(50) NULL COMMENT 'Número del documento legal relacionado',
    total_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Monto total del comprobante',
    total_debit DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Suma total de los débitos del comprobante',
    total_credit DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Suma total de los créditos del comprobante',
    currency_id INT NULL COMMENT 'ID de la moneda del comprobante',
    exchange_rate DECIMAL(10,6) DEFAULT 1.000000 COMMENT 'Tasa de cambio para moneda extranjera',
    entity_type VARCHAR(50) NULL COMMENT 'Tipo de entidad relacionada (customer, supplier, etc.)',
    entity_id INT NULL COMMENT 'ID de la entidad relacionada',
    entity_name VARCHAR(150) NULL COMMENT 'Nombre de la entidad relacionada',
    status ENUM('DRAFT', 'VALIDATED', 'APPROVED', 'CANCELLED') DEFAULT 'DRAFT' COMMENT 'Estado actual del comprobante',
    journal_entry_id INT NULL COMMENT 'ID del asiento contable generado para este comprobante',
    created_by INT NOT NULL COMMENT 'ID del usuario que creó el comprobante',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de creación del registro',
    updated_at TIMESTAMP NULL COMMENT 'Fecha y hora de última actualización',
    updated_by INT NULL COMMENT 'ID del usuario que actualizó el comprobante',
    approved_at DATETIME NULL COMMENT 'Fecha y hora de aprobación del comprobante',
    approved_by INT NULL COMMENT 'ID del usuario que aprobó el comprobante',
    FOREIGN KEY (voucher_type_id) REFERENCES accounting_voucher_types(id),
    FOREIGN KEY (fiscal_period_id) REFERENCES fiscal_periods(id),
    FOREIGN KEY (third_party_id) REFERENCES third_parties(id),
    FOREIGN KEY (document_type_id) REFERENCES legal_document_types(id),
    FOREIGN KEY (currency_id) REFERENCES currencies(id),
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    UNIQUE KEY unique_type_consecutive (voucher_type_id, consecutive)
) COMMENT 'Tabla para almacenar los comprobantes contables que son documentos internos para autorizar transacciones';
*/

-- -----------------------------------------------------
-- 6. MODIFICACIÓN DE TABLA LEGAL_DOCUMENTS
-- -----------------------------------------------------

-- Ejemplo de cómo debería quedar la tabla legal_documents con comentarios completos
-- (Esta es una recreación para referencia, ya que modificar directamente la tabla existente
-- con ALTER TABLE requeriría separar cada columna)

/*
CREATE TABLE legal_documents (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'Identificador único del documento legal',
    document_type_id INT NOT NULL COMMENT 'ID del tipo de documento legal',
    document_number VARCHAR(50) NOT NULL COMMENT 'Número o referencia del documento legal',
    document_date DATE NOT NULL COMMENT 'Fecha del documento legal',
    due_date DATE NULL COMMENT 'Fecha de vencimiento del documento',
    third_party_id INT NULL COMMENT 'ID del tercero relacionado con el documento',
    entity_type VARCHAR(50) NULL COMMENT 'Tipo de entidad relacionada (customer, supplier, etc.)',
    entity_id INT NULL COMMENT 'ID de la entidad relacionada',
    entity_name VARCHAR(150) NULL COMMENT 'Nombre de la entidad relacionada',
    reference VARCHAR(100) NULL COMMENT 'Referencia o número de documento relacionado',
    document_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Monto o valor total del documento legal',
    tax_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Monto total de impuestos del documento',
    description TEXT COMMENT 'Descripción o detalle del documento legal',
    currency_id INT NULL COMMENT 'ID de la moneda del documento',
    exchange_rate DECIMAL(10,6) DEFAULT 1.000000 COMMENT 'Tasa de cambio para moneda extranjera',
    fiscal_period_id INT NULL COMMENT 'ID del período fiscal al que pertenece el documento',
    file_path VARCHAR(255) COMMENT 'Ruta del archivo adjunto en el sistema',
    file_name VARCHAR(100) COMMENT 'Nombre del archivo adjunto',
    status ENUM('ACTIVE', 'CANCELLED') DEFAULT 'ACTIVE' COMMENT 'Estado del documento (ACTIVE=Activo, CANCELLED=Anulado)',
    uploaded_by INT NOT NULL COMMENT 'ID del usuario que subió el documento',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de creación del registro',
    updated_at TIMESTAMP NULL COMMENT 'Fecha y hora de última actualización',
    approved_at DATETIME NULL COMMENT 'Fecha y hora de aprobación del documento',
    approved_by INT NULL COMMENT 'ID del usuario que aprobó el documento',
    FOREIGN KEY (document_type_id) REFERENCES legal_document_types(id),
    FOREIGN KEY (third_party_id) REFERENCES third_parties(id),
    FOREIGN KEY (currency_id) REFERENCES currencies(id),
    FOREIGN KEY (fiscal_period_id) REFERENCES fiscal_periods(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    UNIQUE KEY unique_type_number (document_type_id, document_number)
) COMMENT 'Tabla para almacenar documentos legales como facturas, recibos, contratos, etc.';
*/

-- -----------------------------------------------------
-- 7. ÍNDICES PARA MEJORAR RENDIMIENTO
-- -----------------------------------------------------

-- Índices para documentos legales
CREATE INDEX IF NOT EXISTS idx_legal_docs_entity ON legal_documents(entity_type, entity_id) COMMENT 'Índice para optimizar búsquedas por entidad relacionada';
CREATE INDEX IF NOT EXISTS idx_legal_docs_date ON legal_documents(document_date) COMMENT 'Índice para optimizar búsquedas por fecha';
CREATE INDEX IF NOT EXISTS idx_legal_docs_type_number ON legal_documents(document_type_id, document_number) COMMENT 'Índice para optimizar búsquedas por tipo y número de documento';
CREATE INDEX IF NOT EXISTS idx_legal_docs_status ON legal_documents(status) COMMENT 'Índice para optimizar búsquedas por estado';

-- Índices para comprobantes contables
CREATE INDEX IF NOT EXISTS idx_vouchers_document ON accounting_vouchers(document_type_id, document_id) COMMENT 'Índice para optimizar búsquedas por documento relacionado';
CREATE INDEX IF NOT EXISTS idx_vouchers_entity ON accounting_vouchers(entity_type, entity_id) COMMENT 'Índice para optimizar búsquedas por entidad relacionada';
CREATE INDEX IF NOT EXISTS idx_vouchers_date ON accounting_vouchers(date) COMMENT 'Índice para optimizar búsquedas por fecha';
CREATE INDEX IF NOT EXISTS idx_vouchers_journal ON accounting_vouchers(journal_entry_id) COMMENT 'Índice para optimizar búsquedas por asiento contable relacionado';
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON accounting_vouchers(status) COMMENT 'Índice para optimizar búsquedas por estado'; 