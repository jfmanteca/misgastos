-- ============================================
-- MisGastos - Database Schema for Supabase
-- ============================================

-- 1. Tabla de cuentas (saldos)
CREATE TABLE cuentas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  nombre TEXT NOT NULL,
  saldo NUMERIC(15,2) DEFAULT 0,
  moneda TEXT DEFAULT 'ARS' CHECK (moneda IN ('ARS', 'USD')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabla de movimientos (gastos, ingresos, traspasos, inversiones)
CREATE TABLE movimientos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  fecha DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('egreso', 'ingreso', 'traspaso', 'inversion')),
  categoria TEXT NOT NULL,
  subcategoria TEXT,
  detalle TEXT,
  monto NUMERIC(15,2) NOT NULL,
  cuenta_id UUID REFERENCES cuentas(id),
  cuenta_destino_id UUID REFERENCES cuentas(id),
  tc TEXT CHECK (tc IN ('V', 'D', NULL)),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabla de deuda Edgardo (historial completo)
CREATE TABLE deuda_edgardo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  fecha DATE NOT NULL,
  descripcion TEXT NOT NULL,
  monto NUMERIC(15,2) NOT NULL,
  saldo NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabla de gastos recurrentes (para futuro)
CREATE TABLE recurrentes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  categoria TEXT NOT NULL,
  subcategoria TEXT,
  monto NUMERIC(15,2) NOT NULL,
  cuenta_id UUID REFERENCES cuentas(id),
  tc TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabla de presupuestos mensuales (para futuro)
CREATE TABLE presupuestos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  categoria TEXT NOT NULL,
  limite NUMERIC(15,2) NOT NULL,
  mes TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Row Level Security (RLS) - Solo ves tus datos
-- ============================================

ALTER TABLE cuentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE deuda_edgardo ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurrentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;

-- Policies: cada usuario solo ve/edita sus propios datos
CREATE POLICY "Users see own data" ON cuentas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own data" ON movimientos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own data" ON deuda_edgardo FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own data" ON recurrentes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own data" ON presupuestos FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- Índices para performance
-- ============================================
CREATE INDEX idx_movimientos_fecha ON movimientos(user_id, fecha DESC);
CREATE INDEX idx_movimientos_tipo ON movimientos(user_id, tipo);
CREATE INDEX idx_movimientos_categoria ON movimientos(user_id, categoria);
CREATE INDEX idx_deuda_fecha ON deuda_edgardo(user_id, fecha DESC);

-- ============================================
-- Migraciones
-- ============================================

-- v2: Gastos Fijos - marcar subcategorías como gasto fijo mensual
ALTER TABLE subcategorias_egreso ADD COLUMN IF NOT EXISTS es_fijo BOOLEAN DEFAULT FALSE;
