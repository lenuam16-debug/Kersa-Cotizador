// Cloudflare Pages Function — maneja GET /api/render/:id
// Hace polling a Replicate para saber si el render terminó

interface Env {
  REPLICATE_API_TOKEN: string
  RP_A: string
  RP_B: string
}

interface ReplicatePrediction {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: string[] | string | null
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
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  }

  const replicateToken = env.REPLICATE_API_TOKEN || ((env.RP_A || '') + (env.RP_B || ''))
  const predictionId = params.id

  try {
    const res = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        'Authorization': `Bearer ${replicateToken}`,
      },
    })

    if (!res.ok) {
      throw new Error(`Replicate ${res.status}`)
    }

    const prediction = await res.json() as ReplicatePrediction

    if (prediction.status === 'succeeded') {
      const output = Array.isArray(prediction.output)
        ? prediction.output[0]
        : prediction.output
      return new Response(
        JSON.stringify({ status: 'completado', renderUrl: output }),
        { headers: corsHeaders }
      )
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      return new Response(
        JSON.stringify({ status: 'error', error: prediction.error || 'El render falló' }),
        { headers: corsHeaders }
      )
    }

    // starting | processing — sigue esperando
    return new Response(
      JSON.stringify({ status: 'procesando' }),
      { headers: corsHeaders }
    )
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
