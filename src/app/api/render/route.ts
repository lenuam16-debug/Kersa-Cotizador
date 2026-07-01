export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { SERVICIOS, COLORES_VINIL, COLORES_COCINA } from '@/lib/pricing'
import { Servicio } from '@/types'

const REPLICATE_API = 'https://api.replicate.com/v1/predictions'

function buildPrompt(servicio: Servicio, colorId?: string): string {
  const allColors = [...COLORES_VINIL, ...COLORES_COCINA]
  const colorNombre = allColors.find(c => c.id === colorId)?.nombre ?? ''

  const prompts: Record<Servicio, string> = {
    'vinil-lvt': `photorealistic interior room with luxury vinyl plank flooring in ${colorNombre || 'natural oak'} color, high quality installation, modern home, bright lighting, professional interior design photo, 8k`,
    'laminas-pvc': `photorealistic interior room with white PVC ceiling panels installed, modern home, bright lighting, clean finish, professional interior design photo, 8k`,
    'wallpanel': `photorealistic interior room with decorative wall panels ${colorNombre || 'white'}, modern home, bright natural lighting, luxury interior design, professional photo, 8k`,
    'cocina-modular': `photorealistic modern modular kitchen with ${colorNombre || 'white matte'} cabinets, clean design, built-in refrigerator enclosure, bright lighting, professional interior design photo, 8k`,
  }

  return prompts[servicio]
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const imagen = formData.get('imagen') as File
    const servicio = formData.get('servicio') as Servicio
    const colorId = formData.get('color') as string | null
    const cotizacionId = formData.get('cotizacion_id') as string | null

    if (!imagen || !servicio) {
      return NextResponse.json({ error: 'Imagen y servicio requeridos' }, { status: 400 })
    }

    // 1. Subir imagen original a Supabase Storage
    const buffer = Buffer.from(await imagen.arrayBuffer())
    const nombreArchivo = `renders/${Date.now()}-original.${imagen.name.split('.').pop()}`

    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('renders')
      .upload(nombreArchivo, buffer, { contentType: imagen.type })

    if (uploadError) throw new Error('Error subiendo imagen: ' + uploadError.message)

    const { data: urlData } = supabaseAdmin.storage.from('renders').getPublicUrl(nombreArchivo)
    const imagenUrl = urlData.publicUrl

    // 2. Guardar render en DB como "procesando"
    const { data: renderRecord } = await supabaseAdmin
      .from('renders')
      .insert({
        cotizacion_id: cotizacionId || null,
        imagen_original_url: imagenUrl,
        servicio,
        color_seleccionado: colorId || null,
        estado: 'procesando',
      })
      .select('id')
      .single()

    // 3. Llamar a Replicate (img2img con ControlNet)
    const prompt = buildPrompt(servicio, colorId ?? undefined)

    const replicateRes = await fetch(REPLICATE_API, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'aff48af9c68d162388d230a2ab003f68d2638d88e3c0de58720f6be9b46debff', // controlnet-hough
        input: {
          image: imagenUrl,
          prompt,
          negative_prompt: 'ugly, blurry, low quality, distorted, people, text',
          num_inference_steps: 30,
          guidance_scale: 7.5,
          image_resolution: 768,
          detect_resolution: 768,
        },
      }),
    })

    if (!replicateRes.ok) {
      const errBody = await replicateRes.text()
      throw new Error('Replicate error: ' + errBody)
    }

    const prediction = await replicateRes.json()

    return NextResponse.json({
      renderId: renderRecord?.id,
      predictionId: prediction.id,
      imagenOriginal: imagenUrl,
    })
  } catch (error) {
    console.error('Error en /api/render:', error)
    return NextResponse.json({ error: 'Error generando render' }, { status: 500 })
  }
}
