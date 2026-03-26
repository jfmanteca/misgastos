-- ============================================
-- MIGRACIÓN DE DATOS HISTÓRICOS
-- Correr DESPUÉS del schema y DESPUÉS de crear tu usuario
-- Reemplazá 'TU_USER_ID' con tu user ID real de Supabase
-- (lo encontrás en Authentication → Users → click en tu usuario)
-- ============================================

-- Primero, insertá las cuentas con los saldos actuales
INSERT INTO cuentas (user_id, nombre, saldo, moneda) VALUES
('TU_USER_ID', 'Efectivo $', 20200, 'ARS'),
('TU_USER_ID', 'Efectivo USD', 120, 'USD'),
('TU_USER_ID', 'BAPRO $', 4415513, 'ARS'),
('TU_USER_ID', 'BAPRO USD', 943, 'USD'),
('TU_USER_ID', 'Mercado Pago $', 441302, 'ARS');

-- Historial deuda Edgardo (completo)
INSERT INTO deuda_edgardo (user_id, fecha, descripcion, monto, saldo) VALUES
('TU_USER_ID', '2023-07-10', 'Depósito', 17100, 17100),
('TU_USER_ID', '2023-07-10', 'Efectivo', 15300, 32400),
('TU_USER_ID', '2023-07-13', 'Efectivo', 14200, 46600),
('TU_USER_ID', '2023-07-13', 'Efectivo en pesos', 1581, 48181),
('TU_USER_ID', '2023-07-13', 'Corresponde a Regalo', -20000, 28181),
('TU_USER_ID', '2023-07-13', 'Corresponde a Sabaté', -10000, 18181),
('TU_USER_ID', '2023-10-11', 'Pago efvo por deuda', -500, 17681),
('TU_USER_ID', '2023-12-15', 'Pago efvo por deuda', -417, 17264),
('TU_USER_ID', '2024-02-01', 'Pago efvo por deuda', -200, 17064),
('TU_USER_ID', '2024-03-27', 'Pago transf por deuda', -400, 16664),
('TU_USER_ID', '2024-06-07', 'Pago transf por deuda', -400, 16264),
('TU_USER_ID', '2024-08-09', 'Préstamo auto', 2182, 18446),
('TU_USER_ID', '2024-08-12', 'Préstamo auto', 1476, 19922),
('TU_USER_ID', '2024-11-21', 'Pago efvo por deuda', -600, 19322),
('TU_USER_ID', '2024-12-23', 'Pago efvo por deuda', -500, 18822),
('TU_USER_ID', '2025-03-10', 'Pago trans por deuda', -412, 18411),
('TU_USER_ID', '2025-03-10', 'Traspaso deuda Sabaté', 10000, 28411),
('TU_USER_ID', '2025-05-15', 'Pago trans por deuda', -400, 28011),
('TU_USER_ID', '2025-07-13', 'Pago efvo por deuda', -300, 27711),
('TU_USER_ID', '2025-07-24', 'Pago efvo por deuda', -200, 27511),
('TU_USER_ID', '2025-09-12', 'Pago trans por deuda', -426, 27085),
('TU_USER_ID', '2025-11-10', 'Pago trans por deuda', -380, 26705),
('TU_USER_ID', '2025-11-14', 'Pago trans por deuda', -411, 26294),
('TU_USER_ID', '2025-12-11', 'Pago trans por deuda', -279, 26015),
('TU_USER_ID', '2025-12-11', 'Pagos Saguma por deuda', -100, 25915),
('TU_USER_ID', '2026-01-13', 'Pagos Saguma por deuda', -185, 25730),
('TU_USER_ID', '2026-02-03', 'Pagos Saguma por deuda', -190, 25541),
('TU_USER_ID', '2026-03-07', 'Pagos Saguma por deuda', -194, 25346);
