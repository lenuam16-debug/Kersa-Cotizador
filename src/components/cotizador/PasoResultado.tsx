'use client'

import { useState } from 'react'
import { PasoForm } from '@/types'
import { SERVICIOS, calcularCotizacion, COLORES_VINIL, COLORES_COCINA } from '@/lib/pricing'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle, CalendarCheck, MessageCircle, Printer, Loader2, AlertCircle } from 'lucide-react'
import { track } from '@/lib/track'

interface Props {
  datos: PasoForm
  cotizacionId?: string
  leadId?: string
}

// Agenda propia (tabla visitas del CRM) vía la función agenda-cotizador
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://awscrogqprosivmtgkio.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3c2Nyb2dxcHJvc2l2bXRna2lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMjQ1NDIsImV4cCI6MjA5NzkwMDU0Mn0.WcYei2z8UGNCTQaWKSTNeWEJByWKTNqHyyCrwcPPnTQ'

function horaTxt(h: number): string {
  if (h < 12) return `${h}:00 am`
  if (h === 12) return '12:00 m'
  return `${h - 12}:00 pm`
}

interface DiaDisponible { fecha: string; dia: string; libres: number[] }

const FLETES: Record<string, number> = {
  'Caracas (Distrito Capital)': 40,
  'Miranda': 60,
  'La Guaira (Vargas)': 80,
}

function getFlete(ciudad?: string): number | null {
  if (!ciudad) return null
  for (const [key, val] of Object.entries(FLETES)) {
    if (ciudad.toLowerCase().includes(key.toLowerCase())) return val
  }
  return null
}

const COSTO_PERFIL_TERMINACION = 30 // $ por unidad (fijo para LVT)
const COSTO_ACOND_M2 = 3             // $ base por m²

/**
 * Agenda inline: cupos reales de la tabla `visitas` (la misma agenda del CRM
 * y la app de Kersa). Sustituye el enlace de Google Calendar que los
 * vendedores no miraban: lo agendado aquí les aparece de una vez en el CRM.
 */
