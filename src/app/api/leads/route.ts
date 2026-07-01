export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const estado = searchParams.get('estado')
  const servicio = searchParams.get('servicio')
  const buscar = searchParams.get('q')

  let query = supabaseAdmin
    .from('cotizaciones')
    .select(`
      *,
      lead:leads(*)
    `)
    .order('created_at', { ascending: false })

  if (estado) query = query.eq('estado', estado)
  if (servicio) query = query.eq('servicio', servicio)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let resultado = data
  if (buscar) {
    const q = buscar.toLowerCase()
    resultado = data.filter((c: any) =>
      c.lead?.name?.toLowerCase().includes(q) ||
      c.lead?.email?.toLowerCase().includes(q) ||
      c.lead?.telefono?.includes(q)
    )
  }

  return NextResponse.json(resultado)
}
