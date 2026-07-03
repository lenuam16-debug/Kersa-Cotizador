export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calcularCotizacion } from '@/lib/pricing'
import { PasoForm } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
      return NextResponse.json({ error: `ENV no configuradas: URL=${supabaseUrl?.substring(0, 20)}` }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const datos: PasoForm = await req.json()

    const ciudadCompleta = datos.ciudad
      ? `${datos.ciudad} - ${datos.municipio ?? ''}`.trim().replace(/ - $/, '')
      : null

    // 1. Upsert lead por email (no necesita SELECT previo ni service role)
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .upsert(
        {
          name: datos.nombre,
          email: datos.email,
          telefono: datos.telefono,
          ciudad: ciudadCompleta,
          stage: 'cotizacion',
          platform: 'Cotizador Web',
        },
        { onConflict: 'email', ignoreDuplicates: false }
      )
      .select('id')
      .single()

    if (leadError || !lead) {
      throw new Error('Lead error: ' + JSON.stringify(leadError))
    }

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

    // 3. Guardar cotización
    const { data: cotizacion, error: cotError } = await supabase
      .from('cotizaciones')
      .insert({
        lead_id: lead.id,
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
      })
      .select('id')
      .single()

    if (cotError || !cotizacion) {
      throw new Error('Cotizacion error: ' + JSON.stringify(cotError))
    }

    return NextResponse.json({ id: cotizacion.id, success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Error en /api/cotizacion:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
