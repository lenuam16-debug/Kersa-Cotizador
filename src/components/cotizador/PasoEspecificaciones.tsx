'use client'

import { Servicio, PasoForm, TipoPiso, PISOS_SIN_ACONDICIONAMIENTO } from '@/types'
import { SERVICIOS, COLORES_VINIL, COLORES_COCINA, COSTO_ACONDICIONAMIENTO } from '@/lib/pricing'
import { CIUDADES, CIUDADES_MUNICIPIOS, minimoM2Vinil } from '@/lib/ubicaciones'
import { cn } from '@/lib/utils'

interface Props {
  servicio: Servicio
  datos: PasoForm
  onChange: (d: Partial<PasoForm>) => void
}

const TIPOS_PISO: { id: TipoPiso; label: string }[] = [
  { id: 'ceramica',     label: 'Cerámica / Baldosa' },
  { id: 'porcelanato',  label: 'Porcelanato' },
  { id: 'losa-rustica', label: 'Losa rústica' },
  { id: 'cemento',      label: 'Cemento / Sobrepiso' },
  { id: 'granito',      label: 'Granito' },
  { id: 'microcemento', label: 'Microcemento' },
  { id: 'otro',         label: 'Otro' },
]

const esVinil = (s: Servicio) => s === 'vinil-lvt' || s === 'vinil-spc'

