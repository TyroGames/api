-- Script para insertar datos iniciales en las tablas relacionadas con el catálogo de cuentas

-- Insertar tipos de cuentas contables
INSERT INTO account_types (id, name, description, is_active) VALUES
(1, 'Activo', 'Recursos controlados por la entidad como resultado de eventos pasados', true),
(2, 'Pasivo', 'Obligaciones presentes de la entidad surgidas de eventos pasados', true),
(3, 'Patrimonio', 'Parte residual de los activos menos los pasivos', true),
(4, 'Ingreso', 'Incrementos en beneficios económicos durante el período contable', true),
(5, 'Gasto', 'Disminuciones en beneficios económicos durante el período contable', true),
(6, 'Costo', 'Erogaciones asociadas directamente a la producción o adquisición de bienes y servicios', true),
(7, 'Orden Deudora', 'Cuentas de control para registrar operaciones con terceros que no afectan la situación financiera', true),
(8, 'Orden Acreedora', 'Contrapartida de las cuentas de orden deudoras', true);

-- Insertar estructura básica del catálogo de cuentas (nivel 1 y 2)
INSERT INTO chart_of_accounts (id, code, name, description, account_type_id, parent_account_id, is_active, allows_entries, level, balance_type, created_at, created_by) VALUES
-- Cuentas de nivel 1 (Clases)
(1, '1', 'ACTIVOS', 'Recursos controlados por la entidad', 1, NULL, true, false, 1, 'debit', NOW(), 1),
(2, '2', 'PASIVOS', 'Obligaciones presentes de la entidad', 2, NULL, true, false, 1, 'credit', NOW(), 1),
(3, '3', 'PATRIMONIO', 'Parte residual de los activos menos los pasivos', 3, NULL, true, false, 1, 'credit', NOW(), 1),
(4, '4', 'INGRESOS', 'Incrementos en beneficios económicos', 4, NULL, true, false, 1, 'credit', NOW(), 1),
(5, '5', 'GASTOS', 'Disminuciones en beneficios económicos', 5, NULL, true, false, 1, 'debit', NOW(), 1),
(6, '6', 'COSTOS', 'Erogaciones directamente asociadas a la producción', 6, NULL, true, false, 1, 'debit', NOW(), 1),
(7, '7', 'COSTOS DE PRODUCCIÓN', 'Acumulación de costos para productos manufacturados', 6, NULL, true, false, 1, 'debit', NOW(), 1),
(8, '8', 'CUENTAS DE ORDEN DEUDORAS', 'Cuentas de control deudoras', 7, NULL, true, false, 1, 'debit', NOW(), 1),
(9, '9', 'CUENTAS DE ORDEN ACREEDORAS', 'Cuentas de control acreedoras', 8, NULL, true, false, 1, 'credit', NOW(), 1),

-- Cuentas de nivel 2 (Grupos) para ACTIVOS
(11, '11', 'EFECTIVO Y EQUIVALENTES', 'Recursos de liquidez inmediata', 1, 1, true, false, 2, 'debit', NOW(), 1),
(12, '12', 'INVERSIONES', 'Inversiones y otros activos financieros', 1, 1, true, false, 2, 'debit', NOW(), 1),
(13, '13', 'DEUDORES', 'Derechos de cobro de la entidad', 1, 1, true, false, 2, 'debit', NOW(), 1),
(14, '14', 'INVENTARIOS', 'Bienes mantenidos para la venta o consumo', 1, 1, true, false, 2, 'debit', NOW(), 1),
(15, '15', 'PROPIEDADES, PLANTA Y EQUIPO', 'Activos tangibles utilizados por más de un período', 1, 1, true, false, 2, 'debit', NOW(), 1),
(16, '16', 'INTANGIBLES', 'Activos sin sustancia física identificables', 1, 1, true, false, 2, 'debit', NOW(), 1),
(17, '17', 'DIFERIDOS', 'Gastos pagados por anticipado', 1, 1, true, false, 2, 'debit', NOW(), 1),
(18, '18', 'OTROS ACTIVOS', 'Activos no clasificados en otras categorías', 1, 1, true, false, 2, 'debit', NOW(), 1),
(19, '19', 'VALORIZACIONES', 'Valorización de activos', 1, 1, true, false, 2, 'debit', NOW(), 1),

