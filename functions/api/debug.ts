interface Env {
  REPLICATE_API_TOKEN: string
  RP_A: string
  RP_B: string
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
}

export async function onRequestGet({ env }: { request: Request; env: Env }) {
  const assembled = (env.RP_A || '') + (env.RP_B || '')
  // Test the token against Replicate
  let replicateStatus = 0
  try {
    const r = await fetch('https://api.replicate.com/v1/account', {
      headers: { 'Authorization': `Bearer ${assembled}` }
    })
    replicateStatus = r.status
  } catch {}
  return new Response(JSON.stringify({
    has_rp_a: !!env.RP_A,
    has_rp_b: !!env.RP_B,
    assembled_len: assembled.length,
    assembled_prefix: assembled.slice(0, 6),
    assembled_suffix: assembled.slice(-4),
    replicate_auth_status: replicateStatus,
    env_keys: Object.keys(env),
  }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  })
}
