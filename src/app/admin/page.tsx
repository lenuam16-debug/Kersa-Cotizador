'use client'

import { useState, useEffect } from 'react'
import TablaLeads from '@/components/admin/TablaLeads'
import { Users, FileText, Clock } from 'lucide-react'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://awscrogqprosivmtgkio.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3c2Nyb2dxcHJvc2l2bXRna2lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMjQ1NDIsImV4cCI6MjA5NzkwMDU0Mn0.WcYei2z8UGNCTQaWKSTNeWEJByWKTNqHyyCrwcPPnTQ'

const HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
}

export default function AdminPage() {
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
