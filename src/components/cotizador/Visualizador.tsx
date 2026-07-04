'use client'

import { useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Servicio } from '@/types'
import { SERVICIOS, COLORES_VINIL, COLORES_COCINA } from '@/lib/pricing'
import { cn } from '@/lib/utils'
import { Upload, Loader2, ArrowLeft, Sparkles, Download, Lock } from 'lucide-react'
import Link from 'next/link'

function getColores(servicio: Servicio) {
  if (servicio === 'cocina-modular') return COLORES_COCINA
  if (servicio === 'vinil-lvt' || servicio === 'vinil-spc') return COLORES_VINIL
  return []
}

export default function Visualizador() {
  const searchParams = useSearchParams()
  const cotizacionId = searchParams.get('cotizacion')

  // Si viene de la cotización, el servicio queda bloqueado
  const servicioParam = searchParams.get('servicio') as Servicio | null
  const colorParam = searchParams.get('color') || ''
  const bloqueado = !!servicioParam

  const [servicio, setServicio] = useState<Servicio>(servicioParam || 'vinil-lvt')
  const [colorId, setColorId] = useState<string>(colorParam)
  const [imagen, setImagen] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [generando, setGenerando] = useState(false)
  const [renderUrl, setRenderUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progreso, setProgreso] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const colores = getColores(servicio)
  const infoServicio = SERVICIOS[servicio]

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })

  const imagenADataUri = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const MAX_SIZE = 900
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const ratio = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * ratio)
        canvas.height = Math.round(img.height * ratio)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      }
      img.src = url
    })

  // Aplica la textura del material sobre el área del suelo usando la máscara de SAM
  const aplicarTextura = async (roomDataUri: string, maskUrl: string, textureUrl: string): Promise<string> => {
    const [roomImg, maskImg, textureImg] = await Promise.all([
      loadImage(roomDataUri),
      loadImage(maskUrl),
      loadImage(`/api/material?url=${encodeURIComponent(textureUrl)}`),
    ])

    const W = roomImg.naturalWidth
    const H = roomImg.naturalHeight

    // Canvas base: habitación original
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(roomImg, 0, 0, W, H)

    // Convertir máscara JPEG (blanco/negro) a canal alpha
    // — los JPEGs no tienen alpha, hay que usar la luminancia como máscara
    const maskCanvas = document.createElement('canvas')
    maskCanvas.width = W; maskCanvas.height = H
    const maskCtx = maskCanvas.getContext('2d')!
    maskCtx.drawImage(maskImg, 0, 0, W, H)
    const maskData = maskCtx.getImageData(0, 0, W, H)
    for (let i = 0; i < maskData.data.length; i += 4) {
      const lum = maskData.data[i] * 0.299 + maskData.data[i + 1] * 0.587 + maskData.data[i + 2] * 0.114
      maskData.data[i] = 0
      maskData.data[i + 1] = 0
      maskData.data[i + 2] = 0
      maskData.data[i + 3] = lum // blanco → opaco, negro → transparente
    }
    maskCtx.putImageData(maskData, 0, 0)

    // Proporciones reales lámina LVT: 1.22m × 0.23m → ratio 5.3:1
    const PLANK_RATIO = 1.22 / 0.23  // ≈ 5.3
    const plankH = Math.round(W * 0.065)
    const plankW = Math.round(plankH * PLANK_RATIO)

    // Tilear láminas con patrón alterno sin GAP visible (LVT se instala sin junta)
    const texCanvas = document.createElement('canvas')
    texCanvas.width = W; texCanvas.height = H
    const tCtx = texCanvas.getContext('2d')!

    // Precalcular variaciones de brillo por fila (simula vetas distintas entre láminas)
    const rowBrightness: number[] = []
    const totalRows = Math.ceil(H / plankH) + 2
    for (let i = 0; i < totalRows; i++) {
      rowBrightness.push((Math.random() - 0.5) * 0.08) // ±4% brillo
    }

    for (let row = -1; row * plankH < H + plankH; row++) {
      const y = row * plankH
      const offsetX = (row % 2 === 0) ? 0 : -(plankW / 2)
      const rowIdx = row + 1

      for (let col = -1; col * plankW + offsetX < W + plankW; col++) {
        const x = col * plankW + offsetX

        // Lámina base
        tCtx.drawImage(textureImg, Math.round(x), Math.round(y), plankW, plankH)

        // Variación sutil de brillo por lámina (diferente columna = diferente offset)
        const bright = rowBrightness[rowIdx] + (Math.random() - 0.5) * 0.04
        if (bright > 0) {
          tCtx.fillStyle = `rgba(255,255,255,${bright})`
        } else {
          tCtx.fillStyle = `rgba(0,0,0,${Math.abs(bright)})`
        }
        tCtx.fillRect(Math.round(x), Math.round(y), plankW, plankH)
      }

      // Micro-bisel: sombra de 1px al borde inferior de cada fila (simula unión LVT)
      tCtx.fillStyle = 'rgba(0,0,0,0.12)'
      tCtx.fillRect(0, Math.round(y) + plankH - 1, W, 1)
    }

    // Recortar al área del suelo usando la máscara con alpha correcto
    tCtx.globalCompositeOperation = 'destination-in'
    tCtx.drawImage(maskCanvas, 0, 0, W, H)

    // Cobertura total: reemplaza completamente el suelo existente
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1.0
    ctx.drawImage(texCanvas, 0, 0)

    // Restaurar la iluminación/sombras del suelo original encima
    const lumCanvas = document.createElement('canvas')
    lumCanvas.width = W; lumCanvas.height = H
    const lCtx = lumCanvas.getContext('2d')!
    lCtx.drawImage(roomImg, 0, 0, W, H)
    lCtx.globalCompositeOperation = 'destination-in'
    lCtx.drawImage(maskCanvas, 0, 0, W, H)

    ctx.globalCompositeOperation = 'luminosity'
    ctx.globalAlpha = 0.32
    ctx.drawImage(lumCanvas, 0, 0)

    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'

    return canvas.toDataURL('image/jpeg', 0.9)
  }

  const handleImagen = useCallback((file: File) => {
    setImagen(file)
    setRenderUrl(null)
    const reader = new FileReader()
    reader.onloadend = () => setImagenPreview(reader.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleImagen(file)
  }

  const generarRender = async () => {
    if (!imagen) return
    setGenerando(true)
    setError(null)
    setProgreso(5)

    try {
      const colorEncontrado = colores.find(c => c.id === colorId)
      const materialUrl = colorEncontrado?.imagen
      const dataUri = await imagenADataUri(imagen)
      setProgreso(15)

      // Paso 1: segmentar el suelo con SAM
      const segRes = await fetch('/api/segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUri }),
      })
      if (!segRes.ok) {
        const d = await segRes.json().catch(() => ({}))
        throw new Error((d as { error?: string }).error || 'Error iniciando segmentación')
      }
      const { predictionId } = await segRes.json() as { predictionId: string }
      setProgreso(25)

      // Paso 2: polling hasta tener la máscara
      let maskUrl = ''
      let intentos = 0
      const MAX = 40
      while (intentos < MAX) {
        await new Promise(r => setTimeout(r, 2500))
        intentos++
        setProgreso(Math.min(25 + (intentos / MAX) * 55, 80))

        const poll = await fetch(`/api/segment/${predictionId}`)
        const data = await poll.json() as { status: string; maskUrl?: string; error?: string }

        if (data.status === 'completado' && data.maskUrl) {
          maskUrl = data.maskUrl
          break
        }
        if (data.status === 'error') {
          throw new Error(data.error ?? 'Segmentación fallida')
        }
      }
      if (!maskUrl) throw new Error('La segmentación tardó demasiado. Intenta de nuevo.')
      setProgreso(85)

      // Paso 3: aplicar textura del producto sobre el suelo detectado
      if (!materialUrl) throw new Error('Este color no tiene imagen de textura')
      const resultDataUri = await aplicarTextura(dataUri, maskUrl, materialUrl)
      setRenderUrl(resultDataUri)
      setProgreso(100)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-blue-50/30 p-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8 pt-4">
          <Link href="/cotizador" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              Visualizador <span className="text-blue-500">IA</span>
            </h1>
            <p className="text-gray-500 text-sm">Sube tu foto y ve cómo quedaría</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">

          {/* Servicio — bloqueado si viene de cotización, libre si entra directo */}
          {bloqueado ? (
            <div className="bg-white rounded-2xl p-5 border border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Visualizando</p>
                <p className="text-base font-bold text-gray-800">
                  {infoServicio.icono} {infoServicio.nombre}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
                <Lock className="w-3 h-3" />
                Según tu cotización
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-3">¿Qué quieres visualizar?</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.entries(SERVICIOS) as [Servicio, typeof SERVICIOS[Servicio]][]).map(([key, s]) => (
                  <button
                    key={key}
                    onClick={() => { setServicio(key); setColorId(''); setRenderUrl(null) }}
                    className={cn(
                      'p-3 rounded-xl border-2 text-center transition-all text-sm font-medium',
                      servicio === key
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-gray-200 text-gray-600 hover:border-blue-200'
                    )}
                  >
                    <span className="text-xl block mb-1">{s.icono}</span>
                    {s.nombre.split(' ').slice(0, 2).join(' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selector de color — solo para servicios con colores */}
          {colores.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-1">Color / acabado</p>
              {colorId && (
                <p className="text-xs text-blue-600 mb-3 font-medium">
                  Seleccionado: {colores.find(c => c.id === colorId)?.nombre ?? colorId}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                {colores.map(c => {
                  const seleccionado = colorId === c.id
                  return (
                    <button
                      key={c.id}
                      onClick={() => { setColorId(c.id); setRenderUrl(null) }}
                      title={c.nombre}
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl border-2 transition-all overflow-hidden',
                          seleccionado
                            ? 'border-blue-500 scale-110 shadow-md'
                            : 'border-transparent hover:border-gray-300 hover:scale-105'
                        )}
                        style={
                          c.imagen
                            ? { backgroundImage: `url(${c.imagen})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                            : { backgroundColor: c.hex }
                        }
                      />
                      <span className={cn(
                        'text-xs transition-colors',
                        seleccionado ? 'text-blue-700 font-semibold' : 'text-gray-500 group-hover:text-gray-700'
                      )}>
                        {c.nombre.split(' ')[0]}
                      </span>
                    </button>
                  )
                })}
              </div>
              {!colorId && (
                <p className="text-xs text-amber-600 mt-3">Selecciona un color para mejores resultados</p>
              )}
            </div>
          )}

          {/* Zona de upload */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-3">Foto de tu espacio</p>

            {!imagenPreview ? (
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-all"
              >
                <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Arrastra tu foto aquí</p>
                <p className="text-gray-400 text-sm mt-1">o haz clic para seleccionar</p>
                <p className="text-xs text-gray-300 mt-2">JPG, PNG — Máx. 10MB</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Antes / Después */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1 text-center">Tu espacio</p>
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                      <img src={imagenPreview} alt="Original" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1 text-center">Con el material</p>
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                      {renderUrl ? (
                        <img src={renderUrl} alt="Render" className="w-full h-full object-cover" />
                      ) : generando ? (
                        <div className="text-center p-4">
                          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
                          <p className="text-xs text-gray-400">Generando... {Math.round(progreso)}%</p>
                          <div className="mt-2 h-1 bg-gray-200 rounded-full">
                            <div
                              className="h-full bg-blue-400 rounded-full transition-all duration-1000"
                              style={{ width: `${progreso}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-4">
                          <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs text-gray-400">El render aparecerá aquí</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3">
                  <button
                    onClick={() => { setImagenPreview(null); setImagen(null); setRenderUrl(null) }}
                    className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cambiar foto
                  </button>
                  {renderUrl ? (
                    <a
                      href={renderUrl}
                      download="visualizacion-kersadesign.jpg"
                      className="flex-1 bg-green-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Descargar
                    </a>
                  ) : (
                    <button
                      onClick={generarRender}
                      disabled={generando}
                      className="flex-1 bg-blue-500 text-white rounded-xl py-2.5 px-6 text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {generando ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
                      ) : (
                        <><Sparkles className="w-4 h-4" /> Generar con IA</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleImagen(e.target.files[0])}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-900">
            <strong>Consejo:</strong> Para mejores resultados, toma la foto con buena iluminación mostrando el piso o pared de frente. La IA tarda entre 20-40 segundos.
          </div>
        </div>
      </div>
    </div>
  )
}
