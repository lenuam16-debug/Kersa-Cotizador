'use client'

import Image from 'next/image'
import { Servicio } from '@/types'
import { SERVICIOS } from '@/lib/pricing'
import { cn } from '@/lib/utils'

const IMAGENES: Record<string, string> = {
  'vinil-lvt': 'https://kersadesign.com/imagenes/embed_038_91a45af7.jpg',
  'vinil-lvt-3mm': 'https://kersadesign.com/imagenes/embed_059_9dd044f6.jpg',
  'vinil-spc': '/materiales/spc-6mm/miel.jpg',
  'cocina-modular': 'https://kersadesign.com/imagenes/embed_078_4b2cca2f.jpg',
}

/**
 * Servicios que el cotizador web ofrece hoy. Los precios y textos de los
 * demás (laminas-pvc, wallpanel) siguen en pricing.ts para cuando se activen.
 */
const SERVICIOS_ACTIVOS: Servicio[] = ['vinil-lvt', 'vinil-lvt-3mm', 'vinil-spc', 'cocina-modular']

interface Props {
  seleccionado?: Servicio
  onSelect: (s: Servicio) => void
}

export default function PasoServicio({ seleccionado, onSelect }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">¿Qué servicio necesitas?</h2>
      <p className="text-gray-500 mb-8">Selecciona el tipo de instalación que deseas cotizar</p>

      {/* El wizard mide max-w-2xl: con 4 servicios va en 2×2 (4 columnas dejaba
          tarjetas de 140px con la imagen hecha una tira). */}
      <div className={cn(
        'grid grid-cols-1 gap-4',
        SERVICIOS_ACTIVOS.length >= 4 ? 'sm:grid-cols-2'
          : SERVICIOS_ACTIVOS.length > 1 ? 'sm:grid-cols-3 max-w-3xl' : 'max-w-sm'
      )}>
        {(Object.entries(SERVICIOS) as [Servicio, typeof SERVICIOS[Servicio]][]).filter(([key]) => SERVICIOS_ACTIVOS.includes(key)).map(([key, s]) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            style={seleccionado === key ? { borderColor: '#134a9c' } : {}}
            className={cn(
              'flex flex-col h-full rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-md overflow-hidden',
              seleccionado === key
                ? 'shadow-md'
                : 'border-gray-200 bg-white hover:border-blue-300'
            )}
          >
            {IMAGENES[key] && (
              <div className="relative w-full aspect-[16/10] flex-shrink-0">
                <img
                  src={IMAGENES[key]}
                  alt={s.nombre}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
                {seleccionado === key && (
                  <div className="absolute inset-0" style={{ backgroundColor: '#134a9c33' }} />
                )}
              </div>
            )}
            <div className={cn('p-4 flex flex-col flex-1 w-full', seleccionado === key ? 'bg-blue-50' : 'bg-white')}>
              <h3 className={cn(
                'font-bold text-lg mb-1',
                seleccionado === key ? '' : 'text-gray-800'
              )} style={seleccionado === key ? { color: '#134a9c' } : {}}>
                {s.nombre}
              </h3>
              <p className="text-sm text-gray-500">{s.descripcion}</p>
              {s.precioBase && (
                <p
                  className="mt-auto pt-2 text-sm font-semibold"
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
