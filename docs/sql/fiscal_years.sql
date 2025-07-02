-- Script para insertar datos iniciales en la tabla de años fiscales

-- Insertar años fiscales 2023 (cerrado) y 2024 (activo)
-- Asumimos que company_id = 1 (empresa principal)
INSERT INTO fiscal_years (
    company_id, year_number, name, start_date, end_date, 
    is_closed, closed_at, closed_by, status, 
    created_at, created_by
) VALUES
(1, 2023, 'Año Fiscal 2023', '2023-01-01', '2023-12-31', 
 TRUE, '2024-01-31 10:00:00', 1, 'closed', 
 '2022-12-15 09:00:00', 1);

-- Insertar año fiscal 2024 (activo actualmente)
INSERT INTO fiscal_years (
    company_id, year_number, name, start_date, end_date, 
    is_closed, status, created_at, created_by
) VALUES
(1, 2024, 'Año Fiscal 2024', '2024-01-01', '2024-12-31', 
 FALSE, 'active', '2023-12-15 09:00:00', 1);

-- Insertar año fiscal 2025 (próximo)
INSERT INTO fiscal_years (
    company_id, year_number, name, start_date, end_date, 
    is_closed, status, created_at, created_by
) VALUES
(1, 2025, 'Año Fiscal 2025', '2025-01-01', '2025-12-31', 
 FALSE, 'upcoming', '2023-12-15 09:00:00', 1);

-- Notas sobre los datos insertados:
-- 1. El año fiscal 2023 está cerrado, con fecha de cierre y usuario que lo cerró
-- 2. El año fiscal 2024 está activo actualmente
-- 3. El año fiscal 2025 está configurado como próximo
-- 4. En un sistema real, deberías ajustar las fechas según el período fiscal de la empresa
--    (algunas empresas usan años fiscales diferentes al año calendario)
-- 5. El campo company_id debe coincidir con un ID válido en la tabla companies 