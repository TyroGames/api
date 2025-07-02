# Explicación de la estructura de Asientos Contables

## ¿Por qué existen dos tablas: journal_entries y journal_entry_lines?

La contabilidad se basa en el principio de la **partida doble**, donde cada transacción afecta al menos a dos cuentas contables: una o más cuentas que se debitan y una o más cuentas que se acreditan, manteniendo siempre un equilibrio (el total de débitos = total de créditos).

### 1. Tabla `journal_entries` (Asientos Contables)

Esta tabla almacena la **cabecera** o información general del asiento contable:
- Fecha de la transacción
- Referencia o concepto general
- Tercero relacionado (si aplica)
- Estado del asiento (borrador, registrado, etc.)
- Información sobre quién lo creó y cuándo

Es como el "sobre" que contiene los movimientos individuales y proporciona contexto a la transacción.

### 2. Tabla `journal_entry_lines` (Líneas de Asiento)

Esta tabla almacena los **movimientos individuales** que componen el asiento:
- Cuenta contable afectada
- Si es un débito o crédito (monto en la columna correspondiente)
- Monto del movimiento
- Descripción específica para esa línea

Cada asiento contable puede tener múltiples líneas, donde la suma de débitos debe ser igual a la suma de créditos.

## Ejemplo práctico: Registro de una venta al contado

Imaginemos una venta al contado por $1,000 + IVA (19%) = $1,190:

### En `journal_entries` (1 registro):
```
ID: 1001
Fecha: 2023-12-15
Concepto: "Venta al contado según factura #A-123"
Tercero: Cliente XYZ
Estado: Registrado
```

### En `journal_entry_lines` (3 registros asociados al asiento 1001):
```
1. Cuenta: "1105 - Caja" | Débito: $1,190 | Crédito: $0 | Desc: "Ingreso en efectivo"
2. Cuenta: "4105 - Ingresos por ventas" | Débito: $0 | Crédito: $1,000 | Desc: "Venta de mercancía"
3. Cuenta: "2408 - IVA por pagar" | Débito: $0 | Crédito: $190 | Desc: "IVA generado"
```

## Ventajas de esta estructura

1. **Integridad de datos**: Garantiza que los asientos contables cumplan con el principio de la partida doble.
2. **Flexibilidad**: Permite asientos con cualquier número de líneas (2 o más).
3. **Mejor organización**: Separa la información general de los movimientos específicos.
4. **Consultas eficientes**: Facilita extraer información para reportes financieros.
5. **Trazabilidad**: Permite rastrear cada movimiento hasta su origen y propósito.

## Relación con otras entidades del sistema

- Un comprobante contable (`accounting_vouchers`) puede generar uno o más asientos contables.
- Un documento legal (`legal_documents`) puede relacionarse con uno o más comprobantes.
- Los saldos de las cuentas (`account_balances`) se calculan a partir de las líneas de asientos.

Esta estructura en dos tablas es estándar en sistemas contables y permite implementar correctamente los principios de contabilidad generalmente aceptados. 