interface Env {
  REPLICATE_API_TOKEN: string
  RP_A: string
  RP_B: string
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
  const replicateToken = env.REPLICATE_API_TOKEN || ((env.RP_A || '') + (env.RP_B || ''))

  try {
    const { dataUri } = await request.json() as { dataUri: string }

    const res = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${replicateToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        version: 'ee871c19efb1941f55f66a3d7d960428c8a5afcb77449547fe8e5a3ab9ebc21c',
        input: {
          image: dataUri,
          mask_prompt: 'floor, flooring, wood floor, tile floor, ground',
          negative_mask_prompt: 'wall, ceiling, furniture, sofa, chair, table, door, window',
          adjustment_factor: -3,
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Replicate ${res.status}: ${err}`)
    }

    const prediction = await res.json() as { id: string }
    return new Response(JSON.stringify({ predictionId: prediction.id }), { headers: corsHeaders })
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
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
