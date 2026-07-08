'use client'

import { useState, useEffect } from 'react'
import { Cotizacion, EstadoSeguimiento } from '@/types'
import { SERVICIOS } from '@/lib/pricing'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Search, Phone, Mail, RefreshCw, Download } from 'lucide-react'
import * as XLSX from 'xlsx'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://awscrogqprosivmtgkio.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3c2Nyb2dxcHJvc2l2bXRna2lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMjQ1NDIsImV4cCI6MjA5NzkwMDU0Mn0.WcYei2z8UGNCTQaWKSTNeWEJByWKTNqHyyCrwcPPnTQ'
const HEADERS = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }

const ESTADOS: { valor: EstadoSeguimiento; label: string; color: string }[] = [
  { valor: 'nuevo', label: 'Nuevo', color: 'bg-blue-100 text-blue-700' },
  { valor: 'contactado', label: 'Contactado', color: 'bg-yellow-100 text-yellow-700' },
  { valor: 'en-negociacion', label: 'En negociación', color: 'bg-purple-100 text-purple-700' },
  { valor: 'cerrado-ganado', label: 'Ganado ✓', color: 'bg-green-100 text-green-700' },
  { valor: 'cerrado-perdido', label: 'Perdido', color: 'bg-red-100 text-red-700' },
]

