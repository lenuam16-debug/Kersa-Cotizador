-- Migración 004: columna estructurada para configuración de cocina modular
-- Ejecutar en: supabase.com → Tu proyecto → SQL Editor → New query

ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS config_cocina JSONB;
