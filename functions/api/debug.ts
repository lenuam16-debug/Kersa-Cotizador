interface Env {
  REPLICATE_API_TOKEN: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
}

export async function onRequestGet({ env }: { request: Request; env: Env }) {
  return new Response(JSON.stringify({
    has_replicate: !!env.REPLICATE_API_TOKEN,
    has_supabase_url: !!env.SUPABASE_URL,
    has_supabase_key: !!env.SUPABASE_ANON_KEY,
    has_next_supabase_url: !!env.NEXT_PUBLIC_SUPABASE_URL,
    has_next_supabase_key: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    env_keys: Object.keys(env),
  }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  })
}