-- Cuentas de nivel 2 (Grupos) para PASIVOS
(21, '21', 'OBLIGACIONES FINANCIERAS', 'Compromisos con entidades financieras', 2, 2, true, false, 2, 'credit', NOW(), 1),
(22, '22', 'PROVEEDORES', 'Obligaciones por bienes o servicios recibidos', 2, 2, true, false, 2, 'credit', NOW(), 1),
(23, '23', 'CUENTAS POR PAGAR', 'Obligaciones contraídas diferentes a proveedores', 2, 2, true, false, 2, 'credit', NOW(), 1),
(24, '24', 'IMPUESTOS POR PAGAR', 'Obligaciones tributarias pendientes', 2, 2, true, false, 2, 'credit', NOW(), 1),
(25, '25', 'OBLIGACIONES LABORALES', 'Compromisos con empleados', 2, 2, true, false, 2, 'credit', NOW(), 1),
(26, '26', 'PASIVOS ESTIMADOS Y PROVISIONES', 'Obligaciones probables o estimadas', 2, 2, true, false, 2, 'credit', NOW(), 1),
(27, '27', 'DIFERIDOS', 'Ingresos recibidos por anticipado', 2, 2, true, false, 2, 'credit', NOW(), 1),
(28, '28', 'OTROS PASIVOS', 'Pasivos no clasificados en otras categorías', 2, 2, true, false, 2, 'credit', NOW(), 1),
(29, '29', 'BONOS Y PAPELES COMERCIALES', 'Títulos de deuda emitidos', 2, 2, true, false, 2, 'credit', NOW(), 1),

-- Cuentas de nivel 2 (Grupos) para PATRIMONIO
(31, '31', 'CAPITAL SOCIAL', 'Aportes de los propietarios', 3, 3, true, false, 2, 'credit', NOW(), 1),
(32, '32', 'SUPERÁVIT DE CAPITAL', 'Valores adicionales al capital', 3, 3, true, false, 2, 'credit', NOW(), 1),
(33, '33', 'RESERVAS', 'Apropiaciones de utilidades', 3, 3, true, false, 2, 'credit', NOW(), 1),
(34, '34', 'REVALORIZACIÓN DEL PATRIMONIO', 'Ajustes por inflación al patrimonio', 3, 3, true, false, 2, 'credit', NOW(), 1),
(35, '35', 'RESULTADOS DEL EJERCICIO', 'Utilidad o pérdida del período actual', 3, 3, true, false, 2, 'credit', NOW(), 1),
(36, '36', 'RESULTADOS DE EJERCICIOS ANTERIORES', 'Utilidades o pérdidas acumuladas', 3, 3, true, false, 2, 'credit', NOW(), 1),
(37, '37', 'SUPERÁVIT POR VALORIZACIONES', 'Contrapartida de valorizaciones', 3, 3, true, false, 2, 'credit', NOW(), 1),
(38, '38', 'SUPERÁVIT MÉTODO DE PARTICIPACIÓN', 'Variaciones patrimoniales en inversiones', 3, 3, true, false, 2, 'credit', NOW(), 1),

-- Cuentas de nivel 2 (Grupos) para INGRESOS
(41, '41', 'OPERACIONALES', 'Ingresos relacionados con la actividad principal', 4, 4, true, false, 2, 'credit', NOW(), 1),
(42, '42', 'NO OPERACIONALES', 'Ingresos diferentes a la actividad principal', 4, 4, true, false, 2, 'credit', NOW(), 1),
(43, '43', 'AJUSTES POR INFLACIÓN', 'Incrementos por ajustes inflacionarios', 4, 4, true, false, 2, 'credit', NOW(), 1),

