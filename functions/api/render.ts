// Cloudflare Pages Function — maneja POST /api/render
// Llama a Replicate (adirik/interior-design) para generar el visualizador IA

interface Env {
  REPLICATE_API_TOKEN: string
  RP_A: string
  RP_B: string
}

const COLOR_NOMBRES: Record<string, string> = {
  'alaska': 'Alaska white oak wood plank',
  'alto-adicse': 'light warm beige wood plank',
  'arizona': 'Arizona warm brown oak plank',
  'dakota': 'Dakota rich brown wood plank',
  'denver': 'Denver cool gray oak plank',
  'grand-river': 'Grand River natural wood plank',
  'kingston': 'Kingston dark espresso wood plank',
  'manitova': 'Manitoba rustic reclaimed wood plank',
  'terry-fox': 'Terry Fox medium honey oak plank',
  'vicent-bay': 'Vicent Bay coastal driftwood plank',
  'lucca': 'Lucca beige stone tile',
  'padova': 'Padova light cream stone tile',
  'palermo': 'Palermo warm ivory stone tile',
  'positano': 'Positano warm sand stone tile',
  'siena': 'Siena terracotta stone tile',
  'blanco-mate': 'matte white',
  'gris-perla': 'pearl gray',
  'negro-mate': 'matte black',
  'madera-clara': 'light natural wood',
  'verde-sage': 'sage green',
}

function buildPrompt(servicio: string, colorId: string): string {
  const color = COLOR_NOMBRES[colorId] || colorId || 'natural'

  if (servicio === 'vinil-lvt') {
    return `photorealistic interior room with luxury vinyl LVT plank flooring, ${color} texture, modern clean interior design, professional architectural photography, realistic floor material, high resolution`
  }
  if (servicio === 'vinil-spc') {
    return `photorealistic interior room with rigid core SPC vinyl plank flooring, ${color} texture, modern interior design, professional architectural photography, realistic floor material, high resolution`
  }
  if (servicio === 'cocina-modular') {
    return `photorealistic modern kitchen with ${color} modular kitchen cabinets, clean contemporary kitchen design, professional interior photography, high resolution`
  }
  if (servicio === 'wallpanel' || servicio === 'laminas-pvc') {
    return `photorealistic interior room with ${color} decorative wall panels, modern clean interior design, professional architectural photography, high resolution`
  }
  return `photorealistic interior renovation with ${color} material finish, modern clean design, professional photography`
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  }

  const replicateToken = env.REPLICATE_API_TOKEN || ((env.RP_A || '') + (env.RP_B || ''))

  try {
    if (!replicateToken) {
      return new Response(
        JSON.stringify({ error: 'El token de Replicate no está configurado. Agrégalo en el dashboard de Cloudflare Pages.' }),
        { status: 500, headers: corsHeaders }
      )
    }

    const contentType = request.headers.get('content-type') || ''
    let dataUri: string | undefined
    let servicio = 'vinil-lvt'
    let colorId = ''

    if (contentType.includes('application/json')) {
      const body = await request.json() as { dataUri?: string; servicio?: string; color?: string }
      dataUri = body.dataUri
      servicio = body.servicio || 'vinil-lvt'
      colorId = body.color || ''
    } else {
      // Fallback: multipart form-data con imagen binaria
      const formData = await request.formData()
      const imagen = formData.get('imagen') as File | null
      servicio = (formData.get('servicio') as string) || 'vinil-lvt'
      colorId = (formData.get('color') as string) || ''
      if (imagen) {
        const buffer = await imagen.arrayBuffer()
        const bytes = new Uint8Array(buffer)
        let bin = ''
        for (let i = 0; i < bytes.byteLength; i += 8192) {
          bin += String.fromCharCode(...bytes.subarray(i, Math.min(i + 8192, bytes.byteLength)))
        }
        dataUri = `data:${imagen.type || 'image/jpeg'};base64,${btoa(bin)}`
      }
    }

    if (!dataUri) {
      return new Response(JSON.stringify({ error: 'No se recibió imagen' }), { status: 400, headers: corsHeaders })
    }

    const prompt = buildPrompt(servicio, colorId)

    const replicateRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${replicateToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: '76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38',
        input: {
          image: dataUri,
          prompt,
          guidance_scale: 15,
          negative_prompt: 'lowres, watermark, banner, logo, deformed, blurry, out of focus, ugly, unrealistic, cartoon',
          num_inference_steps: 50,
          prompt_strength: 0.8,
        },
      }),
    })

    if (!replicateRes.ok) {
      const errText = await replicateRes.text()
      const headers: Record<string, string> = {}
      replicateRes.headers.forEach((v, k) => { headers[k] = v })
      throw new Error(`Replicate ${replicateRes.status}: ${errText} | headers=${JSON.stringify(headers)}`)
    }

    const prediction = await replicateRes.json() as { id: string; status: string }

    return new Response(
      JSON.stringify({ predictionId: prediction.id, renderId: null }),
      { status: 200, headers: corsHeaders }
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: corsHeaders })
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
