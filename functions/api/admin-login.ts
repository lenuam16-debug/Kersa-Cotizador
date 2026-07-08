interface Env {
  ADMIN_PASSWORD: string
}

const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }

export async function onRequestOptions() {
  return new Response(null, { headers: { ...CORS, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } })
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    const { password } = await request.json() as { password: string }
    if (!env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Clave de administrador no configurada' }), { status: 500, headers: CORS })
    }
    if (password !== env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Clave incorrecta' }), { status: 401, headers: CORS })
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS })
  }
}
