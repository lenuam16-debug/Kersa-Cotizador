// Cloudflare Pages Function nativa — no usa next-on-pages ni Edge Runtime de Next.js
// Se despliega directamente como Cloudflare Worker y maneja /api/cotizacion

interface Env {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

interface RequestData {
  servicio?: string
  metros_cuadrados?: number
  metros_lineales?: number
  tipo_piso_actual?: string
  color_seleccionado?: string
  detalles_adicionales?: string
  nombre?: string
  telefono?: string
  email?: string
  ciudad?: string
  municipio?: string
}

const PRECIO_BASE: Record<string, number> = {
  'vinil-lvt': 17,
  'vinil-spc': 25,
  'laminas-pvc': 12,
  'wallpanel': 20,
  'cocina-modular': 400,
}

const MARGEN: Record<string, number> = {
  'vinil-lvt': 0.1,
  'vinil-spc': 0.1,
  'laminas-pvc': 0.1,
  'wallpanel': 0.1,
  'cocina-modular': 0.15,
}

const COSTO_ACONDICIONAMIENTO = 3
const PISOS_SIN_ACOND = ['granito', 'microcemento']

function calcular(servicio: string, cantidad: number, acondicionamiento: boolean) {
  const base = (PRECIO_BASE[servicio] ?? 0) * cantidad
  const margen = MARGEN[servicio] ?? 0.1
  const acond = acondicionamiento ? COSTO_ACONDICIONAMIENTO * cantidad : 0
  return {
    min: Math.round(base * 0.95 + acond),
    max: Math.round(base * (1 + margen) + acond),
  }
}

async function supabaseFetch(url: string, key: string, path: string, body: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Prefer': 'return=representation',
      ...headers,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json() as unknown
  if (!res.ok) throw new Error(`Supabase error ${res.status}: ${JSON.stringify(data)}`)
  return data as Record<string, unknown>[]
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  }

  try {
    const supabaseUrl = env.SUPABASE_URL
    const supabaseKey = env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'ENV vars missing' }), { status: 500, headers: corsHeaders })
    }

    const datos = await request.json() as RequestData

    const ciudadCompleta = datos.ciudad
      ? `${datos.ciudad} - ${datos.municipio ?? ''}`.trim().replace(/ - $/, '')
      : null

    // 1. Upsert lead
    const leads = await supabaseFetch(supabaseUrl, supabaseKey, 'leads', {
      name: datos.nombre,
      email: datos.email,
      telefono: datos.telefono,
      ciudad: ciudadCompleta,
      stage: 'cotizacion',
      platform: 'Cotizador Web',
    }, {
      'Prefer': 'return=representation,resolution=merge-duplicates',
      'on-conflict': 'email',
    })

    const leadId = Array.isArray(leads) ? leads[0]?.id : (leads as Record<string, unknown>)?.id
    if (!leadId) throw new Error('No lead ID: ' + JSON.stringify(leads))

    // 2. Calcular precios
    const esVinil = datos.servicio === 'vinil-lvt' || datos.servicio === 'vinil-spc'
    const cantidad = datos.servicio === 'cocina-modular'
      ? (datos.metros_lineales ?? 0)
      : (datos.metros_cuadrados ?? 0)
    const requiereAcond = esVinil && !!datos.tipo_piso_actual && !PISOS_SIN_ACOND.includes(datos.tipo_piso_actual)
    const precio = calcular(datos.servicio ?? '', cantidad, requiereAcond)

    // 3. Insertar cotización
    const cotizaciones = await supabaseFetch(supabaseUrl, supabaseKey, 'cotizaciones', {
      lead_id: leadId,
      servicio: datos.servicio,
      metros_cuadrados: datos.servicio !== 'cocina-modular' ? datos.metros_cuadrados : null,
      metros_lineales: datos.servicio === 'cocina-modular' ? datos.metros_lineales : null,
      color_seleccionado: datos.color_seleccionado || null,
      detalles_adicionales: [
        datos.tipo_piso_actual ? `Piso actual: ${datos.tipo_piso_actual}` : null,
        requiereAcond ? 'Requiere acondicionamiento' : null,
        datos.detalles_adicionales || null,
      ].filter(Boolean).join(' | ') || null,
      precio_min: precio.min,
      precio_max: precio.max,
      estado: 'nuevo',
    })

    const cot = Array.isArray(cotizaciones) ? cotizaciones[0] : cotizaciones
    if (!cot?.id) throw new Error('No cotizacion ID: ' + JSON.stringify(cotizaciones))

    return new Response(JSON.stringify({ id: cot.id, success: true }), { status: 200, headers: corsHeaders })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: corsHeaders })
  }
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
