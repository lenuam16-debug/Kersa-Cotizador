// Proxy para imágenes de kersadesign.com — permite usarlas en canvas sin CORS
export async function onRequestGet({ request }: { request: Request }) {
  const url = new URL(request.url)
  const imageUrl = url.searchParams.get('url')

  if (!imageUrl || !imageUrl.startsWith('https://kersadesign.com/')) {
    return new Response('URL no permitida', { status: 400 })
  }

  const res = await fetch(imageUrl)
  if (!res.ok) {
    return new Response('No encontrado', { status: 404 })
  }

  const blob = await res.blob()
  return new Response(blob, {
    headers: {
      'Content-Type': res.headers.get('content-type') || 'image/jpeg',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
