import { createClient } from '@supabase/supabase-js'

function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
  return url
}

function getAnonKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  return key
}

function getServiceKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
  return key
}

let _supabase: ReturnType<typeof createClient> | null = null
let _supabaseAdmin: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (!_supabase) _supabase = createClient(getSupabaseUrl(), getAnonKey())
  return _supabase
}

export function getSupabaseAdmin() {
  if (!_supabaseAdmin) _supabaseAdmin = createClient(getSupabaseUrl(), getServiceKey())
  return _supabaseAdmin
}

// Compatibilidad con código existente que importa supabase/supabaseAdmin directamente
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop) {
    return (getSupabase() as any)[prop]
  }
})

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop) {
    return (getSupabaseAdmin() as any)[prop]
  }
})
