import TablaLeads from '@/components/admin/TablaLeads'
import { supabaseAdmin } from '@/lib/supabase'
import { Users, FileText, TrendingUp, Clock } from 'lucide-react'

async function getStats() {
  const [leadsRes, cotizacionesRes, nuevasRes] = await Promise.all([
    supabaseAdmin.from('leads').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('cotizaciones').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('cotizaciones').select('id', { count: 'exact', head: true }).eq('estado', 'nuevo'),
  ])
  return {
    totalLeads: leadsRes.count ?? 0,
    totalCotizaciones: cotizacionesRes.count ?? 0,
    nuevas: nuevasRes.count ?? 0,
  }
}

export default async function AdminPage() {
  const stats = await getStats()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
        {/* Stats */}
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

        {/* Tabla */}
        <h2 className="text-lg font-bold text-gray-700 mb-4">Cotizaciones y seguimiento</h2>
        <TablaLeads />
      </div>
    </div>
  )
}

