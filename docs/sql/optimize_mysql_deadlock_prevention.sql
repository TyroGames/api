-- =====================================================
-- OPTIMIZACIÓN DE MYSQL PARA PREVENIR DEADLOCKS
-- =====================================================

-- Configuraciones para mejorar el rendimiento y reducir deadlocks
-- en transacciones bancarias y contables

-- =====================================================
-- 1. CONFIGURACIONES DE TIMEOUT Y DEADLOCK
-- =====================================================

-- Aumentar el timeout de lock wait (por defecto 50 segundos)
SET GLOBAL innodb_lock_wait_timeout = 120;

-- Configurar detección de deadlock más agresiva
SET GLOBAL innodb_deadlock_detect = ON;

-- Configurar timeout de transacciones (por defecto 0 = sin límite)
SET GLOBAL innodb_rollback_on_timeout = ON;

-- =====================================================
-- 2. OPTIMIZACIONES DE BUFFER POOL
-- =====================================================

-- Mostrar configuración actual del buffer pool
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';

-- Recomendación: innodb_buffer_pool_size debería ser 70-80% de la RAM
-- Ejemplo para servidor con 8GB RAM:
-- SET GLOBAL innodb_buffer_pool_size = 6442450944; -- 6GB

-- =====================================================
-- 3. ÍNDICES OPTIMIZADOS PARA PREVENIR DEADLOCKS
-- =====================================================

-- Índices en bank_accounts para optimizar locks
CREATE INDEX IF NOT EXISTS idx_bank_accounts_gl_account_active 
ON bank_accounts(gl_account_id, is_active);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_active_balance 
ON bank_accounts(is_active, current_balance);

-- Índices en bank_transactions para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_bank_transactions_account_date 
ON bank_transactions(bank_account_id, date, status);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_journal_entry 
ON bank_transactions(journal_entry_id, status);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_account_status 
ON bank_transactions(bank_account_id, status, created_at);

-- Índices en journal_entries y journal_entry_lines
CREATE INDEX IF NOT EXISTS idx_journal_entries_date_status 
ON journal_entries(date, status);

CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account_amounts 
ON journal_entry_lines(account_id, debit_amount, credit_amount);

-- =====================================================
-- 4. CONFIGURACIONES DE LOG Y MONITOREO
-- =====================================================

-- Habilitar logging de deadlocks
SET GLOBAL innodb_print_all_deadlocks = ON;

-- Configurar tamaño de log para transacciones grandes
SHOW VARIABLES LIKE 'innodb_log_file_size';

-- =====================================================
-- 5. CONSULTAS DE MONITOREO DE DEADLOCKS
-- =====================================================

-- Ver información actual de deadlocks
SELECT * FROM INFORMATION_SCHEMA.INNODB_METRICS 
WHERE NAME LIKE '%deadlock%';

-- Ver transacciones en ejecución
SELECT 
    trx_id,
    trx_state,
    trx_started,
    trx_isolation_level,
    trx_wait_started,
    trx_mysql_thread_id
FROM INFORMATION_SCHEMA.INNODB_TRX
ORDER BY trx_started;

-- Ver locks en espera
SELECT 
    waiting_trx_id,
    waiting_pid,
    waiting_query,
    blocking_trx_id,
    blocking_pid,
    blocking_query
FROM sys.innodb_lock_waits;

-- =====================================================
-- 6. CONFIGURACIONES PERMANENTES (my.cnf)
-- =====================================================

/*
Para hacer estas configuraciones permanentes, agregar en my.cnf:

[mysqld]
# Timeout y deadlock settings
innodb_lock_wait_timeout = 120
innodb_deadlock_detect = ON
innodb_rollback_on_timeout = ON
innodb_print_all_deadlocks = ON

# Buffer pool (ajustar según RAM disponible)
innodb_buffer_pool_size = 6G
innodb_buffer_pool_instances = 8

# Log settings
innodb_log_file_size = 512M
innodb_log_buffer_size = 64M

# Transaction settings
innodb_flush_log_at_trx_commit = 2
innodb_file_per_table = ON

# Concurrency settings
innodb_thread_concurrency = 0
innodb_read_io_threads = 8
innodb_write_io_threads = 8

Después de modificar my.cnf, reiniciar MySQL:
sudo systemctl restart mysql
*/

-- =====================================================
-- 7. VERIFICACIÓN DE CONFIGURACIÓN
-- =====================================================

-- Verificar que las configuraciones se aplicaron correctamente
SELECT 
    'innodb_lock_wait_timeout' as variable_name,
    @@innodb_lock_wait_timeout as current_value,
    'segundos' as unit
UNION ALL
SELECT 
    'innodb_deadlock_detect',
    @@innodb_deadlock_detect,
    'boolean'
UNION ALL
SELECT 
    'innodb_rollback_on_timeout',
    @@innodb_rollback_on_timeout,
    'boolean'
UNION ALL
SELECT 
    'innodb_print_all_deadlocks',
    @@innodb_print_all_deadlocks,
    'boolean';

-- =====================================================
-- 8. MONITOREO CONTINUO
-- =====================================================

-- Query para monitorear deadlocks en tiempo real
-- (ejecutar periódicamente)
SELECT 
    DATE(created) as fecha,
    COUNT(*) as total_deadlocks,
    AVG(TIME_TO_SEC(TIMEDIFF(created, created))) as duracion_promedio
FROM performance_schema.events_errors_summary_global_by_error
WHERE error_name = 'ER_LOCK_DEADLOCK'
GROUP BY DATE(created)
ORDER BY fecha DESC;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

/*
MEJORES PRÁCTICAS IMPLEMENTADAS:

1. LOCKS ESPECÍFICOS:
   - Usar SELECT ... FOR UPDATE solo en registros específicos
   - Minimizar el tiempo de transacción
   - Acceder a tablas siempre en el mismo orden

2. TRANSACCIONES OPTIMIZADAS:
   - Procesar transacciones bancarias secuencialmente
   - Usar una sola conexión por voucher/asiento
   - Implementar retry automático para deadlocks

3. ÍNDICES OPTIMIZADOS:
   - Índices compuestos para consultas frecuentes
   - Índices en columnas de JOIN y WHERE
   - Índices en foreign keys

4. CONFIGURACIÓN MYSQL:
   - Timeouts apropiados
   - Buffer pool optimizado
   - Detección de deadlocks habilitada

5. MONITOREO:
   - Logging de deadlocks activado
   - Queries de monitoreo disponibles
   - Métricas de rendimiento

ORDEN DE IMPLEMENTACIÓN:
1. Ejecutar este script SQL
2. Configurar my.cnf (requiere reinicio de MySQL)
3. Monitorear logs por unos días
4. Ajustar configuraciones según necesidad
*/ 