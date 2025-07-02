# Integración Bancaria Automática

## 📋 Descripción General

Este sistema implementa la **integración automática entre asientos contables y transacciones bancarias**, permitiendo que cuando se contabiliza un asiento que afecta cuentas bancarias, se generen automáticamente las transacciones bancarias correspondientes.

## 🎯 Funcionalidades Principales

### ✅ **Validación Automática**
- Detecta si una cuenta contable está asociada a una cuenta bancaria
- Valida que la cuenta bancaria esté activa antes de crear transacciones
- Verifica que los montos sean válidos y positivos

### 🔄 **Creación Automática de Transacciones**
- **DÉBITO** en cuenta contable → **DEPÓSITO** en cuenta bancaria
- **CRÉDITO** en cuenta contable → **RETIRO** en cuenta bancaria
- Las transacciones se marcan como 'cleared' automáticamente
- Se actualiza el saldo de la cuenta bancaria en tiempo real

### 🔙 **Reversión Automática**
- Si se reversa un asiento contable, se anulan automáticamente las transacciones bancarias
- Mantiene la trazabilidad completa del proceso

## 🏗️ Arquitectura del Sistema

### **Modelos Involucrados**

1. **`bankAccountModel.js`**
   - `getByGLAccount(glAccountId)` - Obtiene cuenta bancaria por cuenta contable
   - `isGLAccountLinkedToBankAccount(glAccountId)` - Verifica asociación

2. **`bankTransactionIntegrationModel.js`** *(NUEVO)*
   - `processJournalEntryForBankTransactions()` - Procesa asientos para crear transacciones
   - `determineTransactionType()` - Determina tipo de transacción (deposit/withdrawal)
   - `validateJournalEntryBankSync()` - Valida sincronización

3. **`journalEntryModel.js`** *(MODIFICADO)*
   - Integración en método `post()` para crear transacciones automáticamente
   - Integración en método `reverse()` para anular transacciones
   - Nuevos métodos de consulta para transacciones bancarias

### **Flujo de Datos**
```
Asiento Contable (Aprobación)
        ↓
Obtener Líneas del Asiento
        ↓
¿Alguna línea afecta cuenta bancaria?
        ↓ (SÍ)
Determinar Tipo de Transacción
        ↓
Crear Transacción Bancaria
        ↓
Actualizar Saldo de Cuenta Bancaria
```

## 📊 Tipos de Transacciones Generadas

| **Movimiento Contable** | **Tipo de Transacción Bancaria** | **Descripción** |
|-------------------------|-----------------------------------|-----------------|
| DÉBITO en cuenta bancaria | `deposit` | Ingreso de dinero a la cuenta |
| CRÉDITO en cuenta bancaria | `withdrawal` | Salida de dinero de la cuenta |

## 💼 Ejemplos de Uso

### **Ejemplo 1: Pago de Cliente**
```sql
-- Asiento Contable:
DÉBITO  111005 (Banco Bancolombia)     $500,000
CRÉDITO 130505 (Clientes)              $500,000

-- Resultado Automático:
-- Transacción bancaria tipo "deposit" por $500,000 en cuenta Bancolombia
```

### **Ejemplo 2: Pago de Gastos Bancarios**
```sql
-- Asiento Contable:
DÉBITO  510506 (Gastos Bancarios)      $15,000
CRÉDITO 111005 (Banco Bancolombia)     $15,000

-- Resultado Automático:
-- Transacción bancaria tipo "withdrawal" por $15,000 en cuenta Bancolombia
```

### **Ejemplo 3: Transferencia entre Cuentas**
```sql
-- Asiento Contable:
DÉBITO  111010 (Banco Popular)         $200,000
CRÉDITO 111005 (Banco Bancolombia)     $200,000

-- Resultado Automático:
-- Transacción "deposit" por $200,000 en cuenta Popular
-- Transacción "withdrawal" por $200,000 en cuenta Bancolombia
```

## ⚙️ Configuración

### **1. Configurar Cuentas Contables**
```sql
-- Crear cuentas contables para bancos
INSERT INTO chart_of_accounts (code, name, account_type_id, balance_type) VALUES
('111005', 'BANCO COLOMBIA - CTA CORRIENTE', 1, 'debit');
```

### **2. Asociar Cuentas Bancarias**
```sql
-- Crear cuenta bancaria asociada a cuenta contable
INSERT INTO bank_accounts (account_number, name, bank_name, gl_account_id) VALUES
('001-123456-78', 'Cuenta Corriente Principal', 'BANCOLOMBIA', @cuenta_id);
```

### **3. Ejecutar Script de Configuración**
```bash
# Ejecutar script de configuración incluido
mysql -u usuario -p database < docs/sql/setup_bank_account_integration.sql
```

## 🔍 Métodos de Validación

### **Verificar Asociaciones**
```javascript
// Verificar si una cuenta contable está asociada a cuenta bancaria
const isLinked = await BankAccount.isGLAccountLinkedToBankAccount(accountId);

// Obtener cuenta bancaria por cuenta contable
const bankAccount = await BankAccount.getByGLAccount(accountId);
```

