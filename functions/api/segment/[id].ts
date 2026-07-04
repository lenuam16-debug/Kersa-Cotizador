interface Env {
  REPLICATE_API_TOKEN: string
  RP_A: string
  RP_B: string
}

interface ReplicatePrediction {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: { mask?: string; segmented_images?: string[]; annotated_image?: string } | null
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
      // Grounded SAM devuelve mask o segmented_images[0]
      const maskUrl = prediction.output.mask || prediction.output.segmented_images?.[0] || null
      if (!maskUrl) {
        return new Response(JSON.stringify({ status: 'error', error: 'No se detectó suelo en la imagen' }), { headers: corsHeaders })
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
