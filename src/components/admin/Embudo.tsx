'use client'

import { useState, useEffect } from 'react'
import { TrendingDown } from 'lucide-react'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://awscrogqprosivmtgkio.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3c2Nyb2dxcHJvc2l2bXRna2lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMjQ1NDIsImV4cCI6MjA5NzkwMDU0Mn0.WcYei2z8UGNCTQaWKSTNeWEJByWKTNqHyyCrwcPPnTQ'

const PASOS: { evento: string; label: string }[] = [
  { evento: '1_llego_al_cotizador',        label: 'Llegaron al cotizador' },
  { evento: '2_eligio_servicio',           label: 'Eligieron servicio' },
  { evento: '3_completo_especificaciones', label: 'Completaron metraje y color' },
  { evento: '4_sms_enviado',               label: 'Pidieron el código SMS' },
  { evento: '5_telefono_verificado',       label: 'Verificaron su teléfono' },
  { evento: '6_vio_cotizacion',            label: 'Vieron su cotización' },
]

const ERRORES: { evento: string; label: string }[] = [
  { evento: '4x_error_sms',    label: 'Error enviando SMS' },
  { evento: '5x_error_codigo', label: 'Código incorrecto/expirado' },
  { evento: 'error_al_enviar', label: 'Error guardando cotización' },
]

export default function Embudo() {
  const [conteos, setConteos] = useState<Record<string, number>>({})
  const [errores, setErrores] = useState<{ evento: string; detalles: string | null; n: number }[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const load = async () => {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/funnel_events?select=session_id,evento,detalles&order=created_at.desc&limit=5000`,
        { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
      )
      if (!res.ok) { setCargando(false); return }
      const rows: { session_id: string; evento: string; detalles: string | null }[] = await res.json()

      // Sesiones únicas por evento
      const porEvento: Record<string, Set<string>> = {}
      const errAgg: Record<string, number> = {}
      rows.forEach(r => {
        porEvento[r.evento] = porEvento[r.evento] ?? new Set()
        porEvento[r.evento].add(r.session_id)
        if (r.evento.includes('x_') || r.evento.startsWith('error')) {
          const k = `${r.evento}|${r.detalles ?? ''}`
          errAgg[k] = (errAgg[k] ?? 0) + 1
        }
      })
      setConteos(Object.fromEntries(Object.entries(porEvento).map(([k, v]) => [k, v.size])))
      setErrores(Object.entries(errAgg).map(([k, n]) => {
        const [evento, detalles] = k.split('|')
        return { evento, detalles: detalles || null, n }
      }).sort((a, b) => b.n - a.n))
      setCargando(false)
    }
    load()
  }, [])

  if (cargando) return <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400">Cargando embudo...</div>

  const total = conteos[PASOS[0].evento] ?? 0

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown className="w-5 h-5 text-blue-600" />
        <h3 className="font-bold text-gray-800">Embudo del cotizador</h3>
        <span className="text-xs text-gray-400">(sesiones únicas)</span>
      </div>

      {total === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">
          Aún no hay datos — el rastreo comienza a registrar a partir de ahora
        </p>
      ) : (
        PASOS.map((p, i) => {
          const n = conteos[p.evento] ?? 0
          const pct = total > 0 ? Math.round((n / total) * 100) : 0
          const prev = i > 0 ? (conteos[PASOS[i - 1].evento] ?? 0) : n
          const perdidos = i > 0 ? prev - n : 0
          return (
            <div key={p.evento}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-700 font-medium">{p.label}</span>
                <span className="text-gray-500">
                  {n} <span className="text-gray-400">({pct}%)</span>
                  {perdidos > 0 && <span className="text-red-500 ml-2">−{perdidos}</span>}
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#134a9c' }} />
              </div>
            </div>
          )
        })
      )}

      {errores.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Errores registrados</p>
          {errores.slice(0, 10).map((e, i) => (
            <div key={i} className="flex justify-between text-xs text-gray-600 py-1">
              <span>{ERRORES.find(x => x.evento === e.evento)?.label ?? e.evento}{e.detalles ? ` — ${e.detalles}` : ''}</span>
              <span className="font-semibold text-red-500">{e.n}×</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
