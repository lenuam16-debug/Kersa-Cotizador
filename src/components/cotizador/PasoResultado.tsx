'use client'

import { useEffect, useRef, useState } from 'react'
import { PasoForm } from '@/types'
import {
  SERVICIOS, calcularCotizacion, COLORES_VINIL, COLORES_LVT_3MM, COLORES_SPC, COSTO_FOAM_SPC,
  ACABADOS_COCINA, calcularCotizacionCocina, entradaCocinaDesdeForm, type ItemCocina,
} from '@/lib/pricing'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle, CalendarCheck, MessageCircle, Printer, Loader2, AlertCircle } from 'lucide-react'
import { track } from '@/lib/track'
import { calcularFlete, KG_M2_VINIL, KG_ML_RODAPIE, type ResultadoFlete } from '@/lib/flete'
import { calcularFleteCocina, zonaCocinaDesdeMunicipio } from '@/lib/fleteCocina'

interface Props {
  datos: PasoForm
  cotizacionId?: string
  leadId?: string
}

// Agenda propia (tabla visitas del CRM) vía la función agenda-cotizador
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://awscrogqprosivmtgkio.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3c2Nyb2dxcHJvc2l2bXRna2lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMjQ1NDIsImV4cCI6MjA5NzkwMDU0Mn0.WcYei2z8UGNCTQaWKSTNeWEJByWKTNqHyyCrwcPPnTQ'

function horaTxt(h: number): string {
  if (h < 12) return `${h}:00 am`
  if (h === 12) return '12:00 m'
  return `${h - 12}:00 pm`
}

interface DiaDisponible { fecha: string; dia: string; libres: number[] }

// Mismo mapa que UNIDAD_CORTA del cotizador de la app, para que las líneas de
// la cotización se escriban igual ("40 m² x $20,00/m²")
const UNIDAD_CORTA: Record<string, string> = {
  'm²': '/m²', 'lámina': '/lámina', 'metro lineal': '/ml', 'saco': '/saco',
  'bolsa': '/bolsa', 'pieza': '/pieza', 'caja': '/caja', 'rollo': '/rollo', 'kit': '/kit',
}


const COSTO_PERFIL_TERMINACION = 30 // $ por unidad (fijo para LVT)
const COSTO_ACOND_M2 = 3             // $ base por m²

/**
 * Agenda inline: cupos reales de la tabla `visitas` (la misma agenda del CRM
 * y la app de Kersa). Sustituye el enlace de Google Calendar que los
 * vendedores no miraban: lo agendado aquí les aparece de una vez en el CRM.
 */
