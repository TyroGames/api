-- Script para insertar datos de ejemplo de comprobantes contables

-- Asegúrate que las siguientes tablas ya tengan datos:
-- - accounting_voucher_types
-- - fiscal_periods
-- - third_parties
-- - chart_of_accounts
-- - users
-- - currencies

-- EJEMPLO 1: Comprobante de Recibo de Caja (RC) - Pago de un cliente
INSERT INTO accounting_vouchers (
    voucher_type_id, consecutive, voucher_number, date, description, 
    concept, reference, fiscal_period_id, third_party_id, 
    total_amount, total_debit, total_credit, 
    currency_id, exchange_rate, entity_type, entity_id, entity_name, 
    status, created_by, created_at
) VALUES (
    1, -- RC - Recibo de Caja
    1, -- Primer consecutivo
    'RC-001', -- Número completo
    '2024-03-15', -- Fecha
    'Recibo de caja por pago de factura F-1234', -- Descripción
    'Pago de cliente en efectivo', -- Concepto
    'F-1234', -- Referencia (número de factura)
    14, -- Período de Marzo 2024
    1, -- ID del tercero (CLI001 en datos_ejemplo.sql)
    1190000.00, -- Monto total
    1190000.00, -- Total débitos
    1190000.00, -- Total créditos
    1, -- Moneda COP
    1.00, -- Tasa de cambio
    'customer', -- Tipo de entidad
    1, -- ID de la entidad
    'Comercializadora Los Andes S.A.S.', -- Nombre de la entidad
    'APPROVED', -- Estado
    1, -- Usuario creador
    NOW() -- Fecha de creación
);

-- Líneas del comprobante RC-001
INSERT INTO voucher_lines (
    voucher_id, line_number, account_id, description, debit_amount, credit_amount, reference
) VALUES
(1, 1, 1105, 'Ingreso en efectivo por pago factura F-1234', 1190000.00, 0.00, 'F-1234'), -- Débito a Caja
(1, 2, 1305, 'Cancelación cuenta por cobrar factura F-1234', 0.00, 1000000.00, 'F-1234'), -- Crédito a Clientes (valor sin IVA)
(1, 3, 2408, 'IVA generado en factura F-1234', 0.00, 190000.00, 'F-1234'); -- Crédito a IVA por pagar

-- EJEMPLO 2: Comprobante de Egreso (CE) - Pago a un proveedor
INSERT INTO accounting_vouchers (
    voucher_type_id, consecutive, voucher_number, date, description, 
    concept, reference, fiscal_period_id, third_party_id, 
    total_amount, total_debit, total_credit, 
    currency_id, exchange_rate, entity_type, entity_id, entity_name, 
    status, created_by, created_at
) VALUES (
    2, -- CE - Comprobante de Egreso
    1, -- Primer consecutivo
    'CE-001', -- Número completo
    '2024-03-18', -- Fecha
    'Pago a proveedor por compra de insumos', -- Descripción
    'Pago factura proveedor', -- Concepto
    'FC-567', -- Referencia (número de factura del proveedor)
    14, -- Período de Marzo 2024
    4, -- ID del tercero (PRV001 en datos_ejemplo.sql)
    595000.00, -- Monto total
    595000.00, -- Total débitos
    595000.00, -- Total créditos
    1, -- Moneda COP
    1.00, -- Tasa de cambio
    'supplier', -- Tipo de entidad
    4, -- ID de la entidad
    'Suministros Técnicos Industriales Ltda.', -- Nombre de la entidad
    'APPROVED', -- Estado
    1, -- Usuario creador
    NOW() -- Fecha de creación
);

-- Líneas del comprobante CE-001
INSERT INTO voucher_lines (
    voucher_id, line_number, account_id, description, debit_amount, credit_amount, reference
) VALUES
(2, 1, 2205, 'Pago factura proveedor FC-567', 595000.00, 0.00, 'FC-567'), -- Débito a Proveedores Nacionales
(2, 2, 1110, 'Pago mediante cheque #1234', 0.00, 595000.00, 'CHQ-1234'); -- Crédito a Bancos

-- EJEMPLO 3: Comprobante de Diario (CD) - Ajuste contable
INSERT INTO accounting_vouchers (
    voucher_type_id, consecutive, voucher_number, date, description, 
    concept, reference, fiscal_period_id, 
    total_amount, total_debit, total_credit, 
    currency_id, exchange_rate, 
    status, created_by, created_at
) VALUES (
    6, -- CD - Comprobante de Diario
    1, -- Primer consecutivo
    'CD-001', -- Número completo
    '2024-03-25', -- Fecha
    'Ajuste de depreciación mensual', -- Descripción
    'Registro depreciación marzo 2024', -- Concepto
    'DEP-03-2024', -- Referencia interna
    14, -- Período de Marzo 2024
    150000.00, -- Monto total
    150000.00, -- Total débitos
    150000.00, -- Total créditos
    1, -- Moneda COP
    1.00, -- Tasa de cambio
    'APPROVED', -- Estado
    2, -- Usuario creador (contador)
    NOW() -- Fecha de creación
);