### **Verificar Sincronización**
```javascript
// Validar que asiento y transacciones estén sincronizados
const validation = await JournalEntry.validateBankSynchronization(journalEntryId);

// Obtener transacciones bancarias de un asiento
const transactions = await JournalEntry.getBankTransactions(journalEntryId);
```

## 📈 Consultas de Auditoría

### **Ver Transacciones Automáticas**
```sql
SELECT 
    bt.id,
    bt.transaction_type,
    bt.date,
    bt.amount,
    bt.description,
    ba.account_number,
    ba.bank_name,
    je.entry_number
FROM bank_transactions bt
JOIN bank_accounts ba ON bt.bank_account_id = ba.id
LEFT JOIN journal_entries je ON bt.journal_entry_id = je.id
WHERE bt.document_type = 'journal_entry'
ORDER BY bt.date DESC;
```

### **Ver Cuentas Bancarias Asociadas**
```sql
SELECT 
    coa.code,
    coa.name,
    ba.account_number,
    ba.bank_name,
    ba.current_balance
FROM chart_of_accounts coa
INNER JOIN bank_accounts ba ON coa.id = ba.gl_account_id
WHERE ba.is_active = 1;
```

## 🛡️ Seguridad y Validaciones

### **Validaciones Implementadas**
- ✅ Cuenta bancaria debe estar activa
- ✅ Monto debe ser mayor a cero
- ✅ Línea de asiento no puede tener débito y crédito simultáneamente
- ✅ Sistema permite tolerancia de $0.01 por redondeo
- ✅ Todas las operaciones se ejecutan en transacciones de BD

### **Manejo de Errores**
- ❌ Error en transacción bancaria **NO** falla el asiento contable
- 📝 Todos los errores se registran en logs
- 🔄 Proceso continúa con las demás líneas aunque una falle

## 📊 Estados y Flujo

### **Estados de Transacciones Bancarias**
- `pending` - Transacción pendiente
- `cleared` - Transacción confirmada (por defecto para asientos)
- `voided` - Transacción anulada

### **Flujo de Estados**
```
Asiento 'draft' → (No genera transacciones)
Asiento 'posted' → Genera transacciones 'cleared'
Asiento 'reversed' → Anula transacciones ('voided')
```

## 🔧 Métodos de API Disponibles

### **BankTransactionIntegration**
```javascript
// Procesar asiento para transacciones bancarias
processJournalEntryForBankTransactions(journalEntryId, lines, connection)

// Verificar si asiento afecta cuentas bancarias
hasJournalEntryBankAccountLines(lines)

// Obtener transacciones por asiento
getBankTransactionsByJournalEntry(journalEntryId)

// Anular transacciones por asiento
voidBankTransactionsByJournalEntry(journalEntryId, userId, reason)

// Validar sincronización
validateJournalEntryBankSync(journalEntryId)
```

### **JournalEntry (Nuevos métodos)**
```javascript
// Obtener transacciones bancarias del asiento
getBankTransactions(journalEntryId)

// Validar sincronización bancaria
validateBankSynchronization(journalEntryId)

// Verificar si afecta cuentas bancarias
affectsBankAccounts(journalEntryId)
```

### **BankAccount (Nuevos métodos)**
```javascript
// Obtener cuenta bancaria por cuenta contable
getByGLAccount(glAccountId)

// Verificar asociación
isGLAccountLinkedToBankAccount(glAccountId)
```

## 📝 Logs y Auditoría

### **Información Registrada**
```
[INFO] Asiento contable 123 afecta cuentas bancarias, creando transacciones automáticamente
[INFO] Procesando línea de asiento que afecta cuenta bancaria: 001-123456-78
[INFO] Transacción bancaria creada automáticamente: 456 para cuenta 001-123456-78
[INFO] Se crearon 2 transacciones bancarias automáticamente para el asiento 123
```

### **Errores Comunes**
```
[ERROR] Error al crear transacción bancaria para cuenta 001-123456-78: Fondos insuficientes
[ERROR] Error al anular transacciones bancarias del asiento 123: Transacción ya anulada
[WARN] Línea de asiento tiene tanto débito como crédito: 789
[WARN] Línea de asiento sin monto: 790
```

## 🚀 Próximas Mejoras

- [ ] Soporte para múltiples monedas
- [ ] Integración con conciliación bancaria automática
- [ ] Notificaciones automáticas de transacciones generadas
- [ ] Dashboard de sincronización bancaria
- [ ] Exportación automática a formatos bancarios
- [ ] Integración con APIs bancarias reales

---

## 🔗 Archivos Relacionados

- `src/models/Contabilidad/Tesoreria/bankTransactionIntegrationModel.js`
- `src/models/Contabilidad/Tesoreria/bankAccountModel.js`
- `src/models/Contabilidad/General/Asientos_Contables/journalEntryModel.js`
- `docs/sql/setup_bank_account_integration.sql`

---

**Desarrollado para optimizar la integración contable-bancaria y mejorar la eficiencia operativa del sistema.** 