interface Env {
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
}

const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }

function normalizePhone(phone: string): string {
  let p = phone.replace(/[\s\-()+]/g, '')
  if (p.startsWith('0')) p = '58' + p.slice(1)
  else if (!p.startsWith('58')) p = '58' + p
  return p
}

export async function onRequestOptions() {
  return new Response(null, { headers: { ...CORS, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } })
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    const { phone, code } = await request.json() as { phone: string; code: string }
    const normalized = normalizePhone(phone)

    const res = await fetch(
      `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/phone_verifications?phone=eq.${normalized}&select=code,expires_at`,
      {
        headers: {
          'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
      }
    )

    const rows = await res.json() as { code: string; expires_at: string }[]
    if (!rows.length) return new Response(JSON.stringify({ error: 'Código no encontrado. Vuelve a solicitar uno.' }), { status: 404, headers: CORS })

    const row = rows[0]
    if (new Date(row.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'El código expiró. Solicita uno nuevo.' }), { status: 410, headers: CORS })
    }
    if (row.code !== code.trim()) {
      return new Response(JSON.stringify({ error: 'Código incorrecto. Intenta de nuevo.' }), { status: 401, headers: CORS })
    }

    // Marcar como verificado
    await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/phone_verifications?phone=eq.${normalized}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ verified: true }),
    })

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS })
  }
}
