-- =====================================================
-- CONFIGURACIÓN DE INTEGRACIÓN ENTRE CUENTAS CONTABLES Y CUENTAS BANCARIAS
-- =====================================================

-- Este script configura la integración automática entre asientos contables
-- y transacciones bancarias basándose en el campo gl_account_id de bank_accounts

-- =====================================================
-- 1. INSERTAR ALGUNAS CUENTAS CONTABLES PARA BANCOS
-- =====================================================

-- Nota: Asegúrate de que estas cuentas existan en tu plan contable
-- Estos son ejemplos basados en el PUC colombiano

INSERT IGNORE INTO chart_of_accounts (code, name, description, account_type_id, parent_account_id, is_active, allows_entries, level, balance_type, created_by) VALUES
('1110', 'BANCOS', 'Cuentas bancarias del sistema', 1, NULL, 1, 0, 1, 'debit', 1),
('111005', 'BANCO COLOMBIA - CTA CORRIENTE', 'Cuenta corriente Bancolombia', 1, 1, 1, 1, 2, 'debit', 1),
('111010', 'BANCO POPULAR - CTA AHORROS', 'Cuenta de ahorros Banco Popular', 1, 1, 1, 1, 2, 'debit', 1),
('111015', 'BANCO BOGOTÁ - CTA CORRIENTE', 'Cuenta corriente Banco de Bogotá', 1, 1, 1, 1, 2, 'debit', 1),
('111020', 'BANCO DAVIVIENDA - CTA AHORROS', 'Cuenta de ahorros Davivienda', 1, 1, 1, 1, 2, 'debit', 1),
('111025', 'BANCO BBVA - CTA CORRIENTE', 'Cuenta corriente BBVA', 1, 1, 1, 1, 2, 'debit', 1);

-- =====================================================
-- 2. CONFIGURAR CUENTAS BANCARIAS CON ASOCIACIÓN A CUENTAS CONTABLES
-- =====================================================

-- Obtener los IDs de las cuentas contables creadas
SET @cuenta_bancolombia = (SELECT id FROM chart_of_accounts WHERE code = '111005');
SET @cuenta_popular = (SELECT id FROM chart_of_accounts WHERE code = '111010');
SET @cuenta_bogota = (SELECT id FROM chart_of_accounts WHERE code = '111015');
SET @cuenta_davivienda = (SELECT id FROM chart_of_accounts WHERE code = '111020');
SET @cuenta_bbva = (SELECT id FROM chart_of_accounts WHERE code = '111025');

-- Obtener ID de moneda por defecto (COP)
SET @moneda_cop = (SELECT id FROM currencies WHERE code = 'COP' LIMIT 1);

-- Insertar cuentas bancarias asociadas a las cuentas contables
INSERT INTO bank_accounts (account_number, name, bank_name, account_type, currency_id, gl_account_id, initial_balance, current_balance, is_active, created_by) VALUES
('001-123456-78', 'Cuenta Corriente Principal', 'BANCOLOMBIA', 'checking', @moneda_cop, @cuenta_bancolombia, 5000000.00, 5000000.00, 1, 1),
('220-987654-32', 'Cuenta Ahorros Empresarial', 'BANCO POPULAR', 'savings', @moneda_cop, @cuenta_popular, 2500000.00, 2500000.00, 1, 1),
('030-456789-01', 'Cuenta Corriente Operativa', 'BANCO DE BOGOTÁ', 'checking', @moneda_cop, @cuenta_bogota, 1800000.00, 1800000.00, 1, 1),
('007-321654-98', 'Cuenta Ahorros Reserva', 'DAVIVIENDA', 'savings', @moneda_cop, @cuenta_davivienda, 750000.00, 750000.00, 1, 1),
('051-159753-46', 'Cuenta Corriente Internacional', 'BBVA', 'checking', @moneda_cop, @cuenta_bbva, 3200000.00, 3200000.00, 1, 1);

-- =====================================================
-- 3. VERIFICAR LA CONFIGURACIÓN
-- =====================================================

