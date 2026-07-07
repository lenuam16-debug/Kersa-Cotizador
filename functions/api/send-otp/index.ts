interface Env {
  WHATSAPP_TOKEN: string
  WHATSAPP_PHONE_ID: string
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
    const { phone } = await request.json() as { phone: string }
    if (!phone) return new Response(JSON.stringify({ error: 'Teléfono requerido' }), { status: 400, headers: CORS })

    const normalized = normalizePhone(phone)
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Guardar código en Supabase
    const supaRes = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/phone_verifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ phone: normalized, code, expires_at: expiresAt, verified: false }),
    })
    if (!supaRes.ok) {
      return new Response(JSON.stringify({ error: 'Error guardando código' }), { status: 500, headers: CORS })
    }

    // Enviar WhatsApp via Meta Cloud API
    const waRes = await fetch(`https://graph.facebook.com/v19.0/${env.WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.WHATSAPP_TOKEN}` },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalized,
        type: 'text',
        text: { body: `Tu código de verificación KersaDesign es: *${code}*\n\nVálido por 10 minutos. No lo compartas con nadie.` },
      }),
    })

    if (!waRes.ok) {
      const err = await waRes.json()
      console.error('WhatsApp error:', err)
      return new Response(JSON.stringify({ error: 'Error enviando mensaje de WhatsApp' }), { status: 500, headers: CORS })
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS })
  }
}