-- Cuentas de nivel 2 (Grupos) para GASTOS
(51, '51', 'OPERACIONALES DE ADMINISTRACIÓN', 'Gastos relacionados con administración', 5, 5, true, false, 2, 'debit', NOW(), 1),
(52, '52', 'OPERACIONALES DE VENTAS', 'Gastos relacionados con ventas', 5, 5, true, false, 2, 'debit', NOW(), 1),
(53, '53', 'NO OPERACIONALES', 'Gastos no relacionados con la operación', 5, 5, true, false, 2, 'debit', NOW(), 1),
(54, '54', 'IMPUESTO DE RENTA', 'Gasto por impuesto sobre la renta', 5, 5, true, false, 2, 'debit', NOW(), 1),
(55, '55', 'AJUSTES POR INFLACIÓN', 'Gastos por ajustes inflacionarios', 5, 5, true, false, 2, 'debit', NOW(), 1),

-- Cuentas de nivel 2 (Grupos) para COSTOS
(61, '61', 'COSTO DE VENTAS', 'Costo de bienes o servicios vendidos', 6, 6, true, false, 2, 'debit', NOW(), 1),
(62, '62', 'COMPRAS', 'Compras de mercancías', 6, 6, true, false, 2, 'debit', NOW(), 1),
(63, '63', 'AJUSTES POR INFLACIÓN', 'Costos por ajustes inflacionarios', 6, 6, true, false, 2, 'debit', NOW(), 1);

-- Insertar algunas cuentas de nivel 3 (más detalladas) para uso común
INSERT INTO chart_of_accounts (code, name, description, account_type_id, parent_account_id, is_active, allows_entries, level, balance_type, created_at, created_by) VALUES
-- Cuentas de Efectivo
('1105', 'Caja', 'Efectivo de disponibilidad inmediata', 1, 11, true, true, 3, 'debit', NOW(), 1),
('1110', 'Bancos', 'Depósitos en instituciones financieras', 1, 11, true, false, 3, 'debit', NOW(), 1),
('1120', 'Cuentas de Ahorro', 'Depósitos en cuentas de ahorro', 1, 11, true, true, 3, 'debit', NOW(), 1),

-- Subcuentas de Bancos
('1110.01', 'Banco Nacional - Cuenta Corriente', 'Cuenta corriente principal', 1, 1110, true, true, 4, 'debit', NOW(), 1),
('1110.02', 'Banco Internacional - Cuenta Corriente', 'Cuenta corriente secundaria', 1, 1110, true, true, 4, 'debit', NOW(), 1),
('1120.01', 'Banco Nacional - Cuenta Ahorro', 'Cuenta de ahorro principal', 1, 1120, true, true, 4, 'debit', NOW(), 1),

-- Cuentas de Deudores
('1305', 'Clientes', 'Derechos de cobro por ventas a crédito', 1, 13, true, false, 3, 'debit', NOW(), 1),
('1330', 'Anticipos y Avances', 'Pagos anticipados a proveedores y contratistas', 1, 13, true, true, 3, 'debit', NOW(), 1),
('1355', 'Anticipo de Impuestos', 'Anticipos y retenciones de impuestos', 1, 13, true, true, 3, 'debit', NOW(), 1),

-- Cuentas de Inventarios
('1405', 'Materias Primas', 'Materiales para producción', 1, 14, true, true, 3, 'debit', NOW(), 1),
('1430', 'Productos Terminados', 'Artículos listos para venta', 1, 14, true, true, 3, 'debit', NOW(), 1),
('1435', 'Mercancías no Fabricadas por la Empresa', 'Artículos para reventa', 1, 14, true, true, 3, 'debit', NOW(), 1),

-- Cuentas de Proveedores y Obligaciones
('2205', 'Proveedores Nacionales', 'Obligaciones con proveedores locales', 2, 22, true, true, 3, 'credit', NOW(), 1),
('2305', 'Cuentas Corrientes Comerciales', 'Obligaciones comerciales diversas', 2, 23, true, true, 3, 'credit', NOW(), 1),
('2365', 'Retención en la Fuente', 'Valores retenidos por impuestos', 2, 23, true, true, 3, 'credit', NOW(), 1),
('2367', 'Impuesto a las Ventas Retenido', 'IVA retenido en transacciones', 2, 23, true, true, 3, 'credit', NOW(), 1),
('2368', 'Impuesto de Industria y Comercio Retenido', 'Retenciones de impuesto local', 2, 23, true, true, 3, 'credit', NOW(), 1),
('2408', 'Impuesto sobre las Ventas por Pagar', 'IVA generado pendiente de pago', 2, 24, true, true, 3, 'credit', NOW(), 1),

