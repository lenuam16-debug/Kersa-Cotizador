'use client'

import { useState } from 'react'
import { PasoForm } from '@/types'
import {
  ACABADOS_COCINA, TOPES_COCINA, LED_COCINA, ACCESORIOS_COCINA, COCINA_FLETE_TIERS, TOPE_INCLUYE,
  calcularCotizacionCocina, entradaCocinaDesdeForm, mlEfectivosCocina,
} from '@/lib/pricing'
import { calcularFleteCocina, zonaCocinaDesdeMunicipio } from '@/lib/fleteCocina'
import { CIUDADES, CIUDADES_MUNICIPIOS } from '@/lib/ubicaciones'
import { cn, formatCurrency } from '@/lib/utils'

interface Props {
  datos: PasoForm
  onChange: (d: Partial<PasoForm>) => void
}

// Lo único obligatorio para ver el precio: acabado, metros de mueble y municipio
// (el mesón viene incluido con Cuarzo y los mismos metros del mueble, como en la
// app interna; la zona de flete se deriva del municipio). Espejo exacto de lo
// que usa Cotizador.tsx para habilitar "Siguiente".
export function camposFaltantesCocina(datos: PasoForm): string[] {
  const ml = mlEfectivosCocina(datos)
  const falta: string[] = []
  if (!datos.acabado_cocina) falta.push('elegir el acabado')
  if (!ml.mueble) falta.push('los metros de mueble')
  if (datos.led_incluido && !ml.led) falta.push('los metros de luz LED')
  if (!datos.ciudad?.trim()) falta.push('tu estado')
  else if (!datos.municipio?.trim()) falta.push('tu municipio')
  return falta
}

export function cocinaListaParaAvanzar(datos: PasoForm): boolean {
  return camposFaltantesCocina(datos).length === 0
}

const inputClase = 'w-full sm:w-44 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none text-base font-medium'
const enfocar = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = '#134a9c' }
const desenfocar = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = 'rgb(229 231 235)' }
const numero = (v: string) => { const n = parseFloat(v); return isNaN(n) ? undefined : n }

function Check({ on }: { on: boolean }) {
  return (
    <div className={cn(
      'mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all',
      on ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
    )}>
      {on && (
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
        </svg>
      )}
    </div>
  )
}

