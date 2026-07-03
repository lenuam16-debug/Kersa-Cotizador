'use client'

import { PasoForm } from '@/types'

interface Props {
  datos: PasoForm
  onChange: (d: Partial<PasoForm>) => void
}

const CIUDADES_MUNICIPIOS: Record<string, string[]> = {
  'Caracas (Distrito Capital)': [
    'Libertador',
  ],
  'Miranda': [
    'Baruta', 'Chacao', 'El Hatillo', 'Sucre', 'Zamora',
    'Guaicaipuro', 'Acevedo', 'Brión', 'Buroz', 'Cristóbal Rojas',
    'Independencia', 'Lander', 'Los Salias', 'Páez', 'Paz Castillo',
    'Pedro Gual', 'Urdaneta',
  ],
  'La Guaira (Vargas)': [
    'Vargas',
  ],
}

const CIUDADES = Object.keys(CIUDADES_MUNICIPIOS)

export default function PasoDatos({ datos, onChange }: Props) {
  const municipios = datos.ciudad ? CIUDADES_MUNICIPIOS[datos.ciudad] ?? [] : []

  const handleCiudadChange = (ciudad: string) => {
    onChange({ ciudad, municipio: '' })
  }

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
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Teléfono / WhatsApp *
            </label>
            <input
              type="tel"
              placeholder="0414-0000000"
              value={datos.telefono ?? ''}
              onChange={(e) => onChange({ telefono: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none"
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
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Estado *
            </label>
            <select
              value={datos.ciudad ?? ''}
              onChange={(e) => handleCiudadChange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none bg-white"
            >
              <option value="">Selecciona tu estado / ciudad</option>
              {CIUDADES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Municipio *
            </label>
            <select
              value={datos.municipio ?? ''}
              onChange={(e) => onChange({ municipio: e.target.value })}
              disabled={!datos.ciudad}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none bg-white disabled:opacity-50"
            >
              <option value="">Selecciona tu municipio</option>
              {municipios.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500">
          🔒 Tus datos están seguros. Solo los usamos para enviarte tu cotización y hacer seguimiento a tu proyecto. No compartimos tu información con terceros.
        </div>
      </div>
    </div>
  )
}
