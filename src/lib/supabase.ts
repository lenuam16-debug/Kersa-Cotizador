import { createClient } from '@supabase/supabase-js'

// En build time las env vars no existen — usamos placeholders válidos.
// En runtime Cloudflare inyecta los valores reales.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const supabaseAdmin = createClient(supabaseUrl, serviceKey)
