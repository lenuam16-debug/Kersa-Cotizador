'use client'

import { Servicio, PasoForm } from '@/types'
import { SERVICIOS, COLORES_VINIL, COLORES_COCINA } from '@/lib/pricing'
import { cn } from '@/lib/utils'

interface Props {
  servicio: Servicio
  datos: PasoForm
  onChange: (d: Partial<PasoForm>) => void
}

export default function PasoEspecificaciones({ servicio, datos, onChange }: Props) {
  const info = SERVICIOS[servicio]
  const colores = servicio === 'cocina-modular' ? COLORES_COCINA : COLORES_VINIL
  const mostrarColores = servicio === 'vinil-lvt' || servicio === 'cocina-modular'
  const esMetrosCuadrados = servicio !== 'cocina-modular'

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Especificaciones — {info.nombre}
      </h2>
      <p className="text-gray-500 mb-8">Cuéntanos sobre el espacio a intervenir</p>

      <div className="space-y-6">
        {/* Medidas */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {esMetrosCuadrados ? 'Área aproximada (m²)' : 'Metros lineales de cocina (ML)'}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              step="0.5"
              placeholder={esMetrosCuadrados ? 'Ej: 25' : 'Ej: 3.5'}
              value={esMetrosCuadrados ? datos.metros_cuadrados ?? '' : datos.metros_lineales ?? ''}
              onChange={(e) => {
                const val = parseFloat(e.target.value)
                if (esMetrosCuadrados) onChange({ metros_cuadrados: val })
                else onChange({ metros_lineales: val })
              }}
              className="w-40 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none text-lg font-medium"
            />
            <span className="text-gray-500 font-medium">{info.unidad}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {esMetrosCuadrados
              ? 'Ancho × Largo del espacio. Si no lo sabes exacto, pon un estimado.'
              : 'Longitud total de los módulos de cocina que necesitas.'}
          </p>
        </div>

        {/* Selector de color */}
        {mostrarColores && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Color / Acabado preferido
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
              {colores.map((color) => (
                <button
                  key={color.id}
                  onClick={() => onChange({ color_seleccionado: color.id })}
                  title={color.nombre}
                  className={cn(
                    'group flex flex-col items-center gap-1',
                  )}
                >
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl border-3 transition-all shadow-sm',
                      datos.color_seleccionado === color.id
                        ? 'border-blue-500 scale-110 shadow-md'
                        : 'border-transparent hover:border-gray-300'
                    )}
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="text-xs text-gray-500 text-center leading-tight">
                    {color.nombre}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Los colores exactos pueden variar según disponibilidad de stock.
            </p>
          </div>
        )}

        {/* PVC y Wallpanel — solo solicitar info */}
        {(servicio === 'laminas-pvc' || servicio === 'wallpanel') && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-900 text-sm font-medium">
              📐 Para {info.nombre}, un asesor te contactará con la cotización personalizada según el diseño y materiales que elijas.
            </p>
          </div>
        )}

        {/* Detalles adicionales */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Detalles adicionales <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Ej: El piso actual es de baldosa, hay escaleras, el espacio tiene humedad..."
            value={datos.detalles_adicionales ?? ''}
            onChange={(e) => onChange({ detalles_adicionales: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none resize-none text-sm"
          />
        </div>
      </div>
    </div>
  )
}

