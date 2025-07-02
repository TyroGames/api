-- Script para insertar datos iniciales en las tablas de tipos de documentos legales

-- Insertar tipos de documentos legales
INSERT INTO legal_document_types (code, name, description, requires_value, requires_file, is_active) VALUES
('FAC', 'Factura de Venta', 'Documento para registrar ventas de bienes o servicios', true, true, true),
('FCP', 'Factura de Compra', 'Documento para registrar compras de bienes o servicios', true, true, true),
('NCV', 'Nota Crédito de Venta', 'Documento para registrar devoluciones o descuentos en ventas', true, false, true),
('NCC', 'Nota Crédito de Compra', 'Documento para registrar devoluciones o descuentos en compras', true, false, true),
('NDV', 'Nota Débito de Venta', 'Documento para registrar cargos adicionales en ventas', true, false, true),
('NDC', 'Nota Débito de Compra', 'Documento para registrar cargos adicionales en compras', true, false, true),
('REM', 'Remisión', 'Documento para el envío de mercancías sin valor comercial', false, false, true),
('COT', 'Cotización', 'Documento para presupuestar bienes o servicios', true, false, true),
('ORD', 'Orden de Compra', 'Documento para solicitar compra de bienes o servicios', true, false, true),
('CNT', 'Contrato', 'Documento legal que establece acuerdos entre partes', false, true, true),
('RCI', 'Recibo de Caja', 'Documento que certifica recepción de pagos', true, false, true),
('CHQ', 'Cheque', 'Documento bancario para realizar pagos', true, true, true),
('CRE', 'Comprobante de Retención', 'Documento que certifica retenciones aplicadas', true, false, true),
('PGR', 'Pagaré', 'Documento que representa promesa de pago', true, true, true),
('LCB', 'Letra de Cambio', 'Documento que representa orden de pago', true, true, true),
('NOM', 'Nómina', 'Documento para registro de pagos a empleados', true, false, true);

-- Comentarios sobre los tipos de documentos:
-- FAC (Factura de Venta): Principal documento legal para ventas
-- FCP (Factura de Compra): Principal documento legal para compras
-- NCV/NCC (Notas Crédito): Para anular o reducir valores de facturas
-- NDV/NDC (Notas Débito): Para aumentar valores de facturas
-- REM (Remisión): Para envío de mercancías sin transferencia de propiedad
-- COT (Cotización): Para ofrecer precios antes de la venta
-- ORD (Orden de Compra): Para autorizar compras a proveedores
-- CNT (Contrato): Para establecer términos legales de operaciones
-- RCI (Recibo de Caja): Para dejar constancia de pagos recibidos
-- CHQ (Cheque): Para pagos bancarios
-- CRE (Comprobante de Retención): Para certificar retenciones fiscales
-- PGR/LCB (Pagaré/Letra): Para documentos comerciales de deuda 