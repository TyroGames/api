-- Script para insertar datos iniciales en la tabla de períodos fiscales

-- Insertar períodos fiscales para el año 2023 (mensuales)
-- Asumimos que company_id = 1 (empresa principal)
INSERT INTO fiscal_periods (company_id, start_date, end_date, is_closed, closed_at, closed_by) VALUES
(1, '2023-01-01', '2023-01-31', true, '2023-02-05 09:00:00', 1),
(1, '2023-02-01', '2023-02-28', true, '2023-03-05 09:00:00', 1),
(1, '2023-03-01', '2023-03-31', true, '2023-04-05 09:00:00', 1),
(1, '2023-04-01', '2023-04-30', true, '2023-05-05 09:00:00', 1),
(1, '2023-05-01', '2023-05-31', true, '2023-06-05 09:00:00', 1),
(1, '2023-06-01', '2023-06-30', true, '2023-07-05 09:00:00', 1),
(1, '2023-07-01', '2023-07-31', true, '2023-08-05 09:00:00', 1),
(1, '2023-08-01', '2023-08-31', true, '2023-09-05 09:00:00', 1),
(1, '2023-09-01', '2023-09-30', true, '2023-10-05 09:00:00', 1),
(1, '2023-10-01', '2023-10-31', true, '2023-11-05 09:00:00', 1),
(1, '2023-11-01', '2023-11-30', true, '2023-12-05 09:00:00', 1),
(1, '2023-12-01', '2023-12-31', true, '2024-01-05 09:00:00', 1);

-- Insertar períodos fiscales para el año 2024 (mensuales)
INSERT INTO fiscal_periods (company_id, start_date, end_date, is_closed) VALUES
(1, '2024-01-01', '2024-01-31', false),
(1, '2024-02-01', '2024-02-29', false),
(1, '2024-03-01', '2024-03-31', false),
(1, '2024-04-01', '2024-04-30', false),
(1, '2024-05-01', '2024-05-31', false),
(1, '2024-06-01', '2024-06-30', false),
(1, '2024-07-01', '2024-07-31', false),
(1, '2024-08-01', '2024-08-31', false),
(1, '2024-09-01', '2024-09-30', false),
(1, '2024-10-01', '2024-10-31', false),
(1, '2024-11-01', '2024-11-30', false),
(1, '2024-12-01', '2024-12-31', false);

-- Notas sobre los datos insertados:
-- 1. Los períodos de 2023 están cerrados con fechas de cierre
-- 2. Los períodos de 2024 están abiertos (no cerrados)
-- 3. En un sistema real, podrías tener múltiples compañías con diferentes ID
-- 4. La secuencia de IDs será asignada automáticamente por el AUTO_INCREMENT
-- 5. Los períodos fiscales trimestrales y anuales fueron eliminados ya que no están en la estructura original
-- 6. Si requieres períodos trimestrales o anuales, deberías ampliar la estructura de la tabla primero 