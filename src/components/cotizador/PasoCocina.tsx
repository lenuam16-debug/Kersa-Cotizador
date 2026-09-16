'use client'

import { PasoForm } from '@/types'
import { ACABADOS_COCINA, TOPES_COCINA, LED_COCINA, ACCESORIOS_COCINA, COCINA_FLETE_TIERS } from '@/lib/pricing'
import { CIUDADES, CIUDADES_MUNICIPIOS } from '@/lib/ubicaciones'
import { cn } from '@/lib/utils'

interface Props {
  datos: PasoForm
  onChange: (d: Partial<PasoForm>) => void
}

const ZONAS_COCINA = COCINA_FLETE_TIERS.flatMap(t => t.zonas)

// Tope incluido por defecto (undefined = incluido); salpicadero y LED apagados
// por defecto. Exportado para que Cotizador.tsx valide sin duplicar reglas.
export function cocinaListaParaAvanzar(datos: PasoForm): boolean {
  if (!datos.ciudad?.trim() || !datos.municipio?.trim()) return false
  if (!datos.zona_entrega) return false
  if (!datos.acabado_cocina) return false
  if (!datos.metros_lineales || datos.metros_lineales <= 0) return false

  const topeIncluido = datos.tope_incluido !== false
  if (topeIncluido) {
    if (!datos.tope_material || !datos.tope_color) return false
    if (!datos.tope_ml || datos.tope_ml <= 0) return false
  }
  if (datos.salpicadero_incluido && (!datos.salpicadero_ml || datos.salpicadero_ml <= 0)) return false
  if (datos.led_incluido) {
    if (!datos.led_color) return false
    if (!datos.led_ml || datos.led_ml <= 0) return false
  }
  return true
}

export function camposFaltantesCocina(datos: PasoForm): string[] {
  const falta: string[] = []
  if (!datos.ciudad?.trim()) falta.push('estado')
  if (datos.ciudad?.trim() && !datos.municipio?.trim()) falta.push('municipio')
  if (!datos.zona_entrega) falta.push('zona de entrega')
  if (!datos.acabado_cocina) falta.push('acabado de cocina')
  if (!datos.metros_lineales || datos.metros_lineales <= 0) falta.push('metros lineales de mueble')

  const topeIncluido = datos.tope_incluido !== false
  if (topeIncluido) {
    if (!datos.tope_material) falta.push('material del tope')
    else if (!datos.tope_color) falta.push('color del tope')
    if (!datos.tope_ml || datos.tope_ml <= 0) falta.push('metros lineales del tope')
  }
  if (datos.salpicadero_incluido && (!datos.salpicadero_ml || datos.salpicadero_ml <= 0)) {
    falta.push('metros lineales del salpicadero')
  }
  if (datos.led_incluido) {
    if (!datos.led_color) falta.push('color del LED')
    if (!datos.led_ml || datos.led_ml <= 0) falta.push('metros lineales del LED')
  }
  return falta
}