function AgendarVisita({ datos, pedido, leadId }: { datos: PasoForm; pedido: string; leadId?: string }) {
  const [estado, setEstado] = useState<'idle' | 'cargando' | 'elegir' | 'enviando' | 'exito'>('idle')
  const [dias, setDias] = useState<DiaDisponible[]>([])
  const [fecha, setFecha] = useState<string>('')
  const [hora, setHora] = useState<number | null>(null)
  const [direccion, setDireccion] = useState('')
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState<string | null>(null)

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_KEY}`,
  }

  const cargarDisponibilidad = async () => {
    setEstado('cargando')
    setError(null)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/agenda-cotizador`, {
        method: 'POST', headers,
        body: JSON.stringify({ accion: 'disponibilidad', zona: [datos.ciudad, datos.municipio].filter(Boolean).join(' ') }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok || !d.ok || !d.dias?.length) throw new Error(d.error || 'No hay cupos disponibles por ahora')
      setDias(d.dias)
      setFecha(d.dias[0].fecha)
      setHora(null)
      setEstado('elegir')
    } catch (e) {
      track('7x_error_visita', e instanceof Error ? e.message : String(e))
      setError(e instanceof Error ? e.message : 'No se pudo cargar la agenda. Intenta de nuevo.')
      setEstado('idle')
    }
  }

  // Si el cliente deja la pestaña abierta, los cupos envejecen: al volver se
  // vuelven a pedir para no ofrecerle una hora que ya tomó otro.
  useEffect(() => {
    if (estado !== 'elegir') return
    const alVolver = () => { if (!document.hidden) cargarDisponibilidad() }
    document.addEventListener('visibilitychange', alVolver)
    return () => document.removeEventListener('visibilitychange', alVolver)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado])

  const agendar = async () => {
    if (!fecha || hora === null) return
    setEstado('enviando')
    setError(null)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/agenda-cotizador`, {
        method: 'POST', headers,
        body: JSON.stringify({
          accion: 'agendar',
          nombre: datos.nombre ?? '',
          telefono: datos.telefono ?? '',
          direccion: [direccion.trim(), datos.ciudad].filter(Boolean).join(' — ') || null,
          pedido, fecha, hora,
          zona: [datos.ciudad, datos.municipio].filter(Boolean).join(' '),
          lead_id: leadId ?? null,
        }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok || !d.ok) {
        if (d.ocupada) {
          // Recargar cupos y conservar el motivo real (ocupada o traslado)
          await cargarDisponibilidad()
          setError(d.error || 'Esa hora acaba de ocuparse. Escoge otra.')
          return
        }
        throw new Error(d.error || 'No se pudo agendar la visita.')
      }
      setCodigo(d.codigo)
      setEstado('exito')
      track('7_visita_agendada', d.codigo)
    } catch (e) {
      track('7x_error_visita', e instanceof Error ? e.message : String(e))
      setError(e instanceof Error ? e.message : 'No se pudo agendar. Intenta de nuevo.')
      setEstado('elegir')
    }
  }

  if (estado === 'exito') {
    const diaInfo = dias.find(d => d.fecha === fecha)
    return (
      <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-5 text-center">
        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
        <p className="font-bold text-green-700">¡Visita agendada! {codigo && <span className="font-mono">{codigo}</span>}</p>
        <p className="text-sm text-green-700 mt-1 capitalize">{diaInfo?.dia} · {hora !== null ? horaTxt(hora) : ''}</p>
        <p className="text-xs text-gray-500 mt-2">Nuestro equipo te llamará para confirmar la visita.</p>
      </div>
    )
  }

  if (estado === 'idle' || estado === 'cargando') {
    return (
      <div>
        <button
          onClick={cargarDisponibilidad}
          disabled={estado === 'cargando'}
          className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-4 rounded-2xl transition-colors shadow-sm disabled:opacity-60"
        >
          {estado === 'cargando' ? <Loader2 className="w-6 h-6 animate-spin" /> : <CalendarCheck className="w-6 h-6" />}
          {estado === 'cargando' ? 'Buscando cupos...' : 'Agendar visita técnica'}
        </button>
        {error && (
          <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>
        )}
      </div>
    )
  }

  const diaActual = dias.find(d => d.fecha === fecha)
  return (
    <div className="bg-white border-2 border-blue-200 rounded-2xl p-5 space-y-4">
      <p className="font-bold text-gray-800 flex items-center gap-2">
        <CalendarCheck className="w-5 h-5 text-blue-600" /> Escoge día y hora de tu visita técnica
      </p>

      <div className="flex gap-2 flex-wrap">
        {dias.map(d => (
          <button
            key={d.fecha}
            onClick={() => { setFecha(d.fecha); setHora(null) }}
            className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-colors capitalize ${fecha === d.fecha ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}
          >
            {d.dia}
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(diaActual?.libres ?? []).map(h => (
          <button
            key={h}
            onClick={() => setHora(h)}
            className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${hora === h ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}
          >
            {horaTxt(h)}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={direccion}
        onChange={e => setDireccion(e.target.value)}
        placeholder="Dirección o punto de referencia (opcional)"
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
      />

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>
      )}

      <button
        onClick={agendar}
        disabled={hora === null || estado === 'enviando'}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
      >
        {estado === 'enviando' ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
        {estado === 'enviando' ? 'Agendando...' : 'Confirmar visita'}
      </button>
    </div>
  )
}

export default function PasoResultado({ datos, cotizacionId, leadId }: Props) {
  // Número unificado COT-AAAAMMDD-NNN que asigna la app de vendedores
  const [numeroApp, setNumeroApp] = useState<string | null>(null)
  const enviadaAppRef = useRef<string | null>(null)

  const servicio = datos.servicio!
  const info = SERVICIOS[servicio]
  const esCocina = servicio === 'cocina-modular'
  const cantidad = esCocina
    ? datos.metros_lineales ?? 0
    : datos.metros_cuadrados ?? 0

  // vinil-lvt-3mm copia exactamente la misma formula que vinil-lvt (acondicionamiento
  // siempre, perfil, rodapie opcional, flete): solo cambian precio y colores.
  const esLVT = servicio === 'vinil-lvt' || servicio === 'vinil-lvt-3mm'
  const esSPC = servicio === 'vinil-spc'
  const esVinil = esLVT || esSPC

  // Para LVT calculamos el precio base SIN acondicionamiento (lo mostramos separado)
  const precio = esCocina ? null : calcularCotizacion(servicio, cantidad, false)
  const cocinaCalc = esCocina ? calcularCotizacionCocina(entradaCocinaDesdeForm(datos)) : null
  const resultadoFleteCocina = esCocina ? calcularFleteCocina(zonaCocinaDesdeMunicipio(datos.municipio)) : null

  const colores = servicio === 'vinil-spc' ? COLORES_SPC
    : servicio === 'vinil-lvt-3mm' ? COLORES_LVT_3MM
    : COLORES_VINIL
  const colorInfo = esCocina
    ? ACABADOS_COCINA.find(a => a.id === datos.acabado_cocina)
    : colores.find(c => c.id === datos.color_seleccionado)
  const fechaHoy = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })
  const nroCotizacion = numeroApp ?? (cotizacionId ? cotizacionId.slice(0, 8).toUpperCase() : 'PENDIENTE')

  // El acondicionamiento SIEMPRE se suma en LVT, pero en SPC NO se suma de
  // entrada: solo aplica si el técnico lo recomienda en la visita (mismo
  // precio que LVT, ver aviso en PasoEspecificaciones). El perfil de
  // terminación y el rodapié PVC son accesorios de instalación válidos para
  // cualquier piso vinil (LVT o SPC). El FOAM sí es automático en todo piso SPC.
  const costoAcond = esLVT ? COSTO_ACOND_M2 * cantidad : 0
  const costoPerfil = esVinil ? COSTO_PERFIL_TERMINACION : 0
  const costoFoam = esSPC ? COSTO_FOAM_SPC * cantidad : 0

  // Rodapié PVC: usa ML ingresados por el cliente, o estima 90% del metraje
  const PRECIO_RODAPIE_ML = 9.6
  const incluyeRodapie = esVinil && !!datos.incluir_rodapie
  const mlRodapie = incluyeRodapie
    ? (datos.ml_rodapie ?? Math.ceil(cantidad * 0.9))
    : 0
  const costoRodapie = mlRodapie * PRECIO_RODAPIE_ML

  // Flete con el tabulador de la app: km de la zona + peso del material que se
  // lleva (los servicios no pesan, igual que en pesoCarrito() de la app).
  // La cocina tiene su propia tarifa en la app, así que queda a coordinar.
  const kgCarga = esLVT
    ? cantidad * KG_M2_VINIL + mlRodapie * KG_ML_RODAPIE
    : 0
  const resultadoFlete: ResultadoFlete = esLVT
    ? calcularFlete(datos.zona_entrega, kgCarga)
    : { tipo: 'sin_zona' }
  const flete = resultadoFlete.tipo === 'monto' ? resultadoFlete.monto : null

  // Usamos precio.max como precio estándar (precio completo, sin descuento mínimo)
  const costoBase = precio ? precio.max : 0
  const fleteCocina = resultadoFleteCocina?.tipo === 'monto' ? resultadoFleteCocina.monto : null
  const total = esCocina
    ? (cocinaCalc ? cocinaCalc.total + (fleteCocina ?? 0) : null)
    : (precio ? costoBase + costoAcond + costoPerfil + costoFoam + costoRodapie + (flete ?? 0) : null)

  const whatsappMsg = encodeURIComponent(
    `Hola, acabo de generar mi cotización #${nroCotizacion} en KersaDesign para ${info.nombre}${colorInfo ? ` (${colorInfo.nombre})` : ''} — ${cantidad} ${info.unidad}${total ? `. Total estimado: ${formatCurrency(total)}` : ''}. Me gustaría más información.`
  )
  const whatsappUrl = `https://wa.me/584142568220?text=${whatsappMsg}`
  const pedidoVisita = `${info.nombre}${colorInfo ? ` ${colorInfo.nombre}` : ''} · ${cantidad} ${info.unidad} · Cotización #${nroCotizacion}`

  // Registrar la cotización en la app de vendedores (app.kersadesign.com) vía
  // la función cotizacion-web: entra al historial con numeración COT unificada
  // y los vendedores pueden procesar la venta desde allí.
  useEffect(() => {
    if (!cotizacionId || (esCocina ? !cocinaCalc : !precio) || enviadaAppRef.current === cotizacionId) return
    enviadaAppRef.current = cotizacionId

    const lineas: { c: string; n: string; u: string; cant: number; m2: number | null; pUsd: number; subUsd: number }[] = []

    if (esCocina && cocinaCalc) {
      // Mismas unidades que usa la app para cocina ('ml' / 'unidad')
      for (const item of cocinaCalc.items) {
        lineas.push({
          c: item.sku, n: item.nombre, u: item.unidad === 'metro lineal' ? 'ml' : 'unidad',
          cant: item.cantidad, m2: null, pUsd: item.precioUnit, subUsd: +item.subtotal.toFixed(2),
        })
      }
      if (resultadoFleteCocina?.tipo === 'monto') {
        lineas.push({ c: resultadoFleteCocina.sku, n: `Flete y gastos operativos — ${resultadoFleteCocina.titulo}`, u: 'servicio', cant: 1, m2: null, pUsd: resultadoFleteCocina.monto, subUsd: resultadoFleteCocina.monto })
      }
    } else {
      const nombreBase = `${info.nombre}${colorInfo ? ` — ${colorInfo.nombre}` : ''} (instalación incluida)`
      // unidades con el mismo nombre que usa la app (ML → metro lineal)
      const unidadServicio = info.unidad === 'ML' ? 'metro lineal' : info.unidad
      lineas.push({
        c: `WEB-${servicio.toUpperCase()}`, n: nombreBase, u: unidadServicio,
        cant: cantidad, m2: cantidad,
        pUsd: cantidad ? +(costoBase / cantidad).toFixed(2) : costoBase, subUsd: +costoBase.toFixed(2),
      })
      if (costoAcond > 0) lineas.push({ c: 'WEB-ACOND', n: 'Acondicionamiento de piso', u: 'm²', cant: cantidad, m2: cantidad, pUsd: COSTO_ACOND_M2, subUsd: +costoAcond.toFixed(2) })
      if (costoPerfil > 0) lineas.push({ c: 'WEB-PERFIL', n: 'Perfil de terminación', u: 'ud', cant: 1, m2: null, pUsd: costoPerfil, subUsd: costoPerfil })
      if (costoFoam > 0) lineas.push({ c: 'WEB-FOAM', n: 'Foam (base niveladora, incluido en piso clic)', u: 'm²', cant: cantidad, m2: cantidad, pUsd: COSTO_FOAM_SPC, subUsd: +costoFoam.toFixed(2) })
      if (costoRodapie > 0) lineas.push({ c: 'WEB-RODAPIE', n: 'Rodapié PVC (instalación y carateo)', u: 'metro lineal', cant: mlRodapie, m2: null, pUsd: PRECIO_RODAPIE_ML, subUsd: +costoRodapie.toFixed(2) })
      // Mismo renglón que agrega la app: "Flete a <zona>", unidad servicio
      if (resultadoFlete.tipo === 'monto') lineas.push({ c: 'SRV-FLETE', n: `Flete a ${resultadoFlete.zona}`, u: 'servicio', cant: 1, m2: null, pUsd: resultadoFlete.monto, subUsd: resultadoFlete.monto })
    }

    // Mismo formato exacto que textoCotizacion() del cotizador de la app
    // (app.kersadesign.com, rama de divisa): así una cotización web y una de
    // vendedor se leen idénticas en el historial y por WhatsApp.
    const fmt = (v: number | null, d = 2) =>
      v == null || isNaN(v) ? '—' : v.toLocaleString('es-VE', { minimumFractionDigits: d, maximumFractionDigits: d })
    const cortaUnidad = (u: string) => UNIDAD_CORTA[u] ?? (u ? '/' + u : '')

    const direccionCliente = [datos.ciudad, datos.municipio].filter(Boolean).join(' - ')
    let texto = `*KERSA DESIGN — COTIZACIÓN*\n${new Date().toLocaleDateString('es-VE')}`
    if (datos.nombre) texto += `\nCliente: ${datos.nombre}`
    if (datos.telefono) texto += `\nTeléfono: ${datos.telefono}`
    if (direccionCliente) texto += `\nDirección: ${direccionCliente}`
    texto += `\nVendedor: Cotizador Web`
    texto += `\nMoneda: DIVISA ($)`
    texto += '\n\n'
    for (const l of lineas) {
      texto += `• ${l.n}\n  ${l.cant} ${l.u} x $${fmt(l.pUsd)}${cortaUnidad(l.u)} = *$${fmt(l.subUsd)}*\n`
    }
    texto += `\n*TOTAL: $${fmt(total)}*`
    texto += `\n_Precios promocionales por pago en divisa._`
    texto += `\n\n_Cotización válida solo por hoy._`

    fetch(`${SUPABASE_URL}/functions/v1/cotizacion-web`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({
        cotizacion_id: cotizacionId,
        lead_id: leadId ?? null,
        cliente: {
          nombre: datos.nombre ?? '', telefono: datos.telefono ?? '',
          correo: datos.email ?? '', direccion: [datos.ciudad, datos.municipio].filter(Boolean).join(' - '),
        },
        items: lineas,
        totalUsd: total ? +total.toFixed(2) : null,
        texto,
      }),
    })
      .then(r => r.json())
      .then(d => { if (d?.ok && d.numero) { setNumeroApp(d.numero); track('6b_cotizacion_en_app', d.numero) } })
      .catch(() => {}) // la app puede estar caída: el número interno sigue sirviendo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cotizacionId])

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
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-gray-100 bg-white">
          <img
            src="https://kersadesign.com/imagenes/embed_000_dc2feea6.png"
            alt="KersaDesign"
            className="h-12 object-contain"
          />
          <div className="text-right text-xs leading-relaxed text-gray-600">
            <p className="font-bold text-sm text-gray-800 mb-0.5">KersaDesign</p>
            <p>Caracas, Venezuela</p>
            <p>Tel: +58 414-256-8220</p>
            <p>info@kersadesign.com</p>
            <p>kersadesign.com</p>
          </div>
        </div>

        {/* Franja azul decorativa */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #0f3a7a 0%, #1a56c4 100%)' }} />

        {/* Título y número */}
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Presupuesto de instalación</p>
            <p className="text-base font-bold text-gray-800">Cotización #{nroCotizacion}</p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>Fecha: <span className="font-medium text-gray-700">{fechaHoy}</span></p>
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
              {/* Cocina: una fila por cada ítem elegido (mueble, tope, salpicadero, LED, accesorios) */}
              {esCocina && cocinaCalc?.items.map((item: ItemCocina) => (
                <tr key={item.sku}>
                  <td className="py-2">
                    <p className="font-medium text-gray-800">{item.nombre}</p>
                    {item.detalle && <p className="text-xs text-gray-400">{item.detalle}</p>}
                  </td>
                  <td className="py-2 text-right text-gray-700">{item.cantidad} {item.unidad === 'metro lineal' ? 'ML' : 'ud'}</td>
                  <td className="py-2 text-right text-gray-700">${item.precioUnit}/{item.unidad === 'metro lineal' ? 'ML' : 'ud'}</td>
                  <td className="py-2 text-right font-semibold text-gray-800">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
              {esCocina && fleteCocina !== null && resultadoFleteCocina?.tipo === 'monto' && (
                <tr>
                  <td className="py-2">
                    <p className="font-medium text-gray-800">Flete y gastos operativos</p>
                    <p className="text-xs text-gray-400">Zona: {resultadoFleteCocina.zona}</p>
                  </td>
                  <td className="py-2 text-right text-gray-700">1</td>
                  <td className="py-2 text-right text-gray-700">—</td>
                  <td className="py-2 text-right font-semibold text-gray-800">{formatCurrency(fleteCocina)}</td>
                </tr>
              )}

              {/* Fila 1: Material + instalación (piso vinil) */}
              {!esCocina && (
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
              )}

              {/* Fila 2: Acondicionamiento (LVT siempre) */}
              {esLVT && (
                <tr>
                  <td className="py-2">
                    <p className="font-medium text-gray-800">Acondicionamiento de piso</p>
                    <p className="text-xs text-gray-400">Preparación de la superficie, incluye materiales. <span className="text-amber-600">* El costo puede variar según el tipo de piso existente.</span></p>
                  </td>
                  <td className="py-2 text-right text-gray-700">{cantidad} m²</td>
                  <td className="py-2 text-right text-gray-700">${COSTO_ACOND_M2}/m²</td>
                  <td className="py-2 text-right font-semibold text-gray-800">{formatCurrency(costoAcond)}</td>
                </tr>
              )}

              {/* Fila 3: Perfil de terminación (todo piso vinil, LVT o SPC) */}
              {esVinil && (
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

              {/* Fila: Foam — siempre en SPC (piso tipo clic) */}
              {esSPC && (
                <tr>
                  <td className="py-2">
                    <p className="font-medium text-gray-800">Foam (base niveladora)</p>
                    <p className="text-xs text-gray-400">Incluido en toda instalación de piso SPC tipo clic</p>
                  </td>
                  <td className="py-2 text-right text-gray-700">{cantidad} m²</td>
                  <td className="py-2 text-right text-gray-700">${COSTO_FOAM_SPC}/m²</td>
                  <td className="py-2 text-right font-semibold text-gray-800">{formatCurrency(costoFoam)}</td>
                </tr>
              )}

              {/* Fila: Acondicionamiento — informativo en SPC, no se suma al total */}
              {esSPC && (
                <tr>
                  <td className="py-2" colSpan={4}>
                    <p className="font-medium text-gray-800">Acondicionamiento de piso <span className="text-xs font-normal text-blue-600 bg-blue-50 rounded px-1.5 py-0.5 ml-1">Sujeto a visita técnica</span></p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      No incluido en este estimado. Solo aplica si el técnico lo recomienda en la visita — de ser así, se cobra el mismo precio que en Vinil LVT: ${COSTO_ACOND_M2}/m² (puede variar entre $3–$7/m²).
                    </p>
                  </td>
                </tr>
              )}

              {/* Fila 4: Rodapié PVC (solo si el cliente lo eligió) */}
              {incluyeRodapie && (
                <tr>
                  <td className="py-2">
                    <p className="font-medium text-gray-800">
                      Rodapié PVC <span className="text-xs font-normal text-blue-600 bg-blue-50 rounded px-1.5 py-0.5 ml-1">Opcional</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      Incluye rodapié, instalación y carateo · {datos.ml_rodapie ? `${mlRodapie} ML` : `~${mlRodapie} ML estimados (90% del área)`}
                    </p>
                  </td>
                  <td className="py-2 text-right text-gray-700">{mlRodapie} ML</td>
                  <td className="py-2 text-right text-gray-700">${PRECIO_RODAPIE_ML}/ML</td>
                  <td className="py-2 text-right font-semibold text-gray-800">{formatCurrency(costoRodapie)}</td>
                </tr>
              )}

              {/* Fila 5: Flete */}
              {resultadoFlete.tipo === 'monto' && (
                <tr>
                  <td className="py-2">
                    <p className="font-medium text-gray-800">Flete a {resultadoFlete.zona}</p>
                    <p className="text-xs text-gray-400">
                      {resultadoFlete.km} km · carga ≈ {Math.round(resultadoFlete.kg)} kg
                    </p>
                  </td>
                  <td className="py-2 text-right text-gray-700">1</td>
                  <td className="py-2 text-right text-gray-700">—</td>
                  <td className="py-2 text-right font-semibold text-gray-800">{formatCurrency(resultadoFlete.monto)}</td>
                </tr>
              )}
            </tbody>
          </table>
          {esCocina && (
            <p className="text-xs text-gray-400 mt-3">
              El precio cubre solo lo listado arriba: no incluye electrodomésticos ni lavaplatos. Las medidas son estimadas y se confirman en la visita técnica.
            </p>
          )}
        </div>

        {/* Total */}
        <div className="px-5 py-4 border-t-2 border-gray-100">
          {total !== null ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">TOTAL ESTIMADO</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {esCocina ? 'Mueble + Tope + Extras + Flete' : esLVT ? 'Piso + Acondicionamiento + Perfil + Flete' : esSPC ? 'Piso + Foam + Perfil + Flete' : 'Piso + Flete'}
                </p>
                {!esCocina && resultadoFlete.tipo === 'camion' && (
                  <p className="text-xs text-amber-600 mt-0.5">
                    * Flete no incluido — la carga (≈ {Math.round(resultadoFlete.kg)} kg) requiere camión; un asesor te lo confirma
                  </p>
                )}
                {!esCocina && resultadoFlete.tipo === 'sin_zona' && (
                  <p className="text-xs text-amber-600 mt-0.5">* Flete no incluido — un asesor te lo confirma según tu zona</p>
                )}
                {esCocina && resultadoFleteCocina?.tipo === 'sin_zona' && (
                  <p className="text-xs text-amber-600 mt-0.5">* Flete no incluido — un asesor te lo confirma según tu zona</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-3xl font-black" style={{ color: '#134a9c' }}>
                  {formatCurrency(total)}
                </p>
                <p className="text-xs text-amber-600 font-medium mt-1">* Precio más IVA · Precios promocionales para pago en divisa</p>
                <p className="text-xs text-gray-400 mt-0.5">Referencial, sujeto a visita técnica</p>
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
            Presupuesto referencial sujeto a visita técnica.<br />KersaDesign · Urb. Calle Los Huertos, Caracas 1050, Distrito Capital, Venezuela · kersadesign.com
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

      {/* CTAs: Agendar visita (agenda propia) + WhatsApp */}
      <div className="space-y-4 no-print">
        <AgendarVisita datos={datos} pedido={pedidoVisita} leadId={leadId} />
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-4 rounded-2xl transition-colors shadow-sm"
        >
          <MessageCircle className="w-6 h-6" />
          Contactar asesor por WhatsApp
        </a>
      </div>
    </div>
  )
}
