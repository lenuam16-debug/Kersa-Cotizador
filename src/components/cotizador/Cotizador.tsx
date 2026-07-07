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
import { validNombre, validTelefono, validEmail } from './PasoDatos'

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
      const esVinil = datos.servicio === 'vinil-lvt' || datos.servicio === 'vinil-spc'
      const tieneColores = esVinil || esCocina
      const cantidad = esCocina ? datos.metros_lineales : datos.metros_cuadrados
      if (!cantidad || cantidad <= 0) return false
      if (esVinil && !datos.tipo_piso_actual) return false
      if (tieneColores && !datos.color_seleccionado) return false
      return true
    }
    if (paso === 2) {
      return !!(
        validNombre(datos.nombre ?? '') &&
        validTelefono(datos.telefono ?? '') &&
        datos.telefono_verificado &&
        validEmail(datos.email ?? '') &&
        datos.ciudad?.trim() &&
        datos.municipio?.trim()
      )
    }
    return true
  }

  const enviarCotizacion = async () => {
    setEnviando(true)
    setError(null)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://awscrogqprosivmtgkio.supabase.co'
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3c2Nyb2dxcHJvc2l2bXRna2lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMjQ1NDIsImV4cCI6MjA5NzkwMDU0Mn0.WcYei2z8UGNCTQaWKSTNeWEJByWKTNqHyyCrwcPPnTQ'

      const headers = {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation',
      }

      const ciudadCompleta = datos.ciudad
        ? `${datos.ciudad} - ${datos.municipio ?? ''}`.trim().replace(/ - $/, '')
        : null

      // 1. Upsert lead
      const leadsRes = await fetch(`${supabaseUrl}/rest/v1/leads`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation,resolution=merge-duplicates', 'on-conflict': 'email' },
        body: JSON.stringify({
          name: datos.nombre, email: datos.email, telefono: datos.telefono,
          ciudad: ciudadCompleta, stage: 'cotizacion', platform: 'Cotizador Web',
        }),
      })
      const leads = await leadsRes.json()
      if (!leadsRes.ok) throw new Error('Error guardando lead: ' + JSON.stringify(leads))
      const leadId = Array.isArray(leads) ? leads[0]?.id : leads?.id
      if (!leadId) throw new Error('No se obtuvo ID del lead')

      // 2. Calcular precio client-side
      const { calcularCotizacion } = await import('@/lib/pricing')
      const esVinil = datos.servicio === 'vinil-lvt' || datos.servicio === 'vinil-spc'
      const cantidad = datos.servicio === 'cocina-modular' ? (datos.metros_lineales ?? 0) : (datos.metros_cuadrados ?? 0)
      const requiereAcond = esVinil && !!datos.tipo_piso_actual && !['granito', 'microcemento'].includes(datos.tipo_piso_actual)
      const precio = calcularCotizacion(datos.servicio!, cantidad, requiereAcond)

      // 3. Insert cotización
      const cotRes = await fetch(`${supabaseUrl}/rest/v1/cotizaciones`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          lead_id: leadId, servicio: datos.servicio,
          metros_cuadrados: datos.servicio !== 'cocina-modular' ? datos.metros_cuadrados : null,
          metros_lineales: datos.servicio === 'cocina-modular' ? datos.metros_lineales : null,
          color_seleccionado: datos.color_seleccionado || null,
          detalles_adicionales: [
            datos.tipo_piso_actual ? `Piso actual: ${datos.tipo_piso_actual}` : null,
            requiereAcond ? 'Requiere acondicionamiento' : null,
            datos.detalles_adicionales || null,
          ].filter(Boolean).join(' | ') || null,
          precio_min: precio?.min ?? 0, precio_max: precio?.max ?? 0, estado: 'nuevo',
        }),
      })
      const cotizaciones = await cotRes.json()
      if (!cotRes.ok) throw new Error('Error guardando cotización: ' + JSON.stringify(cotizaciones))
      const cot = Array.isArray(cotizaciones) ? cotizaciones[0] : cotizaciones
      if (!cot?.id) throw new Error('No se obtuvo ID de cotización')

      setCotizacionId(cot.id)
      setPaso(3)
    } catch (e) {
      setError('Error: ' + (e instanceof Error ? e.message : String(e)))
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
                onSelect={(s: Servicio) => { actualizar({ servicio: s }); setPaso(1) }}
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

          {/* Aviso de campos faltantes */}
          {paso === 1 && !puedeAvanzar() && (() => {
            const esCocina = datos.servicio === 'cocina-modular'
            const esVinil = datos.servicio === 'vinil-lvt' || datos.servicio === 'vinil-spc'
            const tieneColores = esVinil || esCocina
            const cantidad = esCocina ? datos.metros_lineales : datos.metros_cuadrados
            const falta = []
            if (!cantidad || cantidad <= 0) falta.push(esCocina ? 'metros lineales de cocina' : 'área aproximada en m²')
            if (esVinil && !datos.tipo_piso_actual) falta.push('tipo de piso actual')
            if (tieneColores && !datos.color_seleccionado) falta.push('modelo / color')
            return (
              <p className="mt-4 text-center text-sm text-amber-600 font-medium">
                ⚠ Completa los siguientes campos: {falta.join(' y ')}
              </p>
            )
          })()}
          {paso === 2 && !puedeAvanzar() && (() => {
            const falta = []
            if (!validNombre(datos.nombre ?? '')) falta.push('nombre completo (nombre y apellido)')
            if (!validTelefono(datos.telefono ?? '')) falta.push('teléfono válido (0412/0414/0416/0424/0426)')
            else if (!datos.telefono_verificado) falta.push('verificar el número por WhatsApp')
            if (!validEmail(datos.email ?? '')) falta.push('correo electrónico válido')
            if (!datos.ciudad?.trim()) falta.push('estado')
            if (!datos.municipio?.trim()) falta.push('municipio')
            return (
              <p className="mt-4 text-center text-sm text-amber-600 font-medium">
                ⚠ Falta: {falta.join(' · ')}
              </p>
            )
          })()}

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

