-- =============================================================================
-- DATOS INICIALES PARA EL MÓDULO DE CONTABILIDAD
-- =============================================================================

-- Insertar tipos de cuentas contables
INSERT INTO account_types (name, code, balance_sheet_section, income_statement_section)
VALUES 
('Activo Corriente', 'AC', 'asset', 'none'),
('Activo No Corriente', 'ANC', 'asset', 'none'),
('Pasivo Corriente', 'PC', 'liability', 'none'),
('Pasivo No Corriente', 'PNC', 'liability', 'none'),
('Patrimonio', 'PAT', 'equity', 'none'),
('Ingresos', 'ING', 'none', 'revenue'),
('Gastos Operativos', 'GOP', 'none', 'expense'),
('Gastos No Operativos', 'GNO', 'none', 'expense'),
('Costos', 'COS', 'none', 'expense');

-- Insertar cuentas contables básicas (plan de cuentas)
-- Activos
INSERT INTO chart_of_accounts (code, name, description, account_type_id, parent_account_id, is_active, allows_entries, level, balance_type, created_by)
VALUES
-- Nivel 1 - Activos
('1', 'ACTIVOS', 'Grupo principal de activos', 1, NULL, 1, 0, 1, 'debit', 1),

-- Nivel 2 - Activos Corrientes
('1.1', 'ACTIVOS CORRIENTES', 'Activos que se esperan realizar en el ciclo normal de operación', 1, 1, 1, 0, 2, 'debit', 1),

-- Nivel 3 - Efectivo y Equivalentes
('1.1.1', 'EFECTIVO Y EQUIVALENTES', 'Efectivo en caja y bancos', 1, 2, 1, 0, 3, 'debit', 1),

-- Nivel 4 - Cuentas específicas
('1.1.1.01', 'Caja General', 'Efectivo disponible en caja', 1, 3, 1, 1, 4, 'debit', 1),
('1.1.1.02', 'Caja Chica', 'Fondo de caja chica', 1, 3, 1, 1, 4, 'debit', 1),
('1.1.1.03', 'Banco Cuenta Corriente', 'Cuenta corriente bancaria principal', 1, 3, 1, 1, 4, 'debit', 1),
('1.1.1.04', 'Banco Cuenta Ahorro', 'Cuenta de ahorro bancaria', 1, 3, 1, 1, 4, 'debit', 1),
('1.1.1.05', 'Inversiones Temporales', 'Inversiones a corto plazo', 1, 3, 1, 1, 4, 'debit', 1),

-- Nivel 3 - Cuentas por Cobrar
('1.1.2', 'CUENTAS POR COBRAR', 'Derechos de cobro a terceros', 1, 2, 1, 0, 3, 'debit', 1),

-- Nivel 4 - Cuentas específicas
('1.1.2.01', 'Clientes', 'Cuentas por cobrar a clientes', 1, 8, 1, 1, 4, 'debit', 1),
('1.1.2.02', 'Documentos por Cobrar', 'Documentos formales pendientes de cobro', 1, 8, 1, 1, 4, 'debit', 1),
('1.1.2.03', 'Anticipos a Proveedores', 'Pagos anticipados a proveedores', 1, 8, 1, 1, 4, 'debit', 1),
('1.1.2.04', 'Empleados por Cobrar', 'Préstamos y anticipos a empleados', 1, 8, 1, 1, 4, 'debit', 1),
('1.1.2.05', 'Otras Cuentas por Cobrar', 'Otros conceptos por cobrar', 1, 8, 1, 1, 4, 'debit', 1),
('1.1.2.06', 'Provisión para Cuentas Incobrables', 'Estimación de cuentas incobrables', 1, 8, 1, 1, 4, 'credit', 1),

-- Nivel 2 - Pasivos
('2', 'PASIVOS', 'Grupo principal de pasivos', 3, NULL, 1, 0, 1, 'credit', 1),

-- Nivel 2 - Pasivos Corrientes
('2.1', 'PASIVOS CORRIENTES', 'Obligaciones a corto plazo', 3, 15, 1, 0, 2, 'credit', 1),

-- Nivel 3 - Cuentas por Pagar
('2.1.1', 'CUENTAS POR PAGAR', 'Obligaciones con terceros', 3, 16, 1, 0, 3, 'credit', 1),

-- Nivel 4 - Cuentas específicas
('2.1.1.01', 'Proveedores', 'Cuentas por pagar a proveedores', 3, 17, 1, 1, 4, 'credit', 1),
('2.1.1.02', 'Documentos por Pagar', 'Documentos formales pendientes de pago', 3, 17, 1, 1, 4, 'credit', 1),
('2.1.1.03', 'Acreedores Diversos', 'Obligaciones con acreedores varios', 3, 17, 1, 1, 4, 'credit', 1),

-- Nivel 3 - Impuestos por Pagar
('2.1.2', 'IMPUESTOS POR PAGAR', 'Obligaciones fiscales pendientes', 3, 16, 1, 0, 3, 'credit', 1),

-- Nivel 4 - Cuentas específicas
('2.1.2.01', 'IVA por Pagar', 'Impuesto al valor agregado por pagar', 3, 21, 1, 1, 4, 'credit', 1),
('2.1.2.02', 'Retenciones por Pagar', 'Retenciones de impuestos por pagar', 3, 21, 1, 1, 4, 'credit', 1),
('2.1.2.03', 'Impuesto sobre la Renta por Pagar', 'ISR por pagar', 3, 21, 1, 1, 4, 'credit', 1),

