-- Script para insertar datos de ejemplo para pruebas del sistema

-- Insertar monedas
INSERT INTO currencies (code, name, symbol, decimal_places, is_base_currency, exchange_rate, is_active) VALUES
('COP', 'Peso Colombiano', '$', 2, true, 1.00, true),
('USD', 'Dólar Estadounidense', 'US$', 2, false, 3950.00, true),
('EUR', 'Euro', '€', 2, false, 4200.00, true),
('GBP', 'Libra Esterlina', '£', 2, false, 4950.00, true),
('MXN', 'Peso Mexicano', 'MX$', 2, false, 210.00, true);

-- Insertar usuarios de ejemplo
INSERT INTO users (username, password, email, full_name, is_active, role_id) VALUES
('admin', '$2a$10$XFE/ebCU3mGrw.msCLUF0.S7s/KQSFpK/SrU9yBFIRVJl2EVg2Twe', 'admin@ejemplo.com', 'Administrador Sistema', true, 1), -- Contraseña: admin123
('contador', '$2a$10$uG5EGCnm7o2eKj2lfXHQR.lGGn8jDnDU9t92CnLWI/xt5C9Dgrcfu', 'contador@ejemplo.com', 'Contador Principal', true, 2), -- Contraseña: conta123
('auxiliar', '$2a$10$wWjERM9v3XcReMz8wL46Fuv7nI6v5NpXsQTYPi4SXENYxwz1pf4c2', 'auxiliar@ejemplo.com', 'Auxiliar Contable', true, 3); -- Contraseña: auxi123

-- Insertar terceros de ejemplo
INSERT INTO third_parties (
    code, identification_type, identification_number, verification_digit, 
    name, commercial_name, address, city, state, country, 
    postal_code, phone, mobile, email, contact_person, website, 
    tax_regime, is_vat_responsible, is_withholding_agent, 
    is_customer, is_supplier, is_creditor, is_employee, is_shareholder, is_other, 
    notes, credit_limit, payment_terms, is_active, created_by
) VALUES
-- Clientes
('CLI001', 'NIT', '900123456', '8', 'Comercializadora Los Andes S.A.S.', 'Comercializadora Andes', 
'Calle 85 # 50-20', 'Bogotá', 'Cundinamarca', 'Colombia', '110221', '6017654321', '3101234567', 
'info@losandes.com', 'Ana Martínez', 'www.losandes.com', 'Común', true, false, 
true, false, false, false, false, false, 'Cliente mayorista de productos importados', 
25000000.00, 30, true, 1),

('CLI002', 'NIT', '800987654', '1', 'Industrias Metálicas del Norte S.A.', 'Metalnorte', 
'Carrera 54 # 12-30', 'Medellín', 'Antioquia', 'Colombia', '050001', '6043216789', '3151234567', 
'ventas@metalnorte.com.co', 'Carlos Restrepo', 'www.metalnorte.com.co', 'Gran Contribuyente', true, true, 
true, false, false, false, false, false, 'Cliente industrial con alto volumen de compras', 
50000000.00, 45, true, 1),

('CLI003', 'CC', '79876543', NULL, 'Roberto Gómez Bolaños', NULL, 
'Avenida Caracas # 45-12', 'Bogotá', 'Cundinamarca', 'Colombia', '110231', '6019876543', '3209876543', 
'robertogomez@email.com', NULL, NULL, 'Simplificado', false, false, 
true, false, false, false, false, false, 'Cliente persona natural recurrente', 
5000000.00, 15, true, 1),

-- Proveedores
('PRV001', 'NIT', '830456789', '2', 'Suministros Técnicos Industriales Ltda.', 'SumiTec', 
'Calle 13 # 27-45', 'Cali', 'Valle del Cauca', 'Colombia', '760001', '6027654321', '3008765432', 
'compras@sumitec.com', 'Patricia Londoño', 'www.sumitec.com', 'Común', true, false, 
false, true, false, false, false, false, 'Proveedor de insumos técnicos', 
0.00, 0, true, 1),

('PRV002', 'NIT', '860123456', '7', 'Papelería Mundial S.A.', 'Mundial Papelería', 
'Carrera 15 # 78-56', 'Bogotá', 'Cundinamarca', 'Colombia', '110221', '6013456789', '3112345678', 
'ventas@papeleriamundial.com', 'Javier Ortiz', 'www.papeleriamundial.com', 'Común', true, false, 
false, true, false, false, false, false, 'Proveedor de suministros de oficina', 
0.00, 0, true, 1),

-- Empleados
('EMP001', 'CC', '52123456', NULL, 'María Eugenia Rojas Díaz', NULL, 
'Calle 45 # 67-89', 'Bogotá', 'Cundinamarca', 'Colombia', '110221', '6012345678', '3134567890', 
'maria.rojas@empresa.com', NULL, NULL, 'No Responsable', false, false, 
false, false, false, true, false, false, 'Gerente Administrativa', 
0.00, 0, true, 1),

('EMP002', 'CC', '80123456', NULL, 'Jorge Eduardo Torres Pérez', NULL, 
'Carrera 78 # 23-45', 'Bogotá', 'Cundinamarca', 'Colombia', '110231', '6017890123', '3157890123', 
'jorge.torres@empresa.com', NULL, NULL, 'No Responsable', false, false, 
false, false, false, true, false, false, 'Contador', 
0.00, 0, true, 1),

