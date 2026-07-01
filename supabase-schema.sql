-- =====================================================
-- KERSADESIGN COTIZADOR — Esquema de base de datos
-- Ejecutar en el SQL Editor de Supabase
-- =====================================================

-- Tabla de leads (clientes potenciales)
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  ciudad TEXT NOT NULL,
  fecha_proyecto DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de cotizaciones
CREATE TABLE cotizaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  servicio TEXT NOT NULL CHECK (servicio IN ('vinil-lvt', 'laminas-pvc', 'wallpanel', 'cocina-modular')),
  metros_cuadrados NUMERIC,
  metros_lineales NUMERIC,
  color_seleccionado TEXT,
  detalles_adicionales TEXT,
  precio_min NUMERIC NOT NULL DEFAULT 0,
  precio_max NUMERIC NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'nuevo' CHECK (
    estado IN ('nuevo', 'contactado', 'en-negociacion', 'cerrado-ganado', 'cerrado-perdido')
  ),
  notas_admin TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de renders IA
CREATE TABLE renders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE SET NULL,
  imagen_original_url TEXT NOT NULL,
  imagen_render_url TEXT,
  servicio TEXT NOT NULL,
  color_seleccionado TEXT,
  estado TEXT NOT NULL DEFAULT 'procesando' CHECK (estado IN ('procesando', 'completado', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bucket de storage para renders
INSERT INTO storage.buckets (id, name, public) VALUES ('renders', 'renders', true);

-- Política de storage: lectura pública
CREATE POLICY "Renders públicos" ON storage.objects
  FOR SELECT USING (bucket_id = 'renders');

-- Política de storage: inserción autenticada o anon
CREATE POLICY "Upload de renders" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'renders');

-- RLS (Row Level Security)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE renders ENABLE ROW LEVEL SECURITY;

-- Permitir inserción pública (desde el cotizador sin autenticación)
CREATE POLICY "Insertar leads" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Insertar cotizaciones" ON cotizaciones FOR INSERT WITH CHECK (true);
CREATE POLICY "Insertar renders" ON renders FOR INSERT WITH CHECK (true);

-- Solo el service role puede leer y modificar (panel admin)
CREATE POLICY "Admin lee leads" ON leads FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Admin lee cotizaciones" ON cotizaciones FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Admin actualiza cotizaciones" ON cotizaciones FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Admin lee renders" ON renders FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Admin actualiza renders" ON renders FOR UPDATE USING (auth.role() = 'service_role');

-- Índices para búsquedas rápidas
CREATE INDEX idx_cotizaciones_estado ON cotizaciones(estado);
CREATE INDEX idx_cotizaciones_servicio ON cotizaciones(servicio);
CREATE INDEX idx_cotizaciones_created ON cotizaciones(created_at DESC);
CREATE INDEX idx_leads_email ON leads(email);
