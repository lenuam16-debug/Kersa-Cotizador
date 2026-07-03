import { createClient } from '@supabase/supabase-js'

// NEXT_PUBLIC_* se incrustan en build time — pueden quedar vacías en Cloudflare.
// Usamos vars sin prefijo para el servidor (inyectadas en runtime por Cloudflare).
const supabaseUrl =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  'https://placeholder.supabase.co'

const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  'placeholder'

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const supabaseAdmin = createClient(supabaseUrl, serviceKey)
