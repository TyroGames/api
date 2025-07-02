-- =====================================================
-- TABLAS DE COMPROBANTES CONTABLES CON COMENTARIOS
-- =====================================================

-- Tabla principal de comprobantes contables
CREATE TABLE accounting_vouchers (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'Identificador único del comprobante contable',
    voucher_type_id INT NOT NULL COMMENT 'ID del tipo de comprobante asociado (referencia a accounting_voucher_types)',
    consecutive INT NOT NULL COMMENT 'Número consecutivo del comprobante dentro de su tipo',
    voucher_number VARCHAR(50) NULL COMMENT 'Número completo del comprobante (generalmente prefijo+consecutivo)',
    date DATE NOT NULL COMMENT 'Fecha del comprobante contable',
    description TEXT NULL COMMENT 'Descripción detallada del comprobante',
    concept TEXT COMMENT 'Concepto general o propósito del comprobante',
    reference VARCHAR(100) NULL COMMENT 'Referencia adicional del comprobante',
    fiscal_period_id INT NOT NULL COMMENT 'ID del período fiscal al que pertenece',
    third_party_id INT NULL COMMENT 'ID del tercero relacionado con el comprobante',
    document_type_id INT NULL COMMENT 'ID del tipo de documento legal relacionado',
    document_id INT NULL COMMENT 'ID del documento legal relacionado',
    document_number VARCHAR(50) NULL COMMENT 'Número del documento legal relacionado',
    total_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Monto total del comprobante',
    total_debit DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Suma total de los débitos del comprobante',
    total_credit DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Suma total de los créditos del comprobante',
    currency_id INT NULL COMMENT 'ID de la moneda del comprobante',
    exchange_rate DECIMAL(10,6) DEFAULT 1.000000 COMMENT 'Tasa de cambio para moneda extranjera',
    entity_type VARCHAR(50) NULL COMMENT 'Tipo de entidad relacionada (customer, supplier, etc.)',
    entity_id INT NULL COMMENT 'ID de la entidad relacionada según entity_type',
    entity_name VARCHAR(150) NULL COMMENT 'Nombre de la entidad relacionada (redundante para consultas rápidas)',
    status ENUM('DRAFT', 'VALIDATED', 'APPROVED', 'CANCELLED') DEFAULT 'DRAFT' COMMENT 'Estado actual del comprobante (DRAFT=Borrador, VALIDATED=Validado, APPROVED=Aprobado, CANCELLED=Anulado)',
    journal_entry_id INT NULL COMMENT 'ID del asiento contable generado a partir de este comprobante',
    created_by INT NOT NULL COMMENT 'ID del usuario que creó el comprobante',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de creación del registro',
    updated_at TIMESTAMP NULL COMMENT 'Fecha y hora de última actualización',
    updated_by INT NULL COMMENT 'ID del usuario que realizó la última actualización',
    approved_at DATETIME NULL COMMENT 'Fecha y hora de aprobación del comprobante',
    approved_by INT NULL COMMENT 'ID del usuario que aprobó el comprobante',
    FOREIGN KEY (voucher_type_id) REFERENCES accounting_voucher_types(id) COMMENT 'Relación con el tipo de comprobante',
    FOREIGN KEY (fiscal_period_id) REFERENCES fiscal_periods(id) COMMENT 'Relación con el período fiscal',
    FOREIGN KEY (third_party_id) REFERENCES third_parties(id) COMMENT 'Relación con el tercero',
    FOREIGN KEY (document_type_id) REFERENCES legal_document_types(id) COMMENT 'Relación con el tipo de documento legal',
    FOREIGN KEY (currency_id) REFERENCES currencies(id) COMMENT 'Relación con la moneda',
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) COMMENT 'Relación con el asiento contable generado',
    FOREIGN KEY (created_by) REFERENCES users(id) COMMENT 'Relación con el usuario creador',
    FOREIGN KEY (updated_by) REFERENCES users(id) COMMENT 'Relación con el usuario que actualizó',
    FOREIGN KEY (approved_by) REFERENCES users(id) COMMENT 'Relación con el usuario que aprobó',
    UNIQUE KEY unique_type_consecutive (voucher_type_id, consecutive) COMMENT 'Restricción para evitar duplicados en números consecutivos'
) COMMENT 'Tabla para almacenar los comprobantes contables que son documentos internos para autorizar transacciones';

-- Tabla para líneas de comprobantes contables
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

/*
EXPLICACIÓN DE LAS RELACIONES:

1. Relación principal Comprobante-Líneas:
   - Un comprobante contable (accounting_vouchers) puede tener múltiples líneas (voucher_lines).
   - Cada línea pertenece a un único comprobante.
   - La relación es 1:N (un comprobante, muchas líneas).
   - Las líneas se eliminan automáticamente cuando se elimina el comprobante (ON DELETE CASCADE).

2. Relación con el Plan de Cuentas:
   - Cada línea del comprobante afecta a una cuenta contable específica (chart_of_accounts).
   - La suma de los débitos y créditos de todas las líneas debe ser igual (principio de partida doble).

3. Relación con Documentos Legales:
   - Un comprobante puede estar asociado a un documento legal (legal_documents).
   - Esta relación permite vincular comprobantes internos con documentos externos (facturas, etc.).
   - Los campos document_type_id, document_id y document_number establecen esta relación.

4. Relación con Asientos Contables:
   - Un comprobante genera un asiento contable (journal_entries) al ser aprobado.
   - Esta relación permite seguir la trazabilidad del proceso contable.
   - El campo journal_entry_id en el comprobante establece esta relación.

5. Restricciones de Integridad:
   - La clave única unique_type_consecutive garantiza que no haya duplicados en la numeración.
   - La clave única unique_voucher_line garantiza que no haya líneas duplicadas en un comprobante.

Este modelo permite un flujo de trabajo donde:
1. Se crea un comprobante en estado DRAFT.
2. Se agregan las líneas con débitos y créditos.
3. Se valida el comprobante (VALIDATED).
4. Al aprobarlo (APPROVED) se genera el asiento contable correspondiente.
5. El comprobante puede ser anulado (CANCELLED) si es necesario.
*/ 