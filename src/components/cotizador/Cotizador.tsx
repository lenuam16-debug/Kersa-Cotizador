'use client'

import { useState } from 'react'
import { PasoForm, Servicio } from '@/types'
import BarraProgreso from './BarraProgreso'
import PasoServicio from './PasoServicio'
import PasoEspecificaciones from './PasoEspecificaciones'
import PasoDatos from './PasoDatos'
import PasoResultado from './PasoResultado'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const TOTAL_PASOS = 4

export default function Cotizador() {
  const [paso, setPaso] = useState(0)
  const [datos, setDatos] = useState<PasoForm>({})
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cotizacionId, setCotizacionId] = useState<string | undefined>()

  const actualizar = (d: Partial<PasoForm>) => setDatos(prev => ({ ...prev, ...d }))

  const puedeAvanzar = () => {
    if (paso === 0) return !!datos.servicio
    if (paso === 1) {
      const esCocina = datos.servicio === 'cocina-modular'
      const cantidad = esCocina ? datos.metros_lineales : datos.metros_cuadrados
      return !!cantidad && cantidad > 0
    }
    if (paso === 2) {
      return !!(datos.nombre?.trim() && datos.telefono?.trim() && datos.email?.trim() && datos.ciudad?.trim())
    }
    return true
  }

  const enviarCotizacion = async () => {
    setEnviando(true)
    setError(null)
    try {
      const res = await fetch('/api/cotizacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      })
      if (!res.ok) throw new Error('Error al guardar la cotización')
      const json = await res.json()
      setCotizacionId(json.id)
      setPaso(3)
    } catch (e) {
      setError('Hubo un problema al enviar. Por favor intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  const siguiente = async () => {
    if (paso === 2) {
      await enviarCotizacion()
    } else {
      setPaso(p => p + 1)
    }
  }

  const anterior = () => setPaso(p => p - 1)

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #e8eef8 0%, #c8d8f0 100%)' }}>
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="https://kersadesign.com/imagenes/embed_000_dc2feea6.png"
            alt="Kersa Design"
            className="h-14 mx-auto mb-2 object-contain"
          />
          <p className="text-gray-500 text-xs mt-1 tracking-widest uppercase">Cotizador Online</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8">
          {paso < TOTAL_PASOS - 1 && (
            <BarraProgreso pasoActual={paso} totalPasos={TOTAL_PASOS} />
          )}

          {/* Contenido de cada paso */}
          <div className="min-h-[400px]">
            {paso === 0 && (
              <PasoServicio
                seleccionado={datos.servicio}
                onSelect={(s: Servicio) => actualizar({ servicio: s })}
              />
            )}
            {paso === 1 && datos.servicio && (
              <PasoEspecificaciones
                servicio={datos.servicio}
                datos={datos}
                onChange={actualizar}
              />
            )}
            {paso === 2 && (
              <PasoDatos datos={datos} onChange={actualizar} />
            )}
            {paso === 3 && (
              <PasoResultado datos={datos} cotizacionId={cotizacionId} />
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Navegación */}
          {paso < TOTAL_PASOS - 1 && (
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={anterior}
                disabled={paso === 0}
                className={cn(
                  'flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all',
                  paso === 0
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <ArrowLeft className="w-4 h-4" />
                Anterior
              </button>

              <button
                onClick={siguiente}
                disabled={!puedeAvanzar() || enviando}
                style={puedeAvanzar() && !enviando ? { backgroundColor: '#134a9c' } : {}}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all',
                  puedeAvanzar() && !enviando
                    ? 'text-white shadow-md hover:shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                )}
              >
                {enviando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : paso === 2 ? (
                  <>Ver mi cotización</>
                ) : (
                  <>
                    Siguiente
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          © {new Date().getFullYear()} KersaDesign · Todos los derechos reservados
        </p>
      </div>
    </div>
  )
}

