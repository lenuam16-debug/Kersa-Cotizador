'use client'

import { Servicio } from '@/types'
import { SERVICIOS } from '@/lib/pricing'
import { cn } from '@/lib/utils'

interface Props {
  seleccionado?: Servicio
  onSelect: (s: Servicio) => void
}

export default function PasoServicio({ seleccionado, onSelect }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">¿Qué servicio necesitas?</h2>
      <p className="text-gray-500 mb-8">Selecciona el tipo de instalación que deseas cotizar</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(Object.entries(SERVICIOS) as [Servicio, typeof SERVICIOS[Servicio]][]).map(([key, s]) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={cn(
              'p-6 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-md group',
              seleccionado === key
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-blue-300'
            )}
          >
            <span className="text-4xl mb-3 block">{s.icono}</span>
            <h3 className={cn(
              'font-bold text-lg mb-1',
              seleccionado === key ? 'text-blue-800' : 'text-gray-800'
            )}>
              {s.nombre}
            </h3>
            <p className="text-sm text-gray-500">{s.descripcion}</p>
            {s.precioBase && (
              <p className={cn(
                'mt-3 text-sm font-semibold',
                seleccionado === key ? 'text-blue-700' : 'text-gray-400'
              )}>
                Desde ${s.precioBase}/{s.unidad}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