-- Nivel 1 - Patrimonio
('3', 'PATRIMONIO', 'Grupo principal de patrimonio', 5, NULL, 1, 0, 1, 'credit', 1),

-- Nivel 2 - Cuentas de Patrimonio
('3.1', 'CAPITAL', 'Capital de la empresa', 5, 25, 1, 0, 2, 'credit', 1),

-- Nivel 3 - Cuentas específicas
('3.1.1', 'Capital Social', 'Capital aportado por socios', 5, 26, 1, 1, 3, 'credit', 1),
('3.1.2', 'Reserva Legal', 'Reserva establecida por ley', 5, 26, 1, 1, 3, 'credit', 1),
('3.1.3', 'Utilidades Acumuladas', 'Utilidades de ejercicios anteriores', 5, 26, 1, 1, 3, 'credit', 1),
('3.1.4', 'Utilidad del Ejercicio', 'Utilidad del ejercicio actual', 5, 26, 1, 1, 3, 'credit', 1),

-- Nivel 1 - Ingresos
('4', 'INGRESOS', 'Grupo principal de ingresos', 6, NULL, 1, 0, 1, 'credit', 1),

-- Nivel 2 - Tipos de Ingresos
('4.1', 'INGRESOS OPERACIONALES', 'Ingresos propios del giro del negocio', 6, 31, 1, 0, 2, 'credit', 1),

-- Nivel 3 - Cuentas específicas
('4.1.1', 'Ventas', 'Ingresos por ventas de productos o servicios', 6, 32, 1, 1, 3, 'credit', 1),
('4.1.2', 'Devoluciones en Ventas', 'Devoluciones de mercadería vendida', 6, 32, 1, 1, 3, 'debit', 1),
('4.1.3', 'Descuentos en Ventas', 'Descuentos otorgados en ventas', 6, 32, 1, 1, 3, 'debit', 1),

-- Nivel 1 - Costos
('5', 'COSTOS', 'Grupo principal de costos', 9, NULL, 1, 0, 1, 'debit', 1),

-- Nivel 2 - Tipos de Costos
('5.1', 'COSTO DE VENTAS', 'Costo directo de la mercadería o servicio vendido', 9, 36, 1, 0, 2, 'debit', 1),

-- Nivel 3 - Cuentas específicas
('5.1.1', 'Costo de Ventas', 'Costo de los productos o servicios vendidos', 9, 37, 1, 1, 3, 'debit', 1),

-- Nivel 1 - Gastos
('6', 'GASTOS', 'Grupo principal de gastos', 7, NULL, 1, 0, 1, 'debit', 1),

-- Nivel 2 - Tipos de Gastos
('6.1', 'GASTOS DE ADMINISTRACIÓN', 'Gastos administrativos', 7, 39, 1, 0, 2, 'debit', 1),

-- Nivel 3 - Cuentas específicas
('6.1.1', 'Sueldos y Salarios', 'Gastos de personal', 7, 40, 1, 1, 3, 'debit', 1),
('6.1.2', 'Alquileres', 'Gastos por arrendamientos', 7, 40, 1, 1, 3, 'debit', 1),
('6.1.3', 'Servicios Básicos', 'Gastos de agua, luz, teléfono, internet', 7, 40, 1, 1, 3, 'debit', 1),
('6.1.4', 'Depreciaciones', 'Depreciación de activos fijos', 7, 40, 1, 1, 3, 'debit', 1),
('6.1.5', 'Amortizaciones', 'Amortización de activos intangibles', 7, 40, 1, 1, 3, 'debit', 1),

-- Nivel 2 - Gastos de Venta
('6.2', 'GASTOS DE VENTA', 'Gastos relacionados con la venta', 7, 39, 1, 0, 2, 'debit', 1),

-- Nivel 3 - Cuentas específicas
('6.2.1', 'Comisiones', 'Comisiones a vendedores', 7, 46, 1, 1, 3, 'debit', 1),
('6.2.2', 'Publicidad y Promoción', 'Gastos de publicidad y promoción', 7, 46, 1, 1, 3, 'debit', 1),
('6.2.3', 'Fletes y Transporte', 'Gastos de transporte y distribución', 7, 46, 1, 1, 3, 'debit', 1),

-- Nivel 2 - Gastos Financieros
('6.3', 'GASTOS FINANCIEROS', 'Gastos relacionados con financiamiento', 8, 39, 1, 0, 2, 'debit', 1),

-- Nivel 3 - Cuentas específicas
('6.3.1', 'Intereses Pagados', 'Gastos por intereses', 8, 50, 1, 1, 3, 'debit', 1),
('6.3.2', 'Comisiones Bancarias', 'Comisiones pagadas a entidades financieras', 8, 50, 1, 1, 3, 'debit', 1),
('6.3.3', 'Diferencial Cambiario', 'Pérdidas por tipo de cambio', 8, 50, 1, 1, 3, 'debit', 1);

-- Insertar un período fiscal para pruebas
INSERT INTO fiscal_periods (company_id, start_date, end_date, is_closed, closed_at, closed_by)
VALUES (1, '2023-01-01', '2023-01-31', 0, NULL, NULL),
       (1, '2023-02-01', '2023-02-28', 0, NULL, NULL),
       (1, '2023-03-01', '2023-03-31', 0, NULL, NULL); 