-- Cuentas de Patrimonio
('3105', 'Capital Suscrito y Pagado', 'Aportes efectivamente pagados', 3, 31, true, true, 3, 'credit', NOW(), 1),
('3305', 'Reservas Obligatorias', 'Reserva legal y otras obligatorias', 3, 33, true, true, 3, 'credit', NOW(), 1),
('3605', 'Utilidad del Ejercicio', 'Resultado positivo del período', 3, 36, true, true, 3, 'credit', NOW(), 1),
('3610', 'Pérdida del Ejercicio', 'Resultado negativo del período', 3, 36, true, true, 3, 'debit', NOW(), 1),

-- Cuentas de Ingresos
('4135', 'Comercio al por Mayor y Menor', 'Ventas de mercancías', 4, 41, true, true, 3, 'credit', NOW(), 1),
('4155', 'Servicios', 'Ingresos por prestación de servicios', 4, 41, true, true, 3, 'credit', NOW(), 1),
('4210', 'Financieros', 'Ingresos por intereses, diferencia en cambio, etc.', 4, 42, true, true, 3, 'credit', NOW(), 1),
('4250', 'Recuperaciones', 'Reembolsos y recuperaciones de gastos', 4, 42, true, true, 3, 'credit', NOW(), 1),

-- Cuentas de Gastos
('5105', 'Gastos de Personal', 'Sueldos, prestaciones y otros gastos laborales', 5, 51, true, true, 3, 'debit', NOW(), 1),
('5110', 'Honorarios', 'Servicios profesionales', 5, 51, true, true, 3, 'debit', NOW(), 1),
('5115', 'Impuestos', 'Tributos asumidos', 5, 51, true, true, 3, 'debit', NOW(), 1),
('5135', 'Servicios', 'Servicios contratados', 5, 51, true, true, 3, 'debit', NOW(), 1),
('5140', 'Gastos Legales', 'Gastos notariales, registro, etc.', 5, 51, true, true, 3, 'debit', NOW(), 1),
('5145', 'Mantenimiento y Reparaciones', 'Mantenimiento de bienes', 5, 51, true, true, 3, 'debit', NOW(), 1),
('5150', 'Adecuación e Instalación', 'Adecuaciones locativas', 5, 51, true, true, 3, 'debit', NOW(), 1),
('5155', 'Gastos de Viaje', 'Alojamiento, transporte, etc.', 5, 51, true, true, 3, 'debit', NOW(), 1),
('5160', 'Depreciaciones', 'Gasto por depreciación de activos', 5, 51, true, true, 3, 'debit', NOW(), 1),
('5165', 'Amortizaciones', 'Gasto por amortización de intangibles', 5, 51, true, true, 3, 'debit', NOW(), 1),
('5305', 'Financieros', 'Gastos bancarios, intereses, etc.', 5, 53, true, true, 3, 'debit', NOW(), 1),
('5315', 'Gastos Extraordinarios', 'Gastos no recurrentes', 5, 53, true, true, 3, 'debit', NOW(), 1),

-- Cuentas de Costos
('6135', 'Comercio al por Mayor y Menor', 'Costo de la mercancía vendida', 6, 61, true, true, 3, 'debit', NOW(), 1),
('6205', 'Compra de Mercancías', 'Adquisición de mercancías para reventa', 6, 62, true, true, 3, 'debit', NOW(), 1);

-- Nota: Este es un catálogo básico que debe ser ajustado según las necesidades específicas de la empresa,
-- actividad económica, marco regulatorio y plan contable que aplique en su jurisdicción. 