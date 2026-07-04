interface Env {
  REPLICATE_API_TOKEN: string
  RP_A: string
  RP_B: string
}

interface ReplicatePrediction {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  // schananas/grounded_sam devuelve array de URLs: [mask_combined, mask1, mask2, ...]
  output?: string[] | { mask?: string; segmented_images?: string[] } | null
  error?: string | null
}

export async function onRequestGet({
  env,
  params,
}: {
  request: Request
  env: Env
  params: Record<string, string>
}) {
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
  const replicateToken = env.REPLICATE_API_TOKEN || ((env.RP_A || '') + (env.RP_B || ''))

  try {
    const res = await fetch(`https://api.replicate.com/v1/predictions/${params.id}`, {
      headers: { 'Authorization': `Bearer ${replicateToken}` },
    })

    if (!res.ok) throw new Error(`Replicate ${res.status}`)

    const prediction = await res.json() as ReplicatePrediction

    if (prediction.status === 'succeeded' && prediction.output) {
      // schananas/grounded_sam devuelve array de URLs [imagen_anotada, mascara1, mascara2...]
      // o un objeto con mask/segmented_images según la versión
      let maskUrl: string | null = null
      if (Array.isArray(prediction.output)) {
        // schananas/grounded_sam output: [annotated, neg_annotated, mask, inverted_mask]
        // output[2] es la máscara limpia blanco/negro que necesitamos para el canvas
        maskUrl = prediction.output[2] || prediction.output[0] || null
      } else if (prediction.output && typeof prediction.output === 'object') {
        const out = prediction.output as { mask?: string; segmented_images?: string[] }
        maskUrl = out.mask || out.segmented_images?.[0] || null
      }

      // Devolver también el raw output para debug si hay problemas
      if (!maskUrl) {
        return new Response(JSON.stringify({ status: 'error', error: 'No se detectó suelo en la imagen', rawOutput: prediction.output }), { headers: corsHeaders })
      }
      return new Response(JSON.stringify({ status: 'completado', maskUrl }), { headers: corsHeaders })
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      return new Response(JSON.stringify({ status: 'error', error: prediction.error || 'Segmentación fallida' }), { headers: corsHeaders })
    }

    return new Response(JSON.stringify({ status: 'procesando' }), { headers: corsHeaders })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ status: 'error', error: msg }), { headers: corsHeaders })
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
