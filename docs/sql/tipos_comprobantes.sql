-- Script para insertar datos iniciales en las tablas de tipos de comprobantes

-- Insertar naturalezas de comprobantes contables
INSERT INTO accounting_voucher_natures (code, name, accounting_effect, financial_statement_section) VALUES
('ING', 'Ingreso', 'increase', 'Income Statement'),
('EGR', 'Egreso', 'decrease', 'Income Statement'),
('TRA', 'Traslado', 'increase', 'Balance Sheet'),
('AJU', 'Ajuste', 'increase', 'Balance Sheet'),
('CIERRE', 'Cierre', 'decrease', 'Balance Sheet'),
('APERT', 'Apertura', 'increase', 'Balance Sheet');

-- Insertar tipos de comprobantes contables
INSERT INTO accounting_voucher_types (code, name, description, nature_id, consecutive, print_format, requires_third_party, requires_cost_center, requires_reference, is_active) VALUES
('RC', 'Recibo de Caja', 'Comprobante para registrar ingresos en efectivo o cheques', 1, 1, 'formato_rc.html', true, false, true, true),
('CE', 'Comprobante de Egreso', 'Comprobante para registrar pagos o desembolsos', 2, 1, 'formato_ce.html', true, false, true, true),
('ND', 'Nota Débito', 'Comprobante para registrar ajustes que aumentan saldos', 1, 1, 'formato_nd.html', true, false, true, true),
('NC', 'Nota Crédito', 'Comprobante para registrar ajustes que disminuyen saldos', 2, 1, 'formato_nc.html', true, false, true, true),
('CI', 'Comprobante de Ingreso', 'Comprobante para registrar ingresos generales', 1, 1, 'formato_ci.html', true, false, false, true),
('CD', 'Comprobante de Diario', 'Comprobante para ajustes y movimientos varios', 3, 1, 'formato_cd.html', false, false, false, true),
('CA', 'Comprobante de Apertura', 'Comprobante para apertura de períodos contables', 6, 1, 'formato_ca.html', false, false, false, true),
('CC', 'Comprobante de Cierre', 'Comprobante para cierre de períodos contables', 5, 1, 'formato_cc.html', false, false, false, true);

-- Comentarios sobre los tipos de comprobantes:
-- RC (Recibo de Caja): Registra entradas de dinero, pagos de clientes, etc.
-- CE (Comprobante de Egreso): Registra salidas de dinero, pagos a proveedores, etc.
-- ND (Nota Débito): Registra aumentos en cuentas por cobrar o disminuciones en cuentas por pagar
-- NC (Nota Crédito): Registra disminuciones en cuentas por cobrar o aumentos en cuentas por pagar
-- CI (Comprobante de Ingreso): Similar a RC pero más general
-- CD (Comprobante de Diario): Para ajustes, reclasificaciones y movimientos internos
-- CA (Comprobante de Apertura): Para iniciar saldos al comienzo de un período contable
-- CC (Comprobante de Cierre): Para cerrar cuentas temporales al final del período 