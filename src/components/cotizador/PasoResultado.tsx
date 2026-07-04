'use client'

import { PasoForm } from '@/types'
import { SERVICIOS, calcularCotizacion, COLORES_VINIL, COLORES_COCINA } from '@/lib/pricing'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle, Phone, Mail, Camera, Printer } from 'lucide-react'
import Link from 'next/link'

interface Props {
  datos: PasoForm
  cotizacionId?: string
}

const FLETES: Record<string, number> = {
  'Caracas (Distrito Capital)': 40,
  'Miranda': 60,
  'La Guaira (Vargas)': 80,
}

function getFlete(ciudad?: string): number | null {
  if (!ciudad) return null
  for (const [key, val] of Object.entries(FLETES)) {
    if (ciudad.toLowerCase().includes(key.toLowerCase())) return val
  }
  return null
}

const COSTO_PERFIL_TERMINACION = 30 // $ por unidad (fijo para LVT)
const COSTO_ACOND_M2 = 3             // $ base por m²

export default function PasoResultado({ datos, cotizacionId }: Props) {
  const servicio = datos.servicio!
  const info = SERVICIOS[servicio]
  const cantidad = servicio === 'cocina-modular'
    ? datos.metros_lineales ?? 0
    : datos.metros_cuadrados ?? 0

  const esLVT = servicio === 'vinil-lvt'

  // Para LVT calculamos el precio base SIN acondicionamiento (lo mostramos separado)
  const precio = calcularCotizacion(servicio, cantidad, false)
  const colores = servicio === 'cocina-modular' ? COLORES_COCINA : COLORES_VINIL
  const colorInfo = colores.find(c => c.id === datos.color_seleccionado)
  const flete = getFlete(datos.ciudad)
  const fechaHoy = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })
  const nroCotizacion = cotizacionId ? cotizacionId.slice(0, 8).toUpperCase() : 'PENDIENTE'

  // Extras LVT: acondicionamiento siempre + 1 perfil de terminación
  const costoAcond = esLVT ? COSTO_ACOND_M2 * cantidad : 0
  const costoPerfil = esLVT ? COSTO_PERFIL_TERMINACION : 0

  // Usamos precio.max como precio estándar (precio completo, sin descuento mínimo)
  const costoBase = precio ? precio.max : 0
  const total = precio ? costoBase + costoAcond + costoPerfil + (flete ?? 0) : null

  const visualizadorUrl = `/visualizador?${cotizacionId ? `cotizacion=${cotizacionId}&` : ''}servicio=${servicio}${colorInfo ? `&color=${colorInfo.id}` : ''}`

  return (
    <div>
      {/* Estilos de impresión */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #cotizacion-imprimible, #cotizacion-imprimible * { visibility: visible !important; }
          #cotizacion-imprimible { position: fixed; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header confirmación */}
      <div className="text-center mb-6 no-print">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Tu cotización está lista!</h2>
        <p className="text-gray-500">
          Te enviamos los detalles a <span className="font-medium text-gray-700">{datos.email}</span>
        </p>
      </div>

      {/* ===== DOCUMENTO DE COTIZACIÓN IMPRIMIBLE ===== */}
      <div id="cotizacion-imprimible" className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm mb-6">

        {/* Cabecera con logo y datos empresa */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #0f3a7a 0%, #1a56c4 100%)' }}>
          <div className="flex items-center gap-3">
            <img
              src="https://kersadesign.com/imagenes/embed_000_dc2feea6.png"
              alt="KersaDesign"
              className="h-10 object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
          <div className="text-right text-white text-xs leading-relaxed opacity-90">
            <p className="font-bold text-sm mb-0.5">KersaDesign</p>
            <p>Caracas, Venezuela</p>
            <p>Tel: +58 412-123-4567</p>
            <p>info@kersadesign.com</p>
            <p>kersadesign.com</p>
          </div>
        </div>

        {/* Título y número */}
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Presupuesto de instalación</p>
            <p className="text-base font-bold text-gray-800">Cotización #{nroCotizacion}</p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>Fecha: <span className="font-medium text-gray-700">{fechaHoy}</span></p>
            <p className="mt-0.5">Válido por: <span className="font-medium text-gray-700">15 días</span></p>
          </div>
        </div>

        {/* Datos del cliente */}
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cliente</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <div><span className="text-gray-500">Nombre:</span> <span className="font-medium text-gray-800">{datos.nombre}</span></div>
            <div><span className="text-gray-500">Teléfono:</span> <span className="font-medium text-gray-800">{datos.telefono}</span></div>
            <div><span className="text-gray-500">Email:</span> <span className="font-medium text-gray-800">{datos.email}</span></div>
            <div><span className="text-gray-500">Ubicación:</span> <span className="font-medium text-gray-800">{datos.ciudad}{datos.municipio ? ` · ${datos.municipio}` : ''}</span></div>
          </div>
        </div>

        {/* Detalle del servicio */}
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Detalle del servicio</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100">
                <th className="text-left pb-2 font-semibold">Descripción</th>
                <th className="text-right pb-2 font-semibold">Cant.</th>
                <th className="text-right pb-2 font-semibold">Precio unit.</th>
                <th className="text-right pb-2 font-semibold">Total est.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {/* Fila 1: Material + instalación */}
              <tr>
                <td className="py-2">
                  <p className="font-medium text-gray-800">{info.nombre}</p>
                  {colorInfo && <p className="text-xs text-gray-500">Color: {colorInfo.nombre}</p>}
                  <p className="text-xs text-gray-400">Material + mano de obra de instalación</p>
                </td>
                <td className="py-2 text-right text-gray-700">{cantidad} {info.unidad}</td>
                <td className="py-2 text-right text-gray-700">
                  {info.precioBase ? `$${info.precioBase}/${info.unidad}` : 'A cotizar'}
                </td>
                <td className="py-2 text-right font-semibold text-gray-800">
                  {precio ? formatCurrency(costoBase) : 'Personalizada'}
                </td>
              </tr>

              {/* Fila 2: Acondicionamiento (LVT siempre) */}
              {esLVT && (
                <tr>
                  <td className="py-2">
                    <p className="font-medium text-gray-800">Acondicionamiento de piso</p>
                    <p className="text-xs text-gray-400">Nivelación y preparación de la superficie. <span className="text-amber-600">* El costo puede variar según el tipo de piso existente.</span></p>
                  </td>
                  <td className="py-2 text-right text-gray-700">{cantidad} m²</td>
                  <td className="py-2 text-right text-gray-700">${COSTO_ACOND_M2}/m²</td>
                  <td className="py-2 text-right font-semibold text-gray-800">{formatCurrency(costoAcond)}</td>
                </tr>
              )}

              {/* Fila 3: Perfil de terminación (LVT siempre) */}
              {esLVT && (
                <tr>
                  <td className="py-2">
                    <p className="font-medium text-gray-800">Perfil de terminación</p>
                    <p className="text-xs text-gray-400">1 unidad — remate de borde y transición</p>
                  </td>
                  <td className="py-2 text-right text-gray-700">1 ud.</td>
                  <td className="py-2 text-right text-gray-700">—</td>
                  <td className="py-2 text-right font-semibold text-gray-800">{formatCurrency(costoPerfil)}</td>
                </tr>
              )}

              {/* Fila 4: Flete */}
              {flete !== null && (
                <tr>
                  <td className="py-2">
                    <p className="font-medium text-gray-800">Flete / Traslado</p>
                    <p className="text-xs text-gray-400">Entrega en {datos.ciudad}</p>
                  </td>
                  <td className="py-2 text-right text-gray-700">1</td>
                  <td className="py-2 text-right text-gray-700">—</td>
                  <td className="py-2 text-right font-semibold text-gray-800">{formatCurrency(flete)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="px-5 py-4 border-t-2 border-gray-100">
          {total !== null ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">TOTAL ESTIMADO</p>
                <p className="text-xs text-gray-400 mt-0.5">Piso + Acondicionamiento + Perfil + Flete</p>
                {flete === null && (
                  <p className="text-xs text-amber-600 mt-0.5">* Flete no incluido — consultar según ubicación</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-3xl font-black" style={{ color: '#134a9c' }}>
                  {formatCurrency(total)}
                </p>
                <p className="text-xs text-gray-400 mt-1">* Precio referencial sujeto a visita técnica</p>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-blue-900 font-medium">Un asesor calculará tu cotización personalizada</p>
              <p className="text-sm text-blue-700 mt-1">Te contactamos en menos de 24 horas</p>
            </div>
          )}
        </div>

        {/* Footer del documento con botón de descarga */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Presupuesto referencial sujeto a visita técnica.<br />KersaDesign · Caracas, Venezuela · kersadesign.com
          </p>
          <button
            onClick={() => window.print()}
            className="no-print flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Descargar PDF
          </button>
        </div>
      </div>

      {/* Próximos pasos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 no-print">
        <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
          <Phone className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-700">Te llamamos</p>
            <p className="text-xs text-gray-500">Un asesor se comunicará al {datos.telefono}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
          <Mail className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-700">Correo con detalles</p>
            <p className="text-xs text-gray-500">Recibirás el resumen en tu email</p>
          </div>
        </div>
      </div>

      {/* CTA Visualizador IA */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white no-print">
        <Camera className="w-10 h-10 mx-auto mb-3 opacity-90" />
        <h3 className="text-xl font-bold mb-2">¿Cómo quedaría en tu espacio?</h3>
        <p className="text-blue-100 text-sm mb-4">
          Sube una foto de tu espacio y nuestra IA te muestra cómo quedaría con{colorInfo ? ` el color ${colorInfo.nombre}` : ' el material elegido'}
        </p>
        <Link
          href={visualizadorUrl}
          className="inline-block bg-white text-blue-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors"
        >
          Ver render de mi espacio →
        </Link>
      </div>
    </div>
  )
}