export default function TablaLeads() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [buscar, setBuscar] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroServicio, setFiltroServicio] = useState('')
  const [detalle, setDetalle] = useState<Cotizacion | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [exportando, setExportando] = useState(false)

  const cargar = async () => {
    setCargando(true)
    const params = new URLSearchParams()
    params.set('select', '*,lead:leads(*)')
    params.set('order', 'created_at.desc')
    if (filtroEstado) params.set('estado', `eq.${filtroEstado}`)
    if (filtroServicio) params.set('servicio', `eq.${filtroServicio}`)

    const res = await fetch(`${SUPABASE_URL}/rest/v1/cotizaciones?${params}`, { headers: HEADERS })
    let data = await res.json()
    if (buscar) {
      const q = buscar.toLowerCase()
      data = data.filter((c: Cotizacion) =>
        c.lead?.name?.toLowerCase().includes(q) ||
        c.lead?.email?.toLowerCase().includes(q) ||
        c.lead?.telefono?.includes(q)
      )
    }
    setCotizaciones(data)
    setCargando(false)
  }

  useEffect(() => { cargar() }, [filtroEstado, filtroServicio])

  const buscarDebounced = () => cargar()

  const actualizarEstado = async (id: string, estado: EstadoSeguimiento, notas?: string) => {
    setGuardando(true)
    await fetch(`${SUPABASE_URL}/rest/v1/cotizaciones?id=eq.${id}`, {
      method: 'PATCH',
      headers: { ...HEADERS, 'Prefer': 'return=representation' },
      body: JSON.stringify({ estado, notas_admin: notas }),
    })
    await cargar()
    setGuardando(false)
    if (detalle?.id === id) {
      setDetalle(prev => prev ? { ...prev, estado, notas_admin: notas } : null)
    }
  }

  const estadoInfo = (e: EstadoSeguimiento) => ESTADOS.find(s => s.valor === e)!

  const exportarReporteSemanal = async () => {
    setExportando(true)
    try {
      const desde = new Date()
      desde.setDate(desde.getDate() - 7)

      const params = new URLSearchParams()
      params.set('select', '*,lead:leads(*)')
      params.set('order', 'created_at.desc')
      params.set('created_at', `gte.${desde.toISOString()}`)

      const res = await fetch(`${SUPABASE_URL}/rest/v1/cotizaciones?${params}`, { headers: HEADERS })
      const data: Cotizacion[] = await res.json()

      const filas = data.map(c => {
        // La ciudad se guarda como "Estado - Municipio"
        const partes = (c.lead?.ciudad ?? '').split(' - ')
        const municipio = partes.length > 1 ? partes[1] : (partes[0] ?? '')
        return {
          'Nombre': c.lead?.name ?? '',
          'Teléfono': c.lead?.telefono ?? '',
          'Municipio': municipio,
          'Metraje': c.metros_cuadrados ? `${c.metros_cuadrados} m²` : c.metros_lineales ? `${c.metros_lineales} ML` : '',
          'Monto cotización': c.precio_min > 0 ? `${formatCurrency(c.precio_min)} - ${formatCurrency(c.precio_max)}` : 'Personalizada',
          'Fecha': c.created_at ? formatDate(c.created_at) : '',
        }
      })

      const hoja = XLSX.utils.json_to_sheet(filas)
      hoja['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 22 }, { wch: 18 }]
      const libro = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(libro, hoja, 'Reporte semanal')

      const hoy = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(libro, `reporte-cotizaciones-${hoy}.xlsx`)
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscarDebounced()}
            className="flex-1 outline-none text-sm"
          />
        </div>

        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e.valor} value={e.valor}>{e.label}</option>)}
        </select>

        <select
          value={filtroServicio}
          onChange={e => setFiltroServicio(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
        >
          <option value="">Todos los servicios</option>
          {Object.entries(SERVICIOS).map(([k, v]) => (
            <option key={k} value={k}>{v.nombre}</option>
          ))}
        </select>

        <button
          onClick={cargar}
          className="bg-white border border-gray-200 rounded-xl p-2 hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>

        <button
          onClick={exportarReporteSemanal}
          disabled={exportando}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {exportando ? 'Generando...' : 'Descargar reporte semanal'}
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {cargando ? (
          <div className="p-12 text-center text-gray-400">Cargando...</div>
        ) : cotizaciones.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No hay cotizaciones aún</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Servicio</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cotización</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cotizaciones.map(c => {
                  const servInfo = SERVICIOS[c.servicio]
                  const est = estadoInfo(c.estado)
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 text-sm">{c.lead?.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <a href={`tel:${c.lead?.telefono}`} className="text-xs text-gray-400 hover:text-blue-700 flex items-center gap-1">
                            <Phone className="w-3 h-3" />{c.lead?.telefono}
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-lg">{servInfo.icono}</span>
                        <span className="text-xs text-gray-600 ml-1">{servInfo.nombre}</span>
                      </td>
                      <td className="px-4 py-3">
                        {c.precio_min > 0 ? (
                          <p className="text-sm font-semibold text-gray-800">
                            {formatCurrency(c.precio_min)} – {formatCurrency(c.precio_max)}
                          </p>
                        ) : (
                          <span className="text-xs text-gray-400">Personalizada</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-medium px-2 py-1 rounded-full', est.color)}>
                          {est.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {c.created_at ? formatDate(c.created_at) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setDetalle(c)}
                          className="text-xs text-blue-700 hover:text-blue-800 font-medium"
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Panel de detalle */}
      {detalle && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setDetalle(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{detalle.lead?.name}</h3>
                <p className="text-sm text-gray-500">{detalle.lead?.ciudad}</p>
              </div>
              <button onClick={() => setDetalle(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="space-y-4">
              {/* Contacto */}
              <div className="grid grid-cols-2 gap-3">
                <a href={`tel:${detalle.lead?.telefono}`} className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 font-medium">
                  <Phone className="w-4 h-4" /> {detalle.lead?.telefono}
                </a>
                <a href={`mailto:${detalle.lead?.email}`} className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700 font-medium">
                  <Mail className="w-4 h-4" /> Email
                </a>
              </div>

              {/* Servicio */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Servicio solicitado</p>
                <p className="font-medium">{SERVICIOS[detalle.servicio].icono} {SERVICIOS[detalle.servicio].nombre}</p>
                {detalle.metros_cuadrados && <p className="text-sm text-gray-600">{detalle.metros_cuadrados} m²</p>}
                {detalle.metros_lineales && <p className="text-sm text-gray-600">{detalle.metros_lineales} ML</p>}
                {detalle.color_seleccionado && <p className="text-sm text-gray-600">Color: {detalle.color_seleccionado}</p>}
                {detalle.detalles_adicionales && <p className="text-sm text-gray-600 mt-2 italic">"{detalle.detalles_adicionales}"</p>}
              </div>

              {/* Cambiar estado */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Estado de seguimiento</p>
                <div className="grid grid-cols-2 gap-2">
                  {ESTADOS.map(e => (
                    <button
                      key={e.valor}
                      onClick={() => actualizarEstado(detalle.id!, e.valor, detalle.notas_admin)}
                      disabled={guardando}
                      className={cn(
                        'px-3 py-2 rounded-xl text-xs font-medium border-2 transition-all',
                        detalle.estado === e.valor
                          ? 'border-blue-500 ' + e.color
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      )}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Notas internas</p>
                <textarea
                  rows={3}
                  defaultValue={detalle.notas_admin ?? ''}
                  placeholder="Agrega notas sobre este cliente..."
                  onChange={e => setDetalle(prev => prev ? { ...prev, notas_admin: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:border-blue-400 focus:outline-none"
                />
                <button
                  onClick={() => actualizarEstado(detalle.id!, detalle.estado, detalle.notas_admin)}
                  disabled={guardando}
                  className="mt-2 w-full bg-blue-500 text-white rounded-xl py-2 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar notas'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

