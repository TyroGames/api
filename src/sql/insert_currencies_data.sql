-- =============================================================================
-- DATOS INICIALES PARA LA TABLA CURRENCIES
-- Script para insertar monedas básicas para el sistema contable
-- =============================================================================

-- Insertar monedas principales del mundo
INSERT INTO currencies (code, name, symbol, is_default) VALUES
('COP', 'Peso Colombiano', '$', true),
('USD', 'Dólar Estadounidense', 'US$', false),
('EUR', 'Euro', '€', false),
('GBP', 'Libra Esterlina', '£', false),
('JPY', 'Yen Japonés', '¥', false),
('CAD', 'Dólar Canadiense', 'C$', false),
('AUD', 'Dólar Australiano', 'A$', false),
('CHF', 'Franco Suizo', 'CHF', false),
('CNY', 'Yuan Chino', '¥', false),
('MXN', 'Peso Mexicano', 'MX$', false),
('BRL', 'Real Brasileño', 'R$', false),
('ARS', 'Peso Argentino', 'AR$', false),
('CLP', 'Peso Chileno', 'CL$', false),
('PEN', 'Sol Peruano', 'S/', false),
('UYU', 'Peso Uruguayo', 'UY$', false),
('VES', 'Bolívar Venezolano', 'Bs.', false);

-- Verificar la inserción
SELECT 
    id,
    code,
    name,
    symbol,
    is_default,
    created_at
FROM currencies 
ORDER BY 
    is_default DESC,
    name ASC;

-- Comentarios sobre las monedas insertadas:
-- COP (Peso Colombiano) se establece como moneda por defecto
-- USD (Dólar Estadounidense) es la moneda de referencia internacional más común
-- EUR (Euro) es la moneda de la Eurozona
-- Las demás monedas son importantes para transacciones internacionales
-- Se incluyen monedas de países de América Latina para facilitar operaciones regionales 