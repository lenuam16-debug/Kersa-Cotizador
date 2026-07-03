'use client'

import Image from 'next/image'
import { Servicio } from '@/types'
import { SERVICIOS } from '@/lib/pricing'
import { cn } from '@/lib/utils'

const IMAGENES: Record<string, string> = {
  'vinil-lvt': 'https://kersadesign.com/imagenes/embed_038_91a45af7.jpg',
  'vinil-spc': 'https://kersadesign.com/imagenes/embed_059_9dd044f6.jpg',
  'cocina-modular': 'https://kersadesign.com/imagenes/embed_078_4b2cca2f.jpg',
}

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
        {(Object.entries(SERVICIOS) as [Servicio, typeof SERVICIOS[Servicio]][]).filter(([key]) => key !== 'laminas-pvc' && key !== 'wallpanel').map(([key, s]) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            style={seleccionado === key ? { borderColor: '#134a9c' } : {}}
            className={cn(
              'rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-md overflow-hidden',
              seleccionado === key
                ? 'shadow-md'
                : 'border-gray-200 bg-white hover:border-blue-300'
            )}
          >
            {IMAGENES[key] && (
              <div className="relative w-full h-40">
                <img
                  src={IMAGENES[key]}
                  alt={s.nombre}
                  className="w-full h-full object-cover"
                />
                {seleccionado === key && (
                  <div className="absolute inset-0" style={{ backgroundColor: '#134a9c33' }} />
                )}
              </div>
            )}
            <div className={cn('p-4', seleccionado === key ? 'bg-blue-50' : 'bg-white')}>
              <h3 className={cn(
                'font-bold text-lg mb-1',
                seleccionado === key ? '' : 'text-gray-800'
              )} style={seleccionado === key ? { color: '#134a9c' } : {}}>
                {s.nombre}
              </h3>
              <p className="text-sm text-gray-500">{s.descripcion}</p>
              {s.precioBase && (
                <p
                  className="mt-2 text-sm font-semibold"
                  style={seleccionado === key ? { color: '#134a9c' } : { color: '#9ca3af' }}
                >
                  Desde ${s.precioBase}/{s.unidad}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
