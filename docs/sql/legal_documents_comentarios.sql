-- =====================================================
-- TABLAS DE DOCUMENTOS LEGALES CON COMENTARIOS
-- =====================================================

-- Tabla para tipos de documentos legales
CREATE TABLE legal_document_types (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'Identificador único del tipo de documento legal',
    code VARCHAR(10) NOT NULL UNIQUE COMMENT 'Código único del tipo de documento legal (ej: FAC, REM, ND, NC)',
    name VARCHAR(100) NOT NULL COMMENT 'Nombre descriptivo del tipo de documento legal (ej: Factura de Venta)',
    description TEXT COMMENT 'Descripción detallada del propósito y uso del tipo de documento',
    requires_value BOOLEAN DEFAULT false COMMENT 'Indica si el documento requiere un valor monetario obligatorio',
    requires_file BOOLEAN DEFAULT false COMMENT 'Indica si el documento requiere un archivo adjunto obligatorio',
    is_active BOOLEAN DEFAULT true COMMENT 'Indica si el tipo de documento está activo para su uso en el sistema',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de creación del registro',
    updated_at TIMESTAMP NULL COMMENT 'Fecha y hora de última actualización del registro'
) COMMENT 'Tabla para clasificar los diferentes tipos de documentos legales que maneja el sistema';

-- Tabla principal de documentos legales
CREATE TABLE legal_documents (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'Identificador único del documento legal',
    document_type_id INT NOT NULL COMMENT 'ID del tipo de documento legal',
    document_number VARCHAR(50) NOT NULL COMMENT 'Número o referencia único del documento legal',
    document_date DATE NOT NULL COMMENT 'Fecha de emisión del documento legal',
    due_date DATE NULL COMMENT 'Fecha de vencimiento del documento (si aplica)',
    third_party_id INT NULL COMMENT 'ID del tercero relacionado con el documento (emisor o receptor)',
    entity_type VARCHAR(50) NULL COMMENT 'Tipo de entidad relacionada (customer, supplier, etc.)',
    entity_id INT NULL COMMENT 'ID de la entidad relacionada según entity_type',
    entity_name VARCHAR(150) NULL COMMENT 'Nombre de la entidad relacionada (redundante para consultas rápidas)',
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
    uploaded_by INT NOT NULL COMMENT 'ID del usuario que subió o registró el documento',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de creación del registro',
    updated_at TIMESTAMP NULL COMMENT 'Fecha y hora de última actualización',
    approved_at DATETIME NULL COMMENT 'Fecha y hora de aprobación del documento',
    approved_by INT NULL COMMENT 'ID del usuario que aprobó el documento',
    FOREIGN KEY (document_type_id) REFERENCES legal_document_types(id) COMMENT 'Relación con el tipo de documento legal',
    FOREIGN KEY (third_party_id) REFERENCES third_parties(id) COMMENT 'Relación con el tercero',
    FOREIGN KEY (currency_id) REFERENCES currencies(id) COMMENT 'Relación con la moneda',
    FOREIGN KEY (fiscal_period_id) REFERENCES fiscal_periods(id) COMMENT 'Relación con el período fiscal',
    FOREIGN KEY (uploaded_by) REFERENCES users(id) COMMENT 'Relación con el usuario que registró el documento',
    FOREIGN KEY (approved_by) REFERENCES users(id) COMMENT 'Relación con el usuario que aprobó',
    UNIQUE KEY unique_type_number (document_type_id, document_number) COMMENT 'Restricción para evitar documentos duplicados'
) COMMENT 'Tabla para almacenar documentos legales como facturas, recibos, contratos, etc.';

-- Tabla para detalles/líneas de documentos legales
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

-- Tabla para historial de estados de documentos
CREATE TABLE legal_document_status_history (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'Identificador único del registro de historial',
    document_id INT NOT NULL COMMENT 'ID del documento legal al que pertenece el historial',
    previous_status ENUM('ACTIVE', 'CANCELLED') NOT NULL COMMENT 'Estado anterior del documento',
    new_status ENUM('ACTIVE', 'CANCELLED') NOT NULL COMMENT 'Nuevo estado del documento',
    user_id INT NOT NULL COMMENT 'ID del usuario que realizó el cambio de estado',
    comments TEXT COMMENT 'Comentarios o justificación del cambio de estado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora en que se realizó el cambio de estado',
    FOREIGN KEY (document_id) REFERENCES legal_documents(id) COMMENT 'Relación con el documento legal',
    FOREIGN KEY (user_id) REFERENCES users(id) COMMENT 'Relación con el usuario que realizó el cambio'
) COMMENT 'Tabla para registrar el historial de cambios de estado de los documentos legales';

-- Tabla de relación entre documentos legales y comprobantes contables
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

/*
EXPLICACIÓN DE LAS RELACIONES:

1. Relación principal Documento-Detalles:
   - Un documento legal (legal_documents) puede tener múltiples líneas de detalle (legal_document_details).
   - Cada línea de detalle pertenece a un único documento.
   - La relación es 1:N (un documento, muchos detalles).
   - Los detalles se eliminan automáticamente cuando se elimina el documento (ON DELETE CASCADE).

2. Relación con Tipos de Documento:
   - Cada documento legal está clasificado según su tipo (legal_document_types).
   - Esta relación permite categorizar los documentos y aplicar reglas diferentes según su naturaleza.

3. Relación con Comprobantes Contables:
   - Un documento legal puede estar asociado a uno o más comprobantes contables.
   - Esta relación es muchos a muchos mediante la tabla legal_document_vouchers.
   - Permite vincular documentos externos (facturas, etc.) con comprobantes internos del sistema.

4. Historial de Estados:
   - Se mantiene un registro histórico de los cambios de estado de los documentos.
   - Cada cambio incluye quién lo realizó, cuándo, y los comentarios justificativos.

5. Relación con Plan de Cuentas:
   - Cada línea de detalle puede estar asociada a una cuenta contable.
   - Esto facilita la generación automática de asientos contables a partir del documento.

Este modelo permite un flujo de trabajo donde:
1. Se registra un documento legal en el sistema (con sus detalles).
2. Se puede generar uno o más comprobantes contables a partir del documento.
3. Los comprobantes generan asientos contables.
4. El documento puede ser anulado si es necesario, manteniendo el historial.
*/ 