export default function PasoEspecificaciones({ servicio, datos, onChange }: Props) {
  const info = SERVICIOS[servicio]
  const colores = servicio === 'cocina-modular' ? COLORES_COCINA : COLORES_VINIL
  const mostrarColores = servicio === 'vinil-lvt' || servicio === 'vinil-spc' || servicio === 'cocina-modular'
  const esMetrosCuadrados = servicio !== 'cocina-modular'

  const requiereAcondicionamiento =
    esVinil(servicio) &&
    !!datos.tipo_piso_actual &&
    !PISOS_SIN_ACONDICIONAMIENTO.includes(datos.tipo_piso_actual)

  const municipios = datos.ciudad ? CIUDADES_MUNICIPIOS[datos.ciudad] ?? [] : []
  const minM2 = esVinil(servicio) ? minimoM2Vinil(datos.municipio) : 0
  const metrajeInsuficiente =
    esVinil(servicio) &&
    !!datos.municipio &&
    !!datos.metros_cuadrados &&
    datos.metros_cuadrados > 0 &&
    datos.metros_cuadrados < minM2

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Especificaciones — {info.nombre}
      </h2>
      <p className="text-gray-500 mb-8">Cuéntanos sobre el espacio a intervenir</p>

      <div className="space-y-6">
        {/* Ubicación del proyecto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">¿Dónde está el proyecto? — Estado</label>
            <select
              value={datos.ciudad ?? ''}
              onChange={(e) => onChange({ ciudad: e.target.value, municipio: '' })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none bg-white"
            >
              <option value="">Selecciona tu estado / ciudad</option>
              {CIUDADES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Municipio</label>
            <select
              value={datos.municipio ?? ''}
              onChange={(e) => onChange({ municipio: e.target.value })}
              disabled={!datos.ciudad}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none bg-white disabled:opacity-50"
            >
              <option value="">Selecciona tu municipio</option>
              {municipios.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Aviso de metraje mínimo según municipio */}
        {esVinil(servicio) && datos.municipio && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
            📐 Para tu municipio ({datos.municipio}) el metraje mínimo de instalación es de <strong>{minM2} m²</strong>.
          </div>
        )}

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
              className="w-40 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none text-lg font-medium"
              style={{ borderColor: 'rgb(229 231 235)' }}
              onFocus={e => e.target.style.borderColor = '#134a9c'}
              onBlur={e => e.target.style.borderColor = 'rgb(229 231 235)'}
            />
            <span className="text-gray-500 font-medium">{info.unidad}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {esMetrosCuadrados
              ? 'Ancho × Largo del espacio. Si no lo sabes exacto, pon un estimado.'
              : 'Longitud total de los módulos de cocina que necesitas.'}
          </p>
          {metrajeInsuficiente && (
            <p className="text-sm text-red-600 font-medium mt-2">
              ⚠ El metraje mínimo para {datos.municipio} es de {minM2} m². Aumenta el área para poder cotizar.
            </p>
          )}
        </div>

        {/* Tipo de piso actual — solo vinil */}
        {esVinil(servicio) && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              ¿Qué tipo de piso tienes actualmente?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TIPOS_PISO.map((p) => {
                const seleccionado = datos.tipo_piso_actual === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => onChange({ tipo_piso_actual: p.id })}
                    style={seleccionado ? { borderColor: '#134a9c', backgroundColor: '#eef2fb' } : {}}
                    className={cn(
                      'px-3 py-2.5 rounded-xl border-2 text-sm font-medium text-left transition-all',
                      seleccionado ? '' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    )}
                  >
                    <span style={seleccionado ? { color: '#134a9c' } : {}}>{p.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Aviso de acondicionamiento */}
            {datos.tipo_piso_actual && (
              <div className={cn(
                'mt-3 p-3 rounded-xl text-sm',
                requiereAcondicionamiento
                  ? 'bg-amber-50 border border-amber-200 text-amber-800'
                  : 'bg-green-50 border border-green-200 text-green-800'
              )}>
                {requiereAcondicionamiento ? (
                  <>
                    <p className="font-semibold">Se requiere acondicionamiento de piso</p>
                    <p className="mt-0.5">Se agrega <strong>${COSTO_ACONDICIONAMIENTO}/m²</strong> estimado. El precio final puede variar entre $3–$7/m² según las condiciones del piso, lo cual será confirmado por nuestros asesores.</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">¡No requiere acondicionamiento!</p>
                    <p className="mt-0.5">Tu piso actual permite instalar el vinil directamente.</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Selector de modelo */}
        {mostrarColores && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Modelo / Acabado preferido
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {colores.map((color) => {
                const seleccionado = datos.color_seleccionado === color.id
                return (
                  <button
                    key={color.id}
                    onClick={() => onChange({ color_seleccionado: color.id })}
                    title={color.nombre}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div
                      className="w-full aspect-square rounded-xl overflow-hidden transition-all shadow-sm"
                      style={{
                        border: seleccionado ? '3px solid #134a9c' : '3px solid transparent',
                        transform: seleccionado ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      {color.imagen ? (
                        <img
                          src={color.imagen}
                          alt={color.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full" style={{ backgroundColor: color.hex }} />
                      )}
                    </div>
                    <span className={cn(
                      'text-xs text-center leading-tight',
                      seleccionado ? 'font-semibold' : 'text-gray-500'
                    )} style={seleccionado ? { color: '#134a9c' } : {}}>
                      {color.nombre}
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Los modelos exactos pueden variar según disponibilidad de stock.
            </p>
          </div>
        )}

        {/* Rodapié PVC — solo vinil */}
        {esVinil(servicio) && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ¿Deseas incluir rodapié PVC? <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <button
              type="button"
              onClick={() => onChange({ incluir_rodapie: !datos.incluir_rodapie, ml_rodapie: undefined })}
              className={cn(
                'w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all',
                datos.incluir_rodapie
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className={cn(
                'mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all',
                datos.incluir_rodapie ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
              )}>
                {datos.incluir_rodapie && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                  </svg>
                )}
              </div>
              <div>
                <p className={cn('font-semibold text-sm', datos.incluir_rodapie ? 'text-blue-700' : 'text-gray-700')}>
                  Sí, incluir rodapié PVC
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  $9.6/ML · incluye rodapié, instalación y carateo
                </p>
              </div>
            </button>

            {/* Input de ML cuando está activo */}
            {datos.incluir_rodapie && (
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Metros lineales de rodapié
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      placeholder={
                        datos.metros_cuadrados && datos.metros_cuadrados > 0
                          ? `Estimado: ${Math.ceil(datos.metros_cuadrados * 0.9)} ML`
                          : 'Ej: 54'
                      }
                      value={datos.ml_rodapie ?? ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        onChange({ ml_rodapie: isNaN(val) ? undefined : val })
                      }}
                      className="w-40 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none text-sm font-medium"
                      onFocus={e => e.target.style.borderColor = '#134a9c'}
                      onBlur={e => e.target.style.borderColor = 'rgb(229 231 235)'}
                    />
                    <span className="text-gray-500 text-sm font-medium">ML</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Si no sabes el metraje exacto, lo estimamos al 90% de tu área ({datos.metros_cuadrados && datos.metros_cuadrados > 0 ? `~${Math.ceil(datos.metros_cuadrados * 0.9)} ML` : 'según tus m²'}).
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detalles adicionales */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Detalles adicionales <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Ej: hay escaleras, el espacio tiene humedad, hay muebles que mover..."
            value={datos.detalles_adicionales ?? ''}
            onChange={(e) => onChange({ detalles_adicionales: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none resize-none text-sm"
          />
        </div>
      </div>
    </div>
  )
}