-- Query para verificar que las cuentas bancarias están correctamente asociadas
SELECT 
    ba.id,
    ba.account_number,
    ba.name as account_name,
    ba.bank_name,
    ba.account_type,
    ba.current_balance,
    ba.is_active,
    coa.code as gl_account_code,
    coa.name as gl_account_name,
    c.code as currency_code
FROM bank_accounts ba
LEFT JOIN chart_of_accounts coa ON ba.gl_account_id = coa.id
LEFT JOIN currencies c ON ba.currency_id = c.id
WHERE ba.is_active = 1
ORDER BY ba.bank_name, ba.account_number;

-- =====================================================
-- 4. EJEMPLO DE USO
-- =====================================================

/*
EJEMPLO DE CÓMO FUNCIONA LA INTEGRACIÓN:

1. Cuando se crea un asiento contable que afecta una de estas cuentas contables:
   - 111005 (BANCO COLOMBIA - CTA CORRIENTE)
   - 111010 (BANCO POPULAR - CTA AHORROS)
   - etc.

2. El sistema automáticamente:
   - Detecta que la cuenta contable está asociada a una cuenta bancaria
   - Crea una transacción bancaria correspondiente
   - Determina el tipo de transacción:
     * DÉBITO en cuenta contable = DEPÓSITO en cuenta bancaria
     * CRÉDITO en cuenta contable = RETIRO en cuenta bancaria

3. Ejemplo de asiento contable:
   DÉBITO  111005 (Banco Bancolombia)     $500,000
   CRÉDITO 130505 (Clientes)              $500,000
   
   Esto generará automáticamente:
   - Una transacción bancaria tipo "deposit" por $500,000 en la cuenta Bancolombia

4. Otro ejemplo:
   DÉBITO  510506 (Gastos Bancarios)      $15,000
   CRÉDITO 111005 (Banco Bancolombia)     $15,000
   
   Esto generará automáticamente:
   - Una transacción bancaria tipo "withdrawal" por $15,000 en la cuenta Bancolombia
*/

-- =====================================================
-- 5. CONSULTAS ÚTILES PARA VALIDACIÓN
-- =====================================================

-- Ver todas las cuentas contables que están asociadas a cuentas bancarias
SELECT 
    coa.code,
    coa.name,
    ba.account_number,
    ba.bank_name,
    ba.is_active
FROM chart_of_accounts coa
INNER JOIN bank_accounts ba ON coa.id = ba.gl_account_id
WHERE ba.is_active = 1;

-- Ver transacciones bancarias generadas automáticamente desde asientos contables
SELECT 
    bt.id,
    bt.transaction_type,
    bt.date,
    bt.amount,
    bt.description,
    bt.reference_number,
    ba.account_number,
    ba.bank_name,
    je.entry_number as journal_entry_number
FROM bank_transactions bt
JOIN bank_accounts ba ON bt.bank_account_id = ba.id
LEFT JOIN journal_entries je ON bt.journal_entry_id = je.id
WHERE bt.document_type = 'journal_entry'
ORDER BY bt.date DESC;

-- =====================================================
-- 6. NOTAS IMPORTANTES
-- =====================================================

/*
CONSIDERACIONES IMPORTANTES:

1. VALIDACIÓN: El sistema valida que la cuenta bancaria esté activa antes de crear transacciones
2. ESTADO: Las transacciones creadas desde asientos se marcan como 'cleared' automáticamente
3. BALANCE: El saldo de la cuenta bancaria se actualiza automáticamente
4. REVERSIÓN: Si se reversa un asiento, las transacciones bancarias se anulan automáticamente
5. LOGS: Todas las operaciones se registran en logs para auditoría
6. TOLERANCIA: Se permite una diferencia de $0.01 por redondeo en validaciones
7. TRANSACCIÓN: Todo el proceso se ejecuta dentro de una transacción de base de datos

TIPOS DE TRANSACCIÓN GENERADOS:
- 'deposit': Cuando hay DÉBITO en la cuenta contable bancaria
- 'withdrawal': Cuando hay CRÉDITO en la cuenta contable bancaria

FLUJO DE DATOS:
Asiento Contable → Líneas del Asiento → Validación de Cuentas Bancarias → Creación de Transacciones → Actualización de Saldos
*/ 