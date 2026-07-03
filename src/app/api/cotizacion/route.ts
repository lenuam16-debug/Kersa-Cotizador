export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { calcularCotizacion } from '@/lib/pricing'
import { PasoForm } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const datos: PasoForm = await req.json()

    // 1. Guardar o buscar el lead (compatible con esquema CRM: name, email, telefono, ciudad)
    const { data: leadExistente } = await supabaseAdmin
      .from('leads')
      .select('id')
      .eq('email', datos.email)
      .maybeSingle()

    let leadId: string

    if (leadExistente) {
      leadId = leadExistente.id
      await supabaseAdmin
        .from('leads')
        .update({
          name: datos.nombre,
          telefono: datos.telefono,
          ciudad: datos.ciudad ? `${datos.ciudad} - ${datos.municipio ?? ''}`.trim().replace(/ - $/, '') : null,
        })
        .eq('id', leadId)
    } else {
      const { data: nuevoLead, error: leadError } = await supabaseAdmin
        .from('leads')
        .insert({
          name: datos.nombre,
          email: datos.email,
          telefono: datos.telefono,
          ciudad: datos.ciudad ? `${datos.ciudad} - ${datos.municipio ?? ''}`.trim().replace(/ - $/, '') : null,
          fecha_proyecto: datos.fecha_proyecto || null,
          stage: 'cotizacion',
          platform: 'WhatsApp',
        })
        .select('id')
        .single()

      if (leadError || !nuevoLead) {
        throw new Error('Lead error: ' + JSON.stringify(leadError))
      }
      leadId = nuevoLead.id
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
    const { data: cotizacion, error: cotError } = await supabaseAdmin
      .from('cotizaciones')
      .insert({
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
