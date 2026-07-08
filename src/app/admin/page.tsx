'use client'

import { useState, useEffect } from 'react'
import TablaLeads from '@/components/admin/TablaLeads'
import { Users, FileText, Clock, Lock, Loader2 } from 'lucide-react'

const ADMIN_SESSION_KEY = 'kersa_admin_auth'

function AdminGate({ children }: { children: React.ReactNode }) {
  const [autorizado, setAutorizado] = useState(false)
  const [verificando, setVerificando] = useState(true)
  const [clave, setClave] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    setAutorizado(sessionStorage.getItem(ADMIN_SESSION_KEY) === '1')
    setVerificando(false)
  }, [])

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setError(null)
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: clave }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Clave incorrecta')
      sessionStorage.setItem(ADMIN_SESSION_KEY, '1')
      setAutorizado(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al verificar')
    } finally {
      setCargando(false)
    }
  }

  if (verificando) return null

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <form onSubmit={entrar} className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-gray-800">Acceso administrador</h1>
          </div>
          <p className="text-sm text-gray-500 mb-6">Ingresa la clave para ver el panel de leads y cotizaciones</p>
          <input
            type="password"
            autoFocus
            placeholder="Clave de acceso"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 mb-3"
          />
          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
          <button
            type="submit"
            disabled={cargando || !clave}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {cargando ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    )
  }

  return <>{children}</>
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://awscrogqprosivmtgkio.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3c2Nyb2dxcHJvc2l2bXRna2lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMjQ1NDIsImV4cCI6MjA5NzkwMDU0Mn0.WcYei2z8UGNCTQaWKSTNeWEJByWKTNqHyyCrwcPPnTQ'

const HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
}

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminContent />
    </AdminGate>
  )
}

function AdminContent() {
  const [stats, setStats] = useState({ totalLeads: 0, totalCotizaciones: 0, nuevas: 0 })

  useEffect(() => {
    const load = async () => {
      const [l, c, n] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/leads?select=id`, { headers: { ...HEADERS, 'Prefer': 'count=exact', 'Range-Unit': 'items', 'Range': '0-0' } }),
        fetch(`${SUPABASE_URL}/rest/v1/cotizaciones?select=id`, { headers: { ...HEADERS, 'Prefer': 'count=exact', 'Range-Unit': 'items', 'Range': '0-0' } }),
        fetch(`${SUPABASE_URL}/rest/v1/cotizaciones?select=id&estado=eq.nuevo`, { headers: { ...HEADERS, 'Prefer': 'count=exact', 'Range-Unit': 'items', 'Range': '0-0' } }),
      ])
      const getCount = (res: Response) => parseInt(res.headers.get('Content-Range')?.split('/')[1] ?? '0')
      setStats({ totalLeads: getCount(l), totalCotizaciones: getCount(c), nuevas: getCount(n) })
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              Kersa<span className="text-blue-500">Design</span>
              <span className="text-base font-normal text-gray-400 ml-2">· Admin</span>
            </h1>
          </div>
          <a
            href="/cotizador"
            target="_blank"
            className="text-sm text-blue-700 hover:text-blue-800 font-medium border border-blue-200 px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors"
          >
            Ver cotizador →
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total leads</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalLeads}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <FileText className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Cotizaciones</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalCotizaciones}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sin contactar</p>
              <p className="text-3xl font-bold text-gray-800">{stats.nuevas}</p>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-bold text-gray-700 mb-4">Cotizaciones y seguimiento</h2>
        <TablaLeads />
      </div>
    </div>
  )
}
