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

// Píxel de Meta (el mismo de kersadesign.com): los anuncios aprenden quién
// llega a cotizar y agenda, no solo quién hace clic. Solo eventos, sin datos
// personales del cliente.
const META_PIXEL_ID = '1870010763967885'
const EVENTOS_META: Record<string, [string, boolean]> = {
  '1_llego_al_cotizador': ['PageView', false],
  '2_eligio_servicio': ['ViewContent', false],
  '5_telefono_verificado': ['Lead', false],
  '6_vio_cotizacion': ['CotizacionVista', true],
  '7_visita_agendada': ['Schedule', false],
}

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue: unknown[][]; loaded: boolean; version: string; push: unknown }

function fbq(...args: unknown[]) {
  const w = window as unknown as { fbq?: Fbq; _fbq?: Fbq }
  if (!w.fbq) {
    const n = function (...a: unknown[]) { if (n.callMethod) n.callMethod(...a); else n.queue.push(a) } as Fbq
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = []
    w.fbq = n; w._fbq = n
    const s = document.createElement('script')
    s.async = true
    s.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(s)
    n('init', META_PIXEL_ID)
  }
  w.fbq(...args)
}

function trackMeta(evento: string, detalles?: string) {
  const ev = EVENTOS_META[evento]
  if (!ev) return
  const [nombre, custom] = ev
  const params = evento === '2_eligio_servicio' && detalles ? { content_name: detalles } : undefined
  fbq(custom ? 'trackCustom' : 'track', nombre, params)
}

export function track(evento: string, detalles?: string) {
  try { trackMeta(evento, detalles) } catch { /* nunca romper el cotizador */ }
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
