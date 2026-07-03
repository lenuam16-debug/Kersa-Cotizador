'use client'

import { PasoForm } from '@/types'
import { SERVICIOS, calcularCotizacion, COLORES_VINIL, COLORES_COCINA } from '@/lib/pricing'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle, Phone, Mail, Camera } from 'lucide-react'
import Link from 'next/link'

interface Props {
  datos: PasoForm
  cotizacionId?: string
}

export default function PasoResultado({ datos, cotizacionId }: Props) {
  const servicio = datos.servicio!
  const info = SERVICIOS[servicio]
  const cantidad = servicio === 'cocina-modular'
    ? datos.metros_lineales ?? 0
    : datos.metros_cuadrados ?? 0

  const esVinil = servicio === 'vinil-lvt' || servicio === 'vinil-spc'
  const pisosSinAcond = ['granito', 'microcemento']
  const requiereAcondicionamiento = esVinil &&
    !!datos.tipo_piso_actual &&
    !pisosSinAcond.includes(datos.tipo_piso_actual)

  const precio = calcularCotizacion(servicio, cantidad, requiereAcondicionamiento)
  const colores = servicio === 'cocina-modular' ? COLORES_COCINA : COLORES_VINIL
  const colorInfo = colores.find(c => c.id === datos.color_seleccionado)

  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">
        <CheckCircle className="w-16 h-16 text-green-500" />
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Tu cotización está lista!</h2>
      <p className="text-gray-500 mb-8">
        Te enviamos los detalles a <span className="font-medium text-gray-700">{datos.email}</span>
      </p>

      {/* Tarjeta de cotización */}
      <div className="bg-white border-2 border-blue-200 rounded-2xl p-6 text-left mb-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
          <span className="text-3xl">{info.icono}</span>
          <div>
            <h3 className="font-bold text-gray-800">{info.nombre}</h3>
            <p className="text-sm text-gray-500">
              {cantidad} {info.unidad}
              {colorInfo && ` · ${colorInfo.nombre}`}
            </p>
          </div>
        </div>

        {precio ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 mb-1">Presupuesto estimado</p>
            <p className="text-4xl font-bold" style={{ color: '#134a9c' }}>
              {formatCurrency(precio.min)} – {formatCurrency(precio.max)}
            </p>
            {precio.acondicionamiento > 0 && (
              <div className="mt-3 text-left bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
                <p className="font-semibold text-amber-800">Incluye acondicionamiento de piso</p>
                <p className="text-amber-700 mt-0.5">
                  +{formatCurrency(precio.acondicionamiento)} estimado ($3/m²). El precio exacto puede variar entre $3–$7/m² y será confirmado por nuestros asesores.
                </p>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">
              * Precio referencial. Puede variar según condiciones del sitio.
            </p>
          </div>
        ) : (
          <div className="text-center py-4 bg-blue-50 rounded-xl">
            <p className="text-blue-900 font-medium">
              Un asesor calculará tu cotización personalizada
            </p>
            <p className="text-sm text-blue-700 mt-1">Te contactamos en menos de 24 horas</p>
          </div>
        )}
      </div>

      {/* Próximos pasos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4 text-left">
          <Phone className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-700">Te llamamos</p>
            <p className="text-xs text-gray-500">Un asesor se comunicará al {datos.telefono}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4 text-left">
          <Mail className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-700">Correo con detalles</p>
            <p className="text-xs text-gray-500">Recibirás el resumen en tu email</p>
          </div>
        </div>
      </div>

      {/* CTA Visualizador IA */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
        <Camera className="w-10 h-10 mx-auto mb-3 opacity-90" />
        <h3 className="text-xl font-bold mb-2">¿Cómo quedaría en tu espacio?</h3>
        <p className="text-blue-100 text-sm mb-4">
          Sube una foto de tu espacio y nuestra IA te muestra cómo quedaría con el material elegido
        </p>
        <Link
          href={`/visualizador${cotizacionId ? `?cotizacion=${cotizacionId}` : ''}`}
          className="inline-block bg-white text-blue-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors"
        >
          Ver render de mi espacio →
        </Link>
      </div>
    </div>
  )
}

