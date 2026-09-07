// Registro anónimo de eventos del embudo del cotizador.
// Permite ver en qué paso abandonan los visitantes.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

function sessionId(): string {
  let sid = sessionStorage.getItem('kersa_sid')
  if (!sid) {
    sid = crypto.randomUUID()
    sessionStorage.setItem('kersa_sid', sid)
  }
  return sid
}

export function track(evento: string, detalles?: string) {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) return  // no tracking si no hay config
    fetch(`${SUPABASE_URL}/rest/v1/funnel_events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ session_id: sessionId(), evento, detalles: detalles ?? null }),
      keepalive: true, // sobrevive si el usuario cierra la pestaña
    }).catch(() => {})
  } catch {
    // nunca romper el cotizador por el tracking
  }
}