export default function PasoCocina({ datos, onChange }: Props) {
  const municipios = datos.ciudad ? CIUDADES_MUNICIPIOS[datos.ciudad] ?? [] : []
  const topeIncluido = datos.tope_incluido !== false
  const topeSel = TOPES_COCINA.find(t => t.id === datos.tope_material)
  const accesorios = datos.accesorios_cocina ?? { condimentero: 0, platera: 0, cubiertero: 0 }

  const cambiarAccesorio = (id: 'condimentero' | 'platera' | 'cubiertero', delta: number) => {
    const actual = accesorios[id] ?? 0
    const nuevo = Math.max(0, actual + delta)
    onChange({ accesorios_cocina: { ...accesorios, [id]: nuevo } })
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Especificaciones — Cocina Modular</h2>
      <p className="text-gray-500 mb-8">Arma tu cocina paso a paso con tus propias medidas</p>

      <div className="space-y-6">
        {/* Acabado */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">¿Qué acabado prefieres?</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {ACABADOS_COCINA.map((a) => {
              const seleccionado = datos.acabado_cocina === a.id
              return (
                <button
                  key={a.id}
                  onClick={() => onChange({ acabado_cocina: a.id })}
                  className={cn(
                    'flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all',
                    seleccionado ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="w-full h-10 rounded-lg" style={{ backgroundColor: a.hex, border: '1px solid rgba(0,0,0,0.08)' }} />
                  <p className={cn('font-semibold text-sm', seleccionado ? 'text-blue-700' : 'text-gray-800')}>{a.nombre}</p>
                  <p className="text-xs text-gray-500">${a.precio}/ML · fabricación e instalación</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Metros lineales totales */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ¿Cuántos metros lineales de mueble necesitas en total?
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              step="0.5"
              placeholder="Ej: 4.5"
              value={datos.metros_lineales ?? ''}
              onChange={(e) => onChange({ metros_lineales: parseFloat(e.target.value) })}
              className="w-40 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none text-lg font-medium"
              onFocus={e => e.target.style.borderColor = '#134a9c'}
              onBlur={e => e.target.style.borderColor = 'rgb(229 231 235)'}
            />
            <span className="text-gray-500 font-medium">ML</span>
          </div>
          <div className="mt-2 bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
            📏 <strong>¿Cómo lo calculo?</strong> Suma el largo de cada pared donde irá mueble (bajos y/o altos). Ejemplo: una pared de 3 m + otra de 2 m en forma de L = 5 ML aproximados. No hace falta restar el espacio de la nevera o las ventanas — el técnico ajusta la medida exacta en la visita.
          </div>
        </div>

        {/* Tope */}
        <div>
          <button
            type="button"
            onClick={() => onChange({ tope_incluido: !topeIncluido })}
            className={cn(
              'w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all',
              topeIncluido ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <div className={cn(
              'mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all',
              topeIncluido ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
            )}>
              {topeIncluido && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                </svg>
              )}
            </div>
            <div>
              <p className={cn('font-semibold text-sm', topeIncluido ? 'text-blue-700' : 'text-gray-700')}>Incluir tope de cocina (mesón)</p>
              <p className="text-xs text-gray-500 mt-0.5">Casi todas las cocinas lo incluyen — desmarca si ya tienes uno</p>
            </div>
          </button>

          {topeIncluido && (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TOPES_COCINA.map((t) => {
                  const seleccionado = datos.tope_material === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => onChange({ tope_material: t.id, tope_color: undefined })}
                      className={cn(
                        'p-3 rounded-xl border-2 text-left transition-all',
                        seleccionado ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <p className={cn('font-semibold text-sm', seleccionado ? 'text-blue-700' : 'text-gray-800')}>{t.nombre}</p>
                      <p className="text-xs text-gray-500">${t.precio}/ML</p>
                    </button>
                  )
                })}
              </div>

              {topeSel && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1.5">Color</p>
                  <div className="flex flex-wrap gap-2">
                    {topeSel.colores.map((c) => {
                      const seleccionado = datos.tope_color === c.id
                      return (
                        <button
                          key={c.id}
                          onClick={() => onChange({ tope_color: c.id })}
                          className={cn(
                            'px-3 py-1.5 rounded-full border-2 text-xs font-medium transition-all',
                            seleccionado ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                          )}
                        >
                          {c.nombre}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder={datos.metros_lineales ? `Estimado: ${datos.metros_lineales} ML (igual al mueble)` : 'Ej: 4.5'}
                  value={datos.tope_ml ?? ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    onChange({ tope_ml: isNaN(val) ? undefined : val })
                  }}
                  className="w-64 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none text-sm font-medium"
                  onFocus={e => e.target.style.borderColor = '#134a9c'}
                  onBlur={e => e.target.style.borderColor = 'rgb(229 231 235)'}
                />
                <span className="text-gray-500 text-sm font-medium">ML de tope</span>
              </div>
            </div>
          )}
        </div>

        {/* Salpicadero */}
        <div>
          <button
            type="button"
            disabled={!topeIncluido}
            onClick={() => onChange({ salpicadero_incluido: !datos.salpicadero_incluido })}
            className={cn(
              'w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all',
              !topeIncluido ? 'border-gray-100 opacity-50 cursor-not-allowed'
                : datos.salpicadero_incluido ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <div className={cn(
              'mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all',
              datos.salpicadero_incluido ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
            )}>
              {datos.salpicadero_incluido && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                </svg>
              )}
            </div>
            <div>
              <p className={cn('font-semibold text-sm', datos.salpicadero_incluido ? 'text-blue-700' : 'text-gray-700')}>
                Incluir salpicadero <span className="text-gray-400 font-normal">(opcional)</span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {topeIncluido ? 'Mismo material y color del tope elegido' : 'Agrega un tope de cocina primero'}
              </p>
            </div>
          </button>

          {topeIncluido && datos.salpicadero_incluido && (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min="0.5"
                step="0.5"
                placeholder={datos.tope_ml ? `Estimado: ${datos.tope_ml} ML` : 'Ej: 3'}
                value={datos.salpicadero_ml ?? ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  onChange({ salpicadero_ml: isNaN(val) ? undefined : val })
                }}
                className="w-64 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none text-sm font-medium"
                onFocus={e => e.target.style.borderColor = '#134a9c'}
                onBlur={e => e.target.style.borderColor = 'rgb(229 231 235)'}
              />
              <span className="text-gray-500 text-sm font-medium">ML de salpicadero</span>
            </div>
          )}
        </div>

        {/* LED */}
        <div>
          <button
            type="button"
            onClick={() => onChange({ led_incluido: !datos.led_incluido })}
            className={cn(
              'w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all',
              datos.led_incluido ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <div className={cn(
              'mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all',
              datos.led_incluido ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
            )}>
              {datos.led_incluido && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                </svg>
              )}
            </div>
            <div>
              <p className={cn('font-semibold text-sm', datos.led_incluido ? 'text-blue-700' : 'text-gray-700')}>
                Incluir cinta LED <span className="text-gray-400 font-normal">(opcional)</span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">$50/ML · Blanca o Amarilla</p>
            </div>
          </button>

          {datos.led_incluido && (
            <div className="mt-3 space-y-3">
              <div className="flex gap-2">
                {LED_COCINA.map((l) => {
                  const seleccionado = datos.led_color === l.id
                  return (
                    <button
                      key={l.id}
                      onClick={() => onChange({ led_color: l.id })}
                      className={cn(
                        'px-4 py-2 rounded-full border-2 text-sm font-medium transition-all',
                        seleccionado ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      )}
                    >
                      {l.nombre}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder={datos.metros_lineales ? `Estimado: ${datos.metros_lineales} ML` : 'Ej: 4.5'}
                  value={datos.led_ml ?? ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    onChange({ led_ml: isNaN(val) ? undefined : val })
                  }}
                  className="w-64 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none text-sm font-medium"
                  onFocus={e => e.target.style.borderColor = '#134a9c'}
                  onBlur={e => e.target.style.borderColor = 'rgb(229 231 235)'}
                />
                <span className="text-gray-500 text-sm font-medium">ML de LED</span>
              </div>
            </div>
          )}
        </div>

        {/* Accesorios */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Accesorios internos <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <div className="space-y-2">
            {ACCESORIOS_COCINA.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between p-3 rounded-xl border-2 border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-800">{acc.nombre}</p>
                  <p className="text-xs text-gray-500">${acc.precio}/ud</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => cambiarAccesorio(acc.id, -1)}
                    className="w-8 h-8 rounded-full border-2 border-gray-200 text-gray-600 font-bold hover:border-gray-300"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-semibold text-gray-800">{accesorios[acc.id] ?? 0}</span>
                  <button
                    type="button"
                    onClick={() => cambiarAccesorio(acc.id, 1)}
                    className="w-8 h-8 rounded-full border-2 border-gray-200 text-gray-600 font-bold hover:border-gray-300"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

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

        {/* Zona de entrega — tarifa plana propia de cocina, no el tabulador de piso */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Zona de entrega</label>
          <select
            value={datos.zona_entrega ?? ''}
            onChange={(e) => onChange({ zona_entrega: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none bg-white"
          >
            <option value="">Selecciona tu municipio de entrega</option>
            {ZONAS_COCINA.map((z) => <option key={z} value={z}>{z}</option>)}
            <option value="otra">Otra zona (no está en la lista)</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            {datos.zona_entrega === 'otra'
              ? 'Un asesor te confirmará el flete para tu zona.'
              : 'El flete de cocina es una tarifa fija según tu municipio.'}
          </p>
        </div>

        {/* Detalles adicionales */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Detalles adicionales <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Ej: quiero isla, nicho para nevera, la cocina tiene forma de L..."
            value={datos.detalles_adicionales ?? ''}
            onChange={(e) => onChange({ detalles_adicionales: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none resize-none text-sm"
          />
        </div>
      </div>
    </div>
  )
}