export default function PasoCocina({ datos, onChange }: Props) {
  const [extrasAbiertos, setExtrasAbiertos] = useState(false)

  const municipios = datos.ciudad ? CIUDADES_MUNICIPIOS[datos.ciudad] ?? [] : []
  const ml = mlEfectivosCocina(datos)
  const topeIncluido = datos.tope_incluido !== false
  const topeMaterial = datos.tope_material ?? 'cuarzo'
  const topeSel = TOPES_COCINA.find(t => t.id === topeMaterial)!
  const ledColor = datos.led_color ?? 'blanca'
  const accesorios = datos.accesorios_cocina ?? { condimentero: 0, platera: 0, cubiertero: 0 }
  const hayExtras = !!datos.salpicadero_incluido || !!datos.led_incluido || Object.values(accesorios).some(v => v > 0)
  const mostrarExtras = extrasAbiertos || hayExtras

  // Precio aproximado en vivo: mismas funciones que usa el resultado final.
  const calc = calcularCotizacionCocina(entradaCocinaDesdeForm(datos))
  const zona = zonaCocinaDesdeMunicipio(datos.municipio)
  const flete = calcularFleteCocina(zona)
  const faltan = camposFaltantesCocina(datos)
  const montoFlete = flete.tipo === 'monto' ? flete.monto : 0
  const total = calc ? calc.total + montoFlete : null
  const sub = (grupo: 'mueble' | 'tope' | 'extra') => calc ? calc.items.filter(i => i.grupo === grupo).reduce((s, i) => s + i.subtotal, 0) : 0

  const cambiarAccesorio = (id: 'condimentero' | 'platera' | 'cubiertero', delta: number) => {
    const nuevo = Math.max(0, (accesorios[id] ?? 0) + delta)
    onChange({ accesorios_cocina: { ...accesorios, [id]: nuevo } })
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Tu cocina modular</h2>
      <p className="text-gray-500 mb-8">
        Responde estas preguntas y verás tu precio aproximado aquí mismo. No necesitas medidas exactas: el técnico las confirma en la visita.
      </p>

      <div className="space-y-6">
        {/* Acabado */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">¿En qué acabado quieres los muebles?</label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {ACABADOS_COCINA.map((a) => {
              const seleccionado = datos.acabado_cocina === a.id
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onChange({ acabado_cocina: a.id })}
                  className={cn(
                    'flex flex-col items-start gap-1.5 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 text-left transition-all',
                    seleccionado ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="w-full h-8 sm:h-10 rounded-lg" style={{ backgroundColor: a.hex, border: '1px solid rgba(0,0,0,0.08)' }} />
                  <p className={cn('font-semibold text-xs sm:text-sm leading-tight', seleccionado ? 'text-blue-700' : 'text-gray-800')}>{a.nombre}</p>
                  <p className="text-xs font-semibold text-gray-700">${a.precio}/ML</p>
                  <p className="text-[11px] sm:text-xs text-gray-500 leading-tight">{a.descripcion}</p>
                  {a.nota && <p className="text-[11px] sm:text-xs text-gray-400 leading-tight">{a.nota}</p>}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 mt-2">Precio por metro lineal (ML) de mueble · incluye fabricación e instalación.</p>
        </div>

        {/* Metros lineales totales */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ¿Cuántos metros lineales (ML) de mueble necesitas en total?
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              inputMode="decimal"
              min="1"
              step="0.5"
              placeholder="Ej: 4.5"
              value={datos.metros_lineales ?? ''}
              onChange={(e) => onChange({ metros_lineales: numero(e.target.value) })}
              className={cn(inputClase, 'text-lg')}
              onFocus={enfocar}
              onBlur={desenfocar}
            />
            <span className="text-gray-500 font-medium">ML</span>
          </div>
          <div className="mt-2 bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
            📏 <strong>¿Cómo lo calculo?</strong> Suma el largo de cada pared donde irá mueble. Cada pared se cuenta una sola vez, aunque lleve muebles abajo y arriba: el precio por ML ya incluye ambos. Ejemplo: una pared de 3 m + otra de 2 m en forma de L = 5 ML. No hace falta restar la nevera ni las ventanas — el técnico ajusta la medida exacta en la visita.
          </div>
        </div>

        {/* Mesón (tope) */}
        <div>
          <button
            type="button"
            onClick={() => onChange(topeIncluido
              ? { tope_incluido: false, salpicadero_incluido: false, salpicadero_ml: undefined }
              : { tope_incluido: true })}
            className={cn(
              'w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all',
              topeIncluido ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <Check on={topeIncluido} />
            <div>
              <p className={cn('font-semibold text-sm', topeIncluido ? 'text-blue-700' : 'text-gray-700')}>Incluir mesón (tope de cocina)</p>
              <p className="text-xs text-gray-500 mt-0.5">El precio por metro incluye la piedra, fabricación e instalación. Desmárcalo solo si ya tienes uno.</p>
            </div>
          </button>

          {topeIncluido && (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {TOPES_COCINA.map((t) => {
                  const seleccionado = topeMaterial === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onChange({ tope_material: t.id, tope_color: undefined })}
                      className={cn(
                        'p-2.5 sm:p-3 rounded-xl border-2 text-left transition-all',
                        seleccionado ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <p className={cn('font-semibold text-xs sm:text-sm leading-tight', seleccionado ? 'text-blue-700' : 'text-gray-800')}>{t.nombre}</p>
                      <p className="text-xs text-gray-500 mt-1">${t.precio}/ML</p>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400">{TOPE_INCLUYE}.</p>

              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1.5">
                  {topeSel.id === 'piedra-esp' ? 'Marca' : 'Color'} <span className="font-normal text-gray-400">(opcional, no cambia el precio)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {topeSel.colores.map((c) => {
                    const seleccionado = datos.tope_color === c.id
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onChange({ tope_color: seleccionado ? undefined : c.id })}
                        className={cn(
                          'px-3 py-2 rounded-full border-2 text-xs font-medium transition-all touch-manipulation',
                          seleccionado ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        )}
                      >
                        {c.nombre}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Metros lineales de mesón</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0.5"
                  step="0.5"
                  placeholder={ml.mueble ? `Igual al mueble: ${ml.mueble} ML` : 'Ej: 4.5'}
                  value={datos.tope_ml ?? ''}
                  onChange={(e) => onChange({ tope_ml: numero(e.target.value) })}
                  className={inputClase}
                  onFocus={enfocar}
                  onBlur={desenfocar}
                />
                <p className="text-xs text-gray-400 mt-1">Si lo dejas vacío usamos los mismos metros del mueble.</p>
              </div>
            </div>
          )}
        </div>

        {/* Ubicación: define el flete */}
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">¿Dónde se instalará? — Estado</label>
              <select
                value={datos.ciudad ?? ''}
                onChange={(e) => onChange({ ciudad: e.target.value, municipio: '', zona_entrega: undefined })}
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
                onChange={(e) => onChange({ municipio: e.target.value, zona_entrega: zonaCocinaDesdeMunicipio(e.target.value) })}
                disabled={!datos.ciudad}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none bg-white disabled:opacity-50"
              >
                <option value="">Selecciona tu municipio</option>
                {municipios.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {flete.tipo === 'monto'
              ? `Traslado e instalación (flete y gastos operativos) en ${datos.municipio}: $${flete.monto}, ya incluido en el precio aproximado.`
              : zona === 'otra'
                ? 'Tu municipio no está en nuestro tabulador de flete: un asesor te lo confirma.'
                : `Traslado e instalación (flete y gastos operativos): ${COCINA_FLETE_TIERS.map(t => `$${t.tarifa} en ${t.titulo}`).join(' · ')}.`}
          </p>
        </div>

        {/* Extras opcionales */}
        <div>
          <button
            type="button"
            onClick={() => setExtrasAbiertos(!mostrarExtras)}
            className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-dashed border-gray-300 text-left hover:border-gray-400 transition-all"
          >
            <div>
              <p className="font-semibold text-sm text-gray-700">Agregar extras <span className="text-gray-400 font-normal">(opcional)</span></p>
              <p className="text-xs text-gray-500 mt-0.5">Salpicadero, luz LED y accesorios internos</p>
            </div>
            <span className="text-gray-400 text-lg">{mostrarExtras ? '▴' : '▾'}</span>
          </button>

          {mostrarExtras && (
            <div className="mt-3 space-y-4">
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
                  <Check on={!!datos.salpicadero_incluido} />
                  <div>
                    <p className={cn('font-semibold text-sm', datos.salpicadero_incluido ? 'text-blue-700' : 'text-gray-700')}>Salpicadero</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {topeIncluido
                        ? `Franja de la misma piedra del mesón, pegada a la pared para que no se manche al cocinar · $${topeSel.precio}/ML`
                        : 'Primero incluye el mesón: el salpicadero va en el mismo material y color'}
                    </p>
                  </div>
                </button>
                {topeIncluido && datos.salpicadero_incluido && (
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Metros lineales de salpicadero</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0.5"
                      step="0.5"
                      placeholder={ml.tope ? `Igual al mesón: ${ml.tope} ML` : 'Ej: 3'}
                      value={datos.salpicadero_ml ?? ''}
                      onChange={(e) => onChange({ salpicadero_ml: numero(e.target.value) })}
                      className={inputClase}
                      onFocus={enfocar}
                      onBlur={desenfocar}
                    />
                    <p className="text-xs text-gray-400 mt-1">Si lo dejas vacío usamos los mismos metros del mesón.</p>
                  </div>
                )}
              </div>

              {/* Luz LED */}
              <div>
                <button
                  type="button"
                  onClick={() => onChange({ led_incluido: !datos.led_incluido })}
                  className={cn(
                    'w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all',
                    datos.led_incluido ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <Check on={!!datos.led_incluido} />
                  <div>
                    <p className={cn('font-semibold text-sm', datos.led_incluido ? 'text-blue-700' : 'text-gray-700')}>Luz LED</p>
                    <p className="text-xs text-gray-500 mt-0.5">Normalmente va debajo de los muebles de arriba para iluminar el mesón · $50/ML instalada</p>
                  </div>
                </button>
                {datos.led_incluido && (
                  <div className="mt-3 space-y-3">
                    <div className="flex gap-2">
                      {LED_COCINA.map((l) => {
                        const seleccionado = ledColor === l.id
                        return (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => onChange({ led_color: l.id })}
                            className={cn(
                              'px-4 py-2 rounded-full border-2 text-sm font-medium transition-all touch-manipulation',
                              seleccionado ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                            )}
                          >
                            Luz {l.nombre.toLowerCase()}
                          </button>
                        )
                      })}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Metros lineales de luz LED</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0.5"
                        step="0.5"
                        placeholder="Ej: 3"
                        value={datos.led_ml ?? ''}
                        onChange={(e) => onChange({ led_ml: numero(e.target.value) })}
                        className={inputClase}
                        onFocus={enfocar}
                        onBlur={desenfocar}
                      />
                      <p className="text-xs text-gray-400 mt-1">Suele ser el largo de los muebles de arriba.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Accesorios */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Accesorios por dentro de los muebles</p>
                <div className="space-y-2">
                  {ACCESORIOS_COCINA.map((acc) => {
                    const cant = accesorios[acc.id] ?? 0
                    return (
                      <div key={acc.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border-2 border-gray-200">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800">{acc.nombre} <span className="text-xs text-gray-500 font-normal">· ${acc.precio} c/u</span></p>
                          <p className="text-xs text-gray-500">{acc.descripcion}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            aria-label={`Quitar ${acc.nombre}`}
                            disabled={cant === 0}
                            onClick={() => cambiarAccesorio(acc.id, -1)}
                            className="w-11 h-11 rounded-full border-2 border-gray-200 text-gray-600 text-xl leading-none font-bold touch-manipulation select-none disabled:opacity-30 active:bg-gray-100"
                          >
                            −
                          </button>
                          <span className="w-6 text-center font-semibold text-gray-800">{cant}</span>
                          <button
                            type="button"
                            aria-label={`Agregar ${acc.nombre}`}
                            onClick={() => cambiarAccesorio(acc.id, 1)}
                            className="w-11 h-11 rounded-full border-2 border-gray-200 text-gray-600 text-xl leading-none font-bold touch-manipulation select-none active:bg-gray-100"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detalles adicionales */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ¿Algo más que debamos saber? <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Ej: quiero isla, nicho para la nevera, la cocina tiene forma de L..."
            value={datos.detalles_adicionales ?? ''}
            onChange={(e) => onChange({ detalles_adicionales: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none resize-none text-base"
          />
        </div>
      </div>

      {/* Precio aproximado en vivo */}
      <div className="sticky bottom-0 mt-6 -mx-2 px-4 py-3 rounded-2xl border-2 border-blue-100 bg-white/95 backdrop-blur shadow-lg">
        {calc && total !== null ? (
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tu precio aproximado</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                Muebles {formatCurrency(sub('mueble'))}
                {sub('tope') > 0 && ` · Mesón ${formatCurrency(sub('tope'))}`}
                {sub('extra') > 0 && ` · Extras ${formatCurrency(sub('extra'))}`}
                {flete.tipo === 'monto' ? ` · Flete ${formatCurrency(flete.monto)}` : ' · Flete a confirmar'}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">Más IVA · referencial, se confirma en la visita técnica</p>
              {faltan.length > 0 && (
                <p className="text-xs text-amber-600 font-medium mt-1">Para continuar falta: {faltan[0]}</p>
              )}
            </div>
            <p className="text-2xl sm:text-3xl font-black whitespace-nowrap" style={{ color: '#134a9c' }}>{formatCurrency(total)}</p>
          </div>
        ) : (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tu precio aproximado</p>
            <p className="text-sm text-gray-700 mt-0.5">Para ver tu precio falta: <span className="font-semibold">{faltan[0] ?? 'completar los datos'}</span></p>
          </div>
        )}
      </div>
    </div>
  )
}