function AgendarVisita({ datos, pedido, leadId }: { datos: PasoForm; pedido: string; leadId?: string }) {
  const [estado, setEstado] = useState<'idle' | 'cargando' | 'elegir' | 'enviando' | 'exito'>('idle')
  const [dias, setDias] = useState<DiaDisponible[]>([])
  const [fecha, setFecha] = useState<string>('')
  const [hora, setHora] = useState<number | null>(null)
  const [direccion, setDireccion] = useState('')
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState<string | null>(null)

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_KEY}`,
  }

  const cargarDisponibilidad = async () => {
    setEstado('cargando')
    setError(null)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/agenda-cotizador`, {
        method: 'POST', headers, body: JSON.stringify({ accion: 'disponibilidad' }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok || !d.ok || !d.dias?.length) throw new Error(d.error || 'No hay cupos disponibles por ahora')
      setDias(d.dias)
      setFecha(d.dias[0].fecha)
      setHora(null)
      setEstado('elegir')
    } catch (e) {
      track('7x_error_visita', e instanceof Error ? e.message : String(e))
      setError(e instanceof Error ? e.message : 'No se pudo cargar la agenda. Intenta de nuevo.')
      setEstado('idle')
    }
  }

  const agendar = async () => {
    if (!fecha || hora === null) return
    setEstado('enviando')
    setError(null)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/agenda-cotizador`, {
        method: 'POST', headers,
        body: JSON.stringify({
          accion: 'agendar',
          nombre: datos.nombre ?? '',
          telefono: datos.telefono ?? '',
          direccion: [direccion.trim(), datos.ciudad].filter(Boolean).join(' — ') || null,
          pedido, fecha, hora,
          lead_id: leadId ?? null,
        }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok || !d.ok) {
        if (d.ocupada) {
          await cargarDisponibilidad()
          setError('Esa hora acaba de ocuparse. Escoge otra.')
          return
        }
        throw new Error(d.error || 'No se pudo agendar la visita.')
      }
      setCodigo(d.codigo)
      setEstado('exito')
      track('7_visita_agendada', d.codigo)
    } catch (e) {
      track('7x_error_visita', e instanceof Error ? e.message : String(e))
      setError(e instanceof Error ? e.message : 'No se pudo agendar. Intenta de nuevo.')
      setEstado('elegir')
    }
  }

  if (estado === 'exito') {
    const diaInfo = dias.find(d => d.fecha === fecha)
    return (
      <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-5 text-center">
        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
        <p className="font-bold text-green-700">¡Visita agendada! {codigo && <span className="font-mono">{codigo}</span>}</p>
        <p className="text-sm text-green-700 mt-1 capitalize">{diaInfo?.dia} · {hora !== null ? horaTxt(hora) : ''}</p>
        <p className="text-xs text-gray-500 mt-2">Nuestro equipo te llamará para confirmar la visita.</p>
      </div>
    )
  }

  if (estado === 'idle' || estado === 'cargando') {
    return (
      <div>
        <button
          onClick={cargarDisponibilidad}
          disabled={estado === 'cargando'}
          className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-4 rounded-2xl transition-colors shadow-sm disabled:opacity-60"
        >
          {estado === 'cargando' ? <Loader2 className="w-6 h-6 animate-spin" /> : <CalendarCheck className="w-6 h-6" />}
          {estado === 'cargando' ? 'Buscando cupos...' : 'Agendar visita técnica'}
        </button>
        {error && (
          <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>
        )}
      </div>
    )
  }

  const diaActual = dias.find(d => d.fecha === fecha)
  return (
    <div className="bg-white border-2 border-blue-200 rounded-2xl p-5 space-y-4">
      <p className="font-bold text-gray-800 flex items-center gap-2">
        <CalendarCheck className="w-5 h-5 text-blue-600" /> Escoge día y hora de tu visita técnica
      </p>

      <div className="flex gap-2 flex-wrap">
        {dias.map(d => (
          <button
            key={d.fecha}
            onClick={() => { setFecha(d.fecha); setHora(null) }}
            className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-colors capitalize ${fecha === d.fecha ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}
          >
            {d.dia}
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(diaActual?.libres ?? []).map(h => (
          <button
            key={h}
            onClick={() => setHora(h)}
            className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${hora === h ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}
          >
            {horaTxt(h)}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={direccion}
        onChange={e => setDireccion(e.target.value)}
        placeholder="Dirección o punto de referencia (opcional)"
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
      />

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>
      )}

      <button
        onClick={agendar}
        disabled={hora === null || estado === 'enviando'}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
      >
        {estado === 'enviando' ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
        {estado === 'enviando' ? 'Agendando...' : 'Confirmar visita'}
      </button>
    </div>
  )
}

export default function PasoResultado({ datos, cotizacionId, leadId }: Props) {
  const servicio = datos.servicio!
  const info = SERVICIOS[servicio]
  const cantidad = servicio === 'cocina-modular'
    ? datos.metros_lineales ?? 0
    : datos.metros_cuadrados ?? 0

  const esLVT = servicio === 'vinil-lvt'

  // Para LVT calculamos el precio base SIN acondicionamiento (lo mostramos separado)
  const precio = calcularCotizacion(servicio, cantidad, false)
  const colores = servicio === 'cocina-modular' ? COLORES_COCINA : COLORES_VINIL
  const colorInfo = colores.find(c => c.id === datos.color_seleccionado)
  const flete = getFlete(datos.ciudad)
  const fechaHoy = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })
  const nroCotizacion = cotizacionId ? cotizacionId.slice(0, 8).toUpperCase() : 'PENDIENTE'

  // Extras LVT: acondicionamiento siempre + 1 perfil de terminación
  const costoAcond = esLVT ? COSTO_ACOND_M2 * cantidad : 0
  const costoPerfil = esLVT ? COSTO_PERFIL_TERMINACION : 0

  // Rodapié PVC: usa ML ingresados por el cliente, o estima 90% del metraje
  const PRECIO_RODAPIE_ML = 9.6
  const incluyeRodapie = esLVT && !!datos.incluir_rodapie
  const mlRodapie = incluyeRodapie
    ? (datos.ml_rodapie ?? Math.ceil(cantidad * 0.9))
    : 0
  const costoRodapie = mlRodapie * PRECIO_RODAPIE_ML

  // Usamos precio.max como precio estándar (precio completo, sin descuento mínimo)
  const costoBase = precio ? precio.max : 0
  const total = precio ? costoBase + costoAcond + costoPerfil + (flete ?? 0) : null

  const whatsappMsg = encodeURIComponent(
    `Hola, acabo de generar mi cotización #${nroCotizacion} en KersaDesign para ${info.nombre}${colorInfo ? ` (${colorInfo.nombre})` : ''} — ${cantidad} ${info.unidad}${total ? `. Total estimado: ${formatCurrency(total)}` : ''}. Me gustaría más información.`
  )
  const whatsappUrl = `https://wa.me/584142568220?text=${whatsappMsg}`
  const pedidoVisita = `${info.nombre}${colorInfo ? ` ${colorInfo.nombre}` : ''} · ${cantidad} ${info.unidad} · Cotización #${nroCotizacion}`

  return (
    <div>
      {/* Estilos de impresión */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #cotizacion-imprimible, #cotizacion-imprimible * { visibility: visible !important; }
          #cotizacion-imprimible { position: fixed; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header confirmación */}
      <div className="text-center mb-6 no-print">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Tu cotización está lista!</h2>
        <p className="text-gray-500">
          Te enviamos los detalles a <span className="font-medium text-gray-700">{datos.email}</span>
        </p>
      </div>

      {/* ===== DOCUMENTO DE COTIZACIÓN IMPRIMIBLE ===== */}
      <div id="cotizacion-imprimible" className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm mb-6">

        {/* Cabecera con logo y datos empresa */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-gray-100 bg-white">
          <img
            src="https://kersadesign.com/imagenes/embed_000_dc2feea6.png"
            alt="KersaDesign"
            className="h-12 object-contain"
          />
          <div className="text-right text-xs leading-relaxed text-gray-600">
            <p className="font-bold text-sm text-gray-800 mb-0.5">KersaDesign</p>
            <p>Caracas, Venezuela</p>
            <p>Tel: +58 414-256-8220</p>
            <p>info@kersadesign.com</p>
            <p>kersadesign.com</p>
          </div>
        </div>

        {/* Franja azul decorativa */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #0f3a7a 0%, #1a56c4 100%)' }} />

        {/* Título y número */}
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Presupuesto de instalación</p>
            <p className="text-base font-bold text-gray-800">Cotización #{nroCotizacion}</p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>Fecha: <span className="font-medium text-gray-700">{fechaHoy}</span></p>
          </div>
        </div>

        {/* Datos del cliente */}
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cliente</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <div><span className="text-gray-500">Nombre:</span> <span className="font-medium text-gray-800">{datos.nombre}</span></div>
            <div><span className="text-gray-500">Teléfono:</span> <span className="font-medium text-gray-800">{datos.telefono}</span></div>
            <div><span className="text-gray-500">Email:</span> <span className="font-medium text-gray-800">{datos.email}</span></div>
            <div><span className="text-gray-500">Ubicación:</span> <span className="font-medium text-gray-800">{datos.ciudad}{datos.municipio ? ` · ${datos.municipio}` : ''}</span></div>
          </div>
        </div>

        {/* Detalle del servicio */}
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Detalle del servicio</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100">
                <th className="text-left pb-2 font-semibold">Descripción</th>
                <th className="text-right pb-2 font-semibold">Cant.</th>
                <th className="text-right pb-2 font-semibold">Precio unit.</th>
                <th className="text-right pb-2 font-semibold">Total est.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {/* Fila 1: Material + instalación */}
              <tr>
                <td className="py-2">
                  <p className="font-medium text-gray-800">{info.nombre}</p>
                  {colorInfo && <p className="text-xs text-gray-500">Color: {colorInfo.nombre}</p>}
                  <p className="text-xs text-gray-400">Material + mano de obra de instalación</p>
                </td>
                <td className="py-2 text-right text-gray-700">{cantidad} {info.unidad}</td>
                <td className="py-2 text-right text-gray-700">
                  {info.precioBase ? `$${info.precioBase}/${info.unidad}` : 'A cotizar'}
                </td>
                <td className="py-2 text-right font-semibold text-gray-800">
                  {precio ? formatCurrency(costoBase) : 'Personalizada'}
                </td>
              </tr>

              {/* Fila 2: Acondicionamiento (LVT siempre) */}
              {esLVT && (
                <tr>
                  <td className="py-2">
                    <p className="font-medium text-gray-800">Acondicionamiento de piso</p>
                    <p className="text-xs text-gray-400">Preparación de la superficie, incluye materiales. <span className="text-amber-600">* El costo puede variar según el tipo de piso existente.</span></p>
                  </td>
                  <td className="py-2 text-right text-gray-700">{cantidad} m²</td>
                  <td className="py-2 text-right text-gray-700">${COSTO_ACOND_M2}/m²</td>
                  <td className="py-2 text-right font-semibold text-gray-800">{formatCurrency(costoAcond)}</td>
                </tr>
              )}

              {/* Fila 3: Perfil de terminación (LVT siempre) */}
              {esLVT && (
                <tr>
                  <td className="py-2">
                    <p className="font-medium text-gray-800">Perfil de terminación</p>
                    <p className="text-xs text-gray-400">1 unidad — remate de borde y transición</p>
                  </td>
                  <td className="py-2 text-right text-gray-700">1 ud.</td>
                  <td className="py-2 text-right text-gray-700">—</td>
                  <td className="py-2 text-right font-semibold text-gray-800">{formatCurrency(costoPerfil)}</td>
                </tr>
              )}

              {/* Fila 4: Rodapié PVC (solo si el cliente lo eligió) */}
              {incluyeRodapie && (
                <tr>
                  <td className="py-2">
                    <p className="font-medium text-gray-800">
                      Rodapié PVC <span className="text-xs font-normal text-blue-600 bg-blue-50 rounded px-1.5 py-0.5 ml-1">Opcional</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      Incluye rodapié, instalación y carateo · {datos.ml_rodapie ? `${mlRodapie} ML` : `~${mlRodapie} ML estimados (90% del área)`}
                    </p>
                  </td>
                  <td className="py-2 text-right text-gray-700">{mlRodapie} ML</td>
                  <td className="py-2 text-right text-gray-700">${PRECIO_RODAPIE_ML}/ML</td>
                  <td className="py-2 text-right font-semibold text-gray-800">{formatCurrency(costoRodapie)}</td>
                </tr>
              )}

              {/* Fila 5: Flete */}
              {flete !== null && (
                <tr>
                  <td className="py-2">
                    <p className="font-medium text-gray-800">Flete / Traslado</p>
                    <p className="text-xs text-gray-400">Entrega en {datos.ciudad}</p>
                  </td>
                  <td className="py-2 text-right text-gray-700">1</td>
                  <td className="py-2 text-right text-gray-700">—</td>
                  <td className="py-2 text-right font-semibold text-gray-800">{formatCurrency(flete)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="px-5 py-4 border-t-2 border-gray-100">
          {total !== null ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">TOTAL ESTIMADO</p>
                <p className="text-xs text-gray-400 mt-0.5">Piso + Acondicionamiento + Perfil + Flete</p>
                {flete === null && (
                  <p className="text-xs text-amber-600 mt-0.5">* Flete no incluido — consultar según ubicación</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-3xl font-black" style={{ color: '#134a9c' }}>
                  {formatCurrency(total)}
                </p>
                <p className="text-xs text-amber-600 font-medium mt-1">* Precio más IVA · Precios promocionales para pago en divisa</p>
                <p className="text-xs text-gray-400 mt-0.5">Referencial, sujeto a visita técnica</p>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-blue-900 font-medium">Un asesor calculará tu cotización personalizada</p>
              <p className="text-sm text-blue-700 mt-1">Te contactamos en menos de 24 horas</p>
            </div>
          )}
        </div>

        {/* Footer del documento con botón de descarga */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Presupuesto referencial sujeto a visita técnica.<br />KersaDesign · Urb. Calle Los Huertos, Caracas 1050, Distrito Capital, Venezuela · kersadesign.com
          </p>
          <button
            onClick={() => window.print()}
            className="no-print flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Descargar PDF
          </button>
        </div>
      </div>

      {/* CTAs: Agendar visita (agenda propia) + WhatsApp */}
      <div className="space-y-4 no-print">
        <AgendarVisita datos={datos} pedido={pedidoVisita} leadId={leadId} />
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-4 rounded-2xl transition-colors shadow-sm"
        >
          <MessageCircle className="w-6 h-6" />
          Contactar asesor por WhatsApp
        </a>
      </div>
    </div>
  )
}
