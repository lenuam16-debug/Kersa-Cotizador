export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { calcularCotizacion } from '@/lib/pricing'
import { PasoForm } from '@/types'

async function supabaseFetch(path: string, options: { method?: string; body?: unknown; headers?: Record<string, string> }) {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Prefer': 'return=representation',
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(JSON.stringify(data))
  return data
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      return NextResponse.json({ error: `SUPABASE_URL no configurada (val: ${supabaseUrl})` }, { status: 500 })
    }

    const datos: PasoForm = await req.json()

    const ciudadCompleta = datos.ciudad
      ? `${datos.ciudad} - ${datos.municipio ?? ''}`.trim().replace(/ - $/, '')
      : null

    // 1. Upsert lead — usa REST API directa, sin supabase-js
    const leads = await supabaseFetch('leads', {
      method: 'POST',
      body: {
        name: datos.nombre,
        email: datos.email,
        telefono: datos.telefono,
        ciudad: ciudadCompleta,
        stage: 'cotizacion',
        platform: 'Cotizador Web',
      },
      headers: {
        'Prefer': 'return=representation,resolution=merge-duplicates',
        'on-conflict': 'email',
      },
    })

    const leadId = Array.isArray(leads) ? leads[0]?.id : leads?.id
    if (!leadId) throw new Error('No se obtuvo ID del lead: ' + JSON.stringify(leads))

    // 2. Calcular precios
    const cantidad = datos.servicio === 'cocina-modular'
      ? datos.metros_lineales ?? 0
      : datos.metros_cuadrados ?? 0

    const esVinil = datos.servicio === 'vinil-lvt' || datos.servicio === 'vinil-spc'
    const pisosSinAcond = ['granito', 'microcemento']
    const requiereAcondicionamiento = esVinil &&
      !!datos.tipo_piso_actual &&
      !pisosSinAcond.includes(datos.tipo_piso_actual)

    const precio = calcularCotizacion(datos.servicio!, cantidad, requiereAcondicionamiento)

    // 3. Insertar cotización
    const cotizaciones = await supabaseFetch('cotizaciones', {
      method: 'POST',
      body: {
        lead_id: leadId,
        servicio: datos.servicio,
        metros_cuadrados: datos.servicio !== 'cocina-modular' ? datos.metros_cuadrados : null,
        metros_lineales: datos.servicio === 'cocina-modular' ? datos.metros_lineales : null,
        color_seleccionado: datos.color_seleccionado || null,
        detalles_adicionales: [
          datos.tipo_piso_actual ? `Piso actual: ${datos.tipo_piso_actual}` : null,
          requiereAcondicionamiento ? 'Requiere acondicionamiento' : null,
          datos.detalles_adicionales || null,
        ].filter(Boolean).join(' | ') || null,
        precio_min: precio?.min ?? 0,
        precio_max: precio?.max ?? 0,
        estado: 'nuevo',
      },
    })

    const cotizacion = Array.isArray(cotizaciones) ? cotizaciones[0] : cotizaciones
    if (!cotizacion?.id) throw new Error('No se obtuvo ID de cotizacion: ' + JSON.stringify(cotizaciones))

    return NextResponse.json({ id: cotizacion.id, success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Error en /api/cotizacion:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
