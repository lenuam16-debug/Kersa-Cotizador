'use client'

import { useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Servicio } from '@/types'
import { SERVICIOS, COLORES_VINIL, COLORES_COCINA } from '@/lib/pricing'
import { cn } from '@/lib/utils'
import { Upload, Camera, Loader2, ArrowLeft, Sparkles, Download } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function Visualizador() {
  const searchParams = useSearchParams()
  const cotizacionId = searchParams.get('cotizacion')

  const [imagen, setImagen] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [servicio, setServicio] = useState<Servicio>('vinil-lvt')
  const [colorId, setColorId] = useState<string>('')
  const [generando, setGenerando] = useState(false)
  const [renderUrl, setRenderUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progreso, setProgreso] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const colores = servicio === 'cocina-modular' ? COLORES_COCINA : COLORES_VINIL

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
    setProgreso(10)

    try {
      const fd = new FormData()
      fd.append('imagen', imagen)
      fd.append('servicio', servicio)
      if (colorId) fd.append('color', colorId)
      if (cotizacionId) fd.append('cotizacion_id', cotizacionId)

      const res = await fetch('/api/render', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Error iniciando render')
      const { predictionId, renderId } = await res.json()

      setProgreso(30)

      // Polling hasta que el render esté listo
      let intentos = 0
      const MAX = 60
      while (intentos < MAX) {
        await new Promise(r => setTimeout(r, 3000))
        intentos++
        setProgreso(Math.min(30 + (intentos / MAX) * 65, 95))

        const poll = await fetch(`/api/render/${predictionId}?renderId=${renderId}`)
        const data = await poll.json()

        if (data.status === 'completado') {
          setRenderUrl(data.renderUrl)
          setProgreso(100)
          break
        }
        if (data.status === 'error') {
          throw new Error(data.error ?? 'El render falló')
        }
      }

      if (intentos >= MAX) throw new Error('El render tardó demasiado. Intenta de nuevo.')
    } catch (e: any) {
      setError(e.message)
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
          {/* Selector de servicio */}
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

          {/* Selector de color */}
          {(servicio === 'vinil-lvt' || servicio === 'cocina-modular') && (
            <div className="bg-white rounded-2xl p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-3">Color / acabado</p>
              <div className="flex flex-wrap gap-3">
                {colores.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setColorId(c.id); setRenderUrl(null) }}
                    title={c.nombre}
                    className={cn(
                      'flex flex-col items-center gap-1',
                    )}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg border-2 transition-all',
                        colorId === c.id ? 'border-blue-500 scale-110' : 'border-transparent hover:border-gray-300'
                      )}
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-xs text-gray-500">{c.nombre.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Upload zona */}
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
                {/* Vista antes/después */}
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
                          <p className="text-xs text-gray-400">Generando... {progreso}%</p>
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
                      download="render-kersadesign.jpg"
                      target="_blank"
                      className="flex-1 bg-green-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Descargar render
                    </a>
                  ) : (
                    <button
                      onClick={generarRender}
                      disabled={generando}
                      className="flex-2 bg-blue-500 text-white rounded-xl py-2.5 px-6 text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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
              {error}
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-900">
            <strong>Consejo:</strong> Para mejores resultados, toma la foto con buena iluminación y mostrando el piso o pared que deseas cambiar de frente. La IA tarda entre 20-40 segundos.
          </div>
        </div>
      </div>
    </div>
  )
}

