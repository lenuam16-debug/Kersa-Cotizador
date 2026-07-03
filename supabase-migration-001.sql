-- Migración 001: Agregar vinil-spc y corregir campo name en leads
-- Ejecutar en Supabase → SQL Editor

-- 1. Actualizar el CHECK constraint de servicio para incluir vinil-spc
ALTER TABLE cotizaciones DROP CONSTRAINT IF EXISTS cotizaciones_servicio_check;
ALTER TABLE cotizaciones ADD CONSTRAINT cotizaciones_servicio_check
  CHECK (servicio IN ('vinil-lvt', 'vinil-spc', 'laminas-pvc', 'wallpanel', 'cocina-modular'));

-- 2. Agregar columna "name" a leads si no existe (el CRM usa "name" no "nombre")
ALTER TABLE leads ADD COLUMN IF NOT EXISTS name TEXT;

-- 3. Hacer "nombre" opcional ya que ahora usamos "name"
ALTER TABLE leads ALTER COLUMN nombre DROP NOT NULL;

-- 4. Hacer "ciudad" opcional (antes era NOT NULL)
ALTER TABLE leads ALTER COLUMN ciudad DROP NOT NULL;

-- 5. Agregar columnas CRM que faltaban
ALTER TABLE leads ADD COLUMN IF NOT EXISTS stage TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS platform TEXT;
