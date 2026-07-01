'use client'

import { PasoForm } from '@/types'

interface Props {
  datos: PasoForm
  onChange: (d: Partial<PasoForm>) => void
}

const ciudades = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
  'Bucaramanga', 'Cúcuta', 'Manizales', 'Pereira', 'Ibagué',
  'Villavicencio', 'Otra ciudad',
]

export default function PasoDatos({ datos, onChange }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Tus datos de contacto</h2>
      <p className="text-gray-500 mb-8">
        Para enviarte la cotización detallada y hacer seguimiento a tu proyecto
      </p>

      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nombre completo *
            </label>
            <input
              type="text"
              placeholder="Tu nombre"
              value={datos.nombre ?? ''}
              onChange={(e) => onChange({ nombre: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Teléfono / WhatsApp *
            </label>
            <input
              type="tel"
              placeholder="300 000 0000"
              value={datos.telefono ?? ''}
              onChange={(e) => onChange({ telefono: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Correo electrónico *
          </label>
          <input
            type="email"
            placeholder="tucorreo@ejemplo.com"
            value={datos.email ?? ''}
            onChange={(e) => onChange({ email: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Ciudad *
            </label>
            <select
              value={datos.ciudad ?? ''}
              onChange={(e) => onChange({ ciudad: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none bg-white"
            >
              <option value="">Selecciona tu ciudad</option>
              {ciudades.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              ¿Cuándo lo necesitas? <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="date"
              value={datos.fecha_proyecto ?? ''}
              onChange={(e) => onChange({ fecha_proyecto: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500">
          🔒 Tus datos están seguros. Solo los usamos para enviarte tu cotización y hacer seguimiento a tu proyecto. No compartimos tu información con terceros.
        </div>
      </div>
    </div>
  )
}

