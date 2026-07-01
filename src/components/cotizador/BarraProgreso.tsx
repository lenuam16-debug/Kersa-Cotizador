'use client'

import { cn } from '@/lib/utils'

interface Props {
  pasoActual: number
  totalPasos: number
}

const LABELS = ['Servicio', 'Especificaciones', 'Tus datos', 'Resultado']

export default function BarraProgreso({ pasoActual, totalPasos }: Props) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        {LABELS.map((label, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                i < pasoActual
                  ? 'bg-blue-500 text-white'
                  : i === pasoActual
                  ? 'bg-blue-500 text-white ring-4 ring-blue-200'
                  : 'bg-gray-200 text-gray-400'
              )}
            >
              {i < pasoActual ? '✓' : i + 1}
            </div>
            <span className={cn(
              'text-xs hidden sm:block',
              i <= pasoActual ? 'text-blue-700 font-medium' : 'text-gray-400'
            )}>
              {label}
            </span>
          </div>
        ))}
      </div>
      <div className="relative h-1.5 bg-gray-200 rounded-full mt-1">
        <div
          className="absolute h-full bg-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${(pasoActual / (totalPasos - 1)) * 100}%` }}
        />
      </div>
    </div>
  )
}