-- Otros
('OTR001', 'NIT', '899999999', '7', 'DIAN - Dirección de Impuestos y Aduanas Nacionales', 'DIAN', 
'Carrera 8 # 6-64', 'Bogotá', 'Cundinamarca', 'Colombia', '110321', '6013556600', NULL, 
'contactenos@dian.gov.co', NULL, 'www.dian.gov.co', 'No Responsable', false, false, 
false, false, true, false, false, false, 'Entidad de impuestos', 
0.00, 0, true, 1),

('OTR002', 'NIT', '900444777', '1', 'Seguros Bolívar S.A.', 'Seguros Bolívar', 
'Avenida El Dorado # 68B-31', 'Bogotá', 'Cundinamarca', 'Colombia', '110231', '6013122122', NULL, 
'servicioalcliente@segurosbolivar.com', 'Departamento de Seguros', 'www.segurosbolivar.com', 'Gran Contribuyente', true, true, 
false, true, false, false, false, false, 'Proveedor de seguros y pólizas', 
0.00, 0, true, 1);

-- Insertar datos de ejemplo para los centros de costo
INSERT INTO cost_centers (code, name, description, parent_id, is_active, created_by) VALUES
('ADM', 'Administración', 'Centro de costo para gastos administrativos', NULL, true, 1),
('VEN', 'Ventas', 'Centro de costo para gastos de ventas y mercadeo', NULL, true, 1),
('OPE', 'Operaciones', 'Centro de costo para operaciones y producción', NULL, true, 1),
('FIN', 'Financiero', 'Centro de costo para área financiera', NULL, true, 1),
('ADM-GER', 'Gerencia', 'Gerencia general y directivos', 1, true, 1),
('ADM-RH', 'Recursos Humanos', 'Departamento de recursos humanos', 1, true, 1),
('VEN-NAC', 'Ventas Nacionales', 'Ventas en territorio nacional', 2, true, 1),
('VEN-INT', 'Ventas Internacionales', 'Exportaciones y ventas al exterior', 2, true, 1),
('OPE-BOD', 'Bodega', 'Almacenamiento y logística', 3, true, 1),
('OPE-PRD', 'Producción', 'Líneas de producción y manufactura', 3, true, 1),
('FIN-CON', 'Contabilidad', 'Departamento contable', 4, true, 1),
('FIN-TES', 'Tesorería', 'Gestión de pagos y recaudos', 4, true, 1);

-- Insertar tipos de impuestos
INSERT INTO tax_types (name, code, description, is_percentage, rate, applies_to, accounting_account_id, is_active, created_by) VALUES
('IVA', 'IVA', 'Impuesto al Valor Agregado', true, 19.00, 'both', 2408, true, 1),
('IVA Reducido', 'IVA-R', 'IVA tarifa reducida', true, 5.00, 'both', 2408, true, 1),
('Retención en la Fuente', 'RFTE', 'Retención en la fuente por servicios', true, 4.00, 'both', 2365, true, 1),
('Retención IVA', 'RIVA', 'Retención de IVA', true, 15.00, 'both', 2367, true, 1),
('Retención ICA', 'RICA', 'Retención de ICA', true, 0.69, 'both', 2368, true, 1),
('IVA Excluido', 'IVA-E', 'Operaciones excluidas de IVA', false, 0.00, 'both', NULL, true, 1),
('Exento de IVA', 'IVA-EX', 'Operaciones exentas de IVA', false, 0.00, 'both', NULL, true, 1);

-- Insertar tarifas de impuestos
INSERT INTO tax_rates (tax_type_id, rate, name, effective_date, end_date, is_active, created_by) VALUES
(1, 19.00, 'IVA General 19%', '2017-01-01', NULL, true, 1),
(2, 5.00, 'IVA Reducido 5%', '2017-01-01', NULL, true, 1),
(3, 4.00, 'Retención Servicios Generales 4%', '2019-01-01', NULL, true, 1),
(3, 6.00, 'Retención Servicios Profesionales 6%', '2019-01-01', NULL, true, 1),
(3, 1.00, 'Retención Compras 1%', '2019-01-01', NULL, true, 1),
(3, 2.00, 'Retención Honorarios 2%', '2019-01-01', NULL, true, 1),
(4, 15.00, 'Retención IVA 15%', '2017-01-01', NULL, true, 1),
(5, 0.69, 'Retención ICA Servicios 0.69%', '2020-01-01', NULL, true, 1),
(5, 1.38, 'Retención ICA Comercial 1.38%', '2020-01-01', NULL, true, 1);

-- Notas sobre los datos insertados:
-- 1. Las contraseñas de usuarios están hasheadas con bcrypt
-- 2. Los terceros incluyen clientes, proveedores, empleados y otros tipos
-- 3. Para completar el ambiente de prueba, asegurate de tener datos en las tablas:
--    - roles
--    - fiscal_periods
--    - account_types
--    - chart_of_accounts
-- 4. Algunos IDs se referencian directamente (como account_type_id=1) y deben existir previamente 