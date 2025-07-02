-- =====================================================
-- TABLAS DE ASIENTOS CONTABLES CON COMENTARIOS
-- =====================================================

-- Tabla principal de asientos contables
CREATE TABLE journal_entries (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'Identificador único del asiento contable',
    entry_number VARCHAR(20) UNIQUE NOT NULL COMMENT 'Número único del asiento contable para identificación en reportes',
    date DATE NOT NULL COMMENT 'Fecha del asiento contable',
    fiscal_period_id INT NOT NULL COMMENT 'ID del período fiscal al que pertenece el asiento',
    reference VARCHAR(100) COMMENT 'Referencia o número de documento relacionado',
    description TEXT COMMENT 'Descripción o concepto general del asiento contable',
    third_party_id INT NULL COMMENT 'ID del tercero relacionado con el asiento contable',
    status ENUM('draft','posted','reversed') DEFAULT 'draft' COMMENT 'Estado del asiento (draft=borrador, posted=registrado, reversed=reversado)',
    is_adjustment BOOLEAN DEFAULT false COMMENT 'Indica si es un asiento de ajuste (cierre, apertura, etc.)',
    is_recurring BOOLEAN DEFAULT false COMMENT 'Indica si es un asiento recurrente (plantilla)',
    source_document_type VARCHAR(50) NULL COMMENT 'Tipo de documento origen (factura, comprobante, etc.)',
    source_document_id INT NULL COMMENT 'ID del documento origen en su tabla correspondiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de creación del registro',
    created_by INT NOT NULL COMMENT 'ID del usuario que creó el asiento',
    posted_at DATETIME NULL COMMENT 'Fecha y hora en que se registró/confirmó el asiento',
    posted_by INT NULL COMMENT 'ID del usuario que registró/confirmó el asiento',
    FOREIGN KEY (fiscal_period_id) REFERENCES fiscal_periods(id) COMMENT 'Relación con el período fiscal',
    FOREIGN KEY (third_party_id) REFERENCES third_parties(id) COMMENT 'Relación con el tercero',
    FOREIGN KEY (created_by) REFERENCES users(id) COMMENT 'Relación con el usuario creador',
    FOREIGN KEY (posted_by) REFERENCES users(id) COMMENT 'Relación con el usuario que registró'
) COMMENT 'Tabla para almacenar los asientos contables (conjunto de movimientos débito/crédito)';

-- Tabla para líneas de asientos contables
CREATE TABLE journal_entry_lines (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'Identificador único de la línea de asiento',
    journal_entry_id INT NOT NULL COMMENT 'ID del asiento contable al que pertenece esta línea',
    account_id INT NOT NULL COMMENT 'ID de la cuenta contable afectada',
    third_party_id INT NULL COMMENT 'ID del tercero específico de esta línea (puede ser diferente al del asiento principal)',
    description TEXT COMMENT 'Descripción o concepto de la línea',
    debit_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Monto del débito (cargo)',
    credit_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Monto del crédito (abono)',
    order_number INT NOT NULL COMMENT 'Número de orden de la línea en el asiento',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de creación del registro',
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE COMMENT 'Relación con el asiento contable, se elimina en cascada',
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id) COMMENT 'Relación con la cuenta contable',
    FOREIGN KEY (third_party_id) REFERENCES third_parties(id) COMMENT 'Relación con el tercero'
) COMMENT 'Tabla para almacenar las líneas o movimientos individuales de los asientos contables';

