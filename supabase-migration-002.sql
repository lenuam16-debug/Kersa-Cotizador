-- Migración 002: Permitir SELECT público en leads y cotizaciones para el cotizador
-- Ejecutar en Supabase → SQL Editor

-- Permitir que el cotizador (anon) pueda leer el id después de un upsert/insert
CREATE POLICY IF NOT EXISTS "Cotizador lee su lead" ON leads
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Cotizador lee su cotizacion" ON cotizaciones
  FOR SELECT USING (true);