-- Líneas del comprobante CD-001
INSERT INTO voucher_lines (
    voucher_id, line_number, account_id, description, debit_amount, credit_amount, reference
) VALUES
(3, 1, 5160, 'Gasto depreciación marzo 2024 - Equipos de oficina', 80000.00, 0.00, 'DEP-03-2024'), -- Débito a Depreciaciones
(3, 2, 5160, 'Gasto depreciación marzo 2024 - Vehículos', 70000.00, 0.00, 'DEP-03-2024'), -- Débito a Depreciaciones
(3, 3, 1592, 'Depreciación acumulada marzo 2024', 0.00, 150000.00, 'DEP-03-2024'); -- Crédito a Depreciación Acumulada

-- EJEMPLO 4: Nota Débito (ND) - Ajuste a cliente
INSERT INTO accounting_vouchers (
    voucher_type_id, consecutive, voucher_number, date, description, 
    concept, reference, fiscal_period_id, third_party_id, 
    total_amount, total_debit, total_credit, 
    currency_id, exchange_rate, entity_type, entity_id, entity_name, 
    status, created_by, created_at
) VALUES (
    3, -- ND - Nota Débito
    1, -- Primer consecutivo
    'ND-001', -- Número completo
    '2024-03-27', -- Fecha
    'Ajuste por intereses de mora', -- Descripción
    'Intereses por pago extemporáneo', -- Concepto
    'F-9876', -- Referencia (número de factura)
    14, -- Período de Marzo 2024
    2, -- ID del tercero (CLI002 en datos_ejemplo.sql)
    25000.00, -- Monto total
    25000.00, -- Total débitos
    25000.00, -- Total créditos
    1, -- Moneda COP
    1.00, -- Tasa de cambio
    'customer', -- Tipo de entidad
    2, -- ID de la entidad
    'Industrias Metálicas del Norte S.A.', -- Nombre de la entidad
    'APPROVED', -- Estado
    1, -- Usuario creador
    NOW() -- Fecha de creación
);

-- Líneas del comprobante ND-001
INSERT INTO voucher_lines (
    voucher_id, line_number, account_id, description, debit_amount, credit_amount, reference
) VALUES
(4, 1, 1305, 'Cargo por intereses de mora al cliente', 25000.00, 0.00, 'F-9876'), -- Débito a Clientes
(4, 2, 4210, 'Ingreso por intereses de mora', 0.00, 25000.00, 'F-9876'); -- Crédito a Ingresos Financieros

-- EJEMPLO 5: Comprobante de Ingreso (CI) - Venta al contado
INSERT INTO accounting_vouchers (
    voucher_type_id, consecutive, voucher_number, date, description, 
    concept, reference, fiscal_period_id, third_party_id, 
    total_amount, total_debit, total_credit, 
    currency_id, exchange_rate, entity_type, entity_id, entity_name, 
    status, created_by, created_at
) VALUES (
    5, -- CI - Comprobante de Ingreso
    1, -- Primer consecutivo
    'CI-001', -- Número completo
    '2024-03-30', -- Fecha
    'Venta al contado con factura F-5678', -- Descripción
    'Venta de mercancía', -- Concepto
    'F-5678', -- Referencia (número de factura)
    14, -- Período de Marzo 2024
    3, -- ID del tercero (CLI003 en datos_ejemplo.sql)
    297500.00, -- Monto total
    297500.00, -- Total débitos
    297500.00, -- Total créditos
    1, -- Moneda COP
    1.00, -- Tasa de cambio
    'customer', -- Tipo de entidad
    3, -- ID de la entidad
    'Roberto Gómez Bolaños', -- Nombre de la entidad
    'APPROVED', -- Estado
    1, -- Usuario creador
    NOW() -- Fecha de creación
);

-- Líneas del comprobante CI-001
INSERT INTO voucher_lines (
    voucher_id, line_number, account_id, description, debit_amount, credit_amount, reference
) VALUES
(5, 1, 1105, 'Ingreso en efectivo por venta al contado', 297500.00, 0.00, 'F-5678'), -- Débito a Caja
(5, 2, 4135, 'Venta de mercancía al contado', 0.00, 250000.00, 'F-5678'), -- Crédito a Ingresos por Ventas
(5, 3, 2408, 'IVA generado en venta', 0.00, 47500.00, 'F-5678'), -- Crédito a IVA por pagar
(5, 4, 6135, 'Costo de la mercancía vendida', 150000.00, 0.00, 'F-5678'), -- Débito a Costo de Ventas
(5, 5, 1435, 'Descarga de inventario', 0.00, 150000.00, 'F-5678'); -- Crédito a Inventario de Mercancías

-- Nota: Estos son ejemplos simplificados. En un entorno real:
-- 1. Los IDs (voucher_type_id, third_party_id, fiscal_period_id, etc.) deben coincidir con los existentes en la base de datos
-- 2. Las cuentas contables (account_id) deben existir en la tabla chart_of_accounts
-- 3. Se recomienda usar procedimientos almacenados o transacciones para garantizar la integridad
-- 4. En un sistema real, los totales (total_amount, total_debit, total_credit) se calcularían automáticamente
-- 5. Los números de comprobante podrían incluir prefijos, año, mes, etc. según la configuración del sistema 