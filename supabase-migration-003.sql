-- Migración 003: Permitir que admin (anon key) pueda eliminar y actualizar cotizaciones
-- Ejecutar en: supabase.com → Tu proyecto → SQL Editor → New query

-- Permitir eliminar cotizaciones con anon key
CREATE POLICY IF NOT EXISTS "Anon elimina cotizaciones" ON cotizaciones
  FOR DELETE USING (true);

-- Permitir actualizar cotizaciones con anon key (por si acaso el PATCH tampoco persiste)
CREATE POLICY IF NOT EXISTS "Anon actualiza cotizaciones" ON cotizaciones
  FOR UPDATE USING (true);
