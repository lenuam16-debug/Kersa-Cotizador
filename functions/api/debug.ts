interface Env {
  REPLICATE_API_TOKEN: string
  RP_A: string
  RP_B: string
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
}

export async function onRequestGet({ env }: { request: Request; env: Env }) {
  const assembled = (env.RP_A || '') + (env.RP_B || '')
  return new Response(JSON.stringify({
    has_replicate: !!env.REPLICATE_API_TOKEN,
    has_rp_a: !!env.RP_A,
    has_rp_b: !!env.RP_B,
    assembled_len: assembled.length,
    has_next_supabase_url: !!env.NEXT_PUBLIC_SUPABASE_URL,
    has_next_supabase_key: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    env_keys: Object.keys(env),
  }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  })
}