-- Tabla para saldos de cuentas
CREATE TABLE account_balances (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'Identificador único del saldo de cuenta',
    account_id INT NOT NULL COMMENT 'ID de la cuenta contable',
    fiscal_period_id INT NOT NULL COMMENT 'ID del período fiscal',
    debit_balance DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Saldo débito acumulado en el período',
    credit_balance DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Saldo crédito acumulado en el período',
    starting_balance DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Saldo inicial al comienzo del período',
    ending_balance DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Saldo final al cierre del período',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de última actualización del saldo',
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id) COMMENT 'Relación con la cuenta contable',
    FOREIGN KEY (fiscal_period_id) REFERENCES fiscal_periods(id) COMMENT 'Relación con el período fiscal',
    UNIQUE KEY unique_account_period (account_id, fiscal_period_id) COMMENT 'Restricción para garantizar un solo registro por cuenta y período'
) COMMENT 'Tabla para almacenar los saldos de las cuentas contables por período fiscal';

-- Tabla de relación entre comprobantes y asientos contables
CREATE TABLE accounting_voucher_journal_entries (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'Identificador único de la relación',
    voucher_id INT NOT NULL COMMENT 'ID del comprobante contable',
    journal_entry_id INT NOT NULL COMMENT 'ID del asiento contable relacionado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de creación del registro',
    FOREIGN KEY (voucher_id) REFERENCES accounting_vouchers(id) ON DELETE CASCADE COMMENT 'Relación con el comprobante contable, se elimina en cascada',
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE COMMENT 'Relación con el asiento contable, se elimina en cascada',
    UNIQUE KEY unique_voucher_entry (voucher_id, journal_entry_id) COMMENT 'Restricción para evitar relaciones duplicadas'
) COMMENT 'Tabla para relacionar comprobantes contables con sus asientos generados';

-- Restricciones para líneas de asiento
ALTER TABLE journal_entry_lines
ADD CONSTRAINT chk_journal_entry_lines_amounts 
CHECK (debit_amount >= 0 AND credit_amount >= 0) COMMENT 'Garantiza que los montos nunca sean negativos';

ALTER TABLE journal_entry_lines
ADD CONSTRAINT chk_journal_entry_lines_debit_credit 
CHECK ((debit_amount > 0 AND credit_amount = 0) OR (credit_amount > 0 AND debit_amount = 0) OR (debit_amount = 0 AND credit_amount = 0)) COMMENT 'Garantiza que una línea no tenga débito y crédito simultáneamente';

/*
EXPLICACIÓN DE LAS RELACIONES:

1. Relación principal Asiento-Líneas:
   - Un asiento contable (journal_entries) contiene múltiples líneas (journal_entry_lines).
   - Cada línea pertenece a un único asiento.
   - La relación es 1:N (un asiento, muchas líneas).
   - Las líneas se eliminan automáticamente cuando se elimina el asiento (ON DELETE CASCADE).

2. Principio de Partida Doble:
   - Las restricciones (CHECK) garantizan que las líneas de asiento cumplan con el principio de partida doble.
   - Una línea no puede tener débito y crédito simultáneamente.
   - Los montos nunca pueden ser negativos.
   - La suma de débitos debe ser igual a la suma de créditos en un asiento.

3. Relación con Plan de Cuentas:
   - Cada línea de asiento afecta a una cuenta contable específica.
   - Los saldos de las cuentas se mantienen actualizados en la tabla account_balances.

4. Relación con Comprobantes:
   - Un asiento contable puede generarse a partir de un comprobante contable.
   - Esta relación permite mantener la trazabilidad desde el documento origen hasta el asiento.
   - La tabla accounting_voucher_journal_entries establece esta relación.

5. Estados del Asiento:
   - Un asiento puede estar en estado borrador (draft).
   - Cuando se confirma, pasa a estado registrado (posted).
   - Un asiento puede ser reversado (reversed) si es necesario corregirlo.

Este modelo permite un flujo de trabajo donde:
1. Se crea un asiento en estado borrador con sus líneas.
2. Se verifica que cumpla con el principio de partida doble.
3. Se registra el asiento, actualizando los saldos de las cuentas.
4. Si es necesario, se puede reversar el asiento, generando uno nuevo que compense al original.
5. Los asientos están vinculados a documentos o comprobantes para mantener la trazabilidad.
*/ 