export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const res = await fetch(`https://api.replicate.com/v1/predictions/${params.id}`, {
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
      },
    })

    const prediction = await res.json()

    if (prediction.status === 'succeeded' && prediction.output) {
      const renderUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output

      // Actualizar en DB si tenemos renderId
      const renderId = req.nextUrl.searchParams.get('renderId')
      if (renderId) {
        await supabaseAdmin
          .from('renders')
          .update({ imagen_render_url: renderUrl, estado: 'completado' })
          .eq('id', renderId)
      }

      return NextResponse.json({ status: 'completado', renderUrl })
    }

    if (prediction.status === 'failed') {
      return NextResponse.json({ status: 'error', error: prediction.error })
    }

    return NextResponse.json({ status: 'procesando' })
  } catch (error) {
    return NextResponse.json({ error: 'Error consultando render' }, { status: 500 })
  }
}
