export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  return new Response(JSON.stringify({ ok: true, env: process.env.SUPABASE_URL?.substring(0, 30) ?? 'NOT SET' }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
