'use client'

import { useRef, useState } from 'react'
import { PasoForm } from '@/types'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { track } from '@/lib/track'

// Verificación del teléfono por WhatsApp (función otp-wa → API oficial de
// WhatsApp, número de la empresa). Es el único canal desde oct 2026: el SMS de
// Firebase dejó de entregar (cuota / facturación) y se eliminó.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://awscrogqprosivmtgkio.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3c2Nyb2dxcHJvc2l2bXRna2lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMjQ1NDIsImV4cCI6MjA5NzkwMDU0Mn0.WcYei2z8UGNCTQaWKSTNeWEJByWKTNqHyyCrwcPPnTQ'

interface Props {
  datos: PasoForm
  onChange: (d: Partial<PasoForm>) => void
}

// Prefijos de país para el WhatsApp. Venezuela primero; el resto, los países
// desde donde más escriben. El número se guarda completo (+<prefijo><número>).
const PAISES: { codigo: string; nombre: string; bandera: string }[] = [
  { codigo: '58',  nombre: 'Venezuela',       bandera: '🇻🇪' },
  { codigo: '1',   nombre: 'EE.UU. / Canadá', bandera: '🇺🇸' },
  { codigo: '34',  nombre: 'España',          bandera: '🇪🇸' },
  { codigo: '57',  nombre: 'Colombia',        bandera: '🇨🇴' },
  { codigo: '56',  nombre: 'Chile',           bandera: '🇨🇱' },
  { codigo: '51',  nombre: 'Perú',            bandera: '🇵🇪' },
  { codigo: '52',  nombre: 'México',          bandera: '🇲🇽' },
  { codigo: '54',  nombre: 'Argentina',       bandera: '🇦🇷' },
  { codigo: '55',  nombre: 'Brasil',          bandera: '🇧🇷' },
  { codigo: '593', nombre: 'Ecuador',         bandera: '🇪🇨' },
  { codigo: '507', nombre: 'Panamá',          bandera: '🇵🇦' },
  { codigo: '503', nombre: 'El Salvador',     bandera: '🇸🇻' },
  { codigo: '506', nombre: 'Costa Rica',      bandera: '🇨🇷' },
  { codigo: '502', nombre: 'Guatemala',       bandera: '🇬🇹' },
  { codigo: '504', nombre: 'Honduras',        bandera: '🇭🇳' },
  { codigo: '505', nombre: 'Nicaragua',       bandera: '🇳🇮' },
  { codigo: '591', nombre: 'Bolivia',         bandera: '🇧🇴' },
  { codigo: '595', nombre: 'Paraguay',        bandera: '🇵🇾' },
  { codigo: '598', nombre: 'Uruguay',         bandera: '🇺🇾' },
  { codigo: '53',  nombre: 'Cuba',            bandera: '🇨🇺' },
  { codigo: '39',  nombre: 'Italia',          bandera: '🇮🇹' },
  { codigo: '351', nombre: 'Portugal',        bandera: '🇵🇹' },
  { codigo: '33',  nombre: 'Francia',         bandera: '🇫🇷' },
  { codigo: '49',  nombre: 'Alemania',        bandera: '🇩🇪' },
  { codigo: '44',  nombre: 'Reino Unido',     bandera: '🇬🇧' },
]

// Separa un teléfono guardado ("+34612345678" / "0414-1234567") en prefijo + número local
function separarTelefono(t: string): { prefijo: string; local: string } {
  const s = (t ?? '').trim()
  if (s.startsWith('+')) {
    const d = s.slice(1)
    const p = [...PAISES].sort((a, b) => b.codigo.length - a.codigo.length).find(x => d.startsWith(x.codigo))
    if (p) return { prefijo: p.codigo, local: d.slice(p.codigo.length) }
  }
  return { prefijo: '58', local: s }
}

function componerTelefono(prefijo: string, local: string): string {
  const l = local.trim()
  if (!l) return ''
  if (prefijo === '58') return l                       // 0414-1234567 tal cual (ya lo entiende todo el flujo)
  return '+' + prefijo + l.replace(/\D/g, '').replace(/^0+/, '')
}

// ── Validaciones ──────────────────────────────────────────────
export function validNombre(n: string) {
  const trimmed = n.trim()
  return /^[A-Za-záéíóúÁÉÍÓÚüÜñÑ\s]{3,}$/.test(trimmed) && trimmed.split(/\s+/).length >= 2
}

export function validTelefono(p: string) {
  const t = p.trim()
  // Venezolano: 0414-1234567 o +58 414...
  if (/^(\+?58\s?)?0?(412|414|416|424|426)[\s-]?\d{3}[\s-]?\d{4}$/.test(t)) return true
  // Internacional: +código de país seguido de 7 a 14 dígitos
  return /^\+\d[\d\s-]{7,16}$/.test(t)
}

export function validEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())
}

// ── Componente ────────────────────────────────────────────────
export default function PasoDatos({ datos, onChange }: Props) {
  const [otpEnviado, setOtpEnviado] = useState(false)
  const [codigoInput, setCodigoInput] = useState('')
  const [enviandoOtp, setEnviandoOtp] = useState(false)
  const [verificandoOtp, setVerificandoOtp] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)
  const waTokenRef = useRef<string | null>(null)
  const inicial = separarTelefono(datos.telefono ?? '')
  const [prefijo, setPrefijo] = useState(inicial.prefijo)
  const [numeroLocal, setNumeroLocal] = useState(inicial.local)

  const cambiarTelefono = (nuevoPrefijo: string, nuevoLocal: string) => {
    setPrefijo(nuevoPrefijo)
    setNumeroLocal(nuevoLocal)
    onChange({ telefono: componerTelefono(nuevoPrefijo, nuevoLocal), telefono_verificado: false, telefono_verificacion: undefined })
    setOtpEnviado(false)
    setCodigoInput('')
    setOtpError(null)
  }

  // Touched para mostrar errores solo tras interacción
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const touch = (field: string) => setTouched(t => ({ ...t, [field]: true }))

  const nombreOk = validNombre(datos.nombre ?? '')
  const telefonoOk = validTelefono(datos.telefono ?? '')
  const emailOk = validEmail(datos.email ?? '')

  // Envía el código por WhatsApp desde el número de la empresa (otp-wa)
  const enviarOtp = async () => {
    setEnviandoOtp(true)
    setOtpError(null)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/otp-wa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ accion: 'enviar', telefono: datos.telefono ?? '' }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok || !d.ok) throw new Error(d.error || 'No se pudo enviar el WhatsApp. Intenta de nuevo.')
      waTokenRef.current = d.token
      setOtpEnviado(true)
      setCodigoInput('')
      track('4_wa_enviado')
    } catch (e) {
      track('4x_error_wa', e instanceof Error ? e.message : String(e))
      setOtpError(e instanceof Error ? e.message : 'Error enviando el WhatsApp. Intenta de nuevo.')
    } finally {
      setEnviandoOtp(false)
    }
  }

  const verificarOtp = async () => {
    setVerificandoOtp(true)
    setOtpError(null)
    try {
      if (!waTokenRef.current) throw new Error('Solicita un código primero')
      const res = await fetch(`${SUPABASE_URL}/functions/v1/otp-wa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ accion: 'verificar', telefono: datos.telefono ?? '', codigo: codigoInput, token: waTokenRef.current }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok || !d.ok) throw new Error(d.error || 'Error verificando el código.')
      track('5_telefono_verificado', 'wa')
      onChange({ telefono_verificado: true, telefono_verificacion: 'wa' })
    } catch (e) {
      track('5x_error_codigo', e instanceof Error ? e.message : String(e))
      setOtpError(e instanceof Error ? e.message : 'Error verificando el código.')
    } finally {
      setVerificandoOtp(false)
    }
  }

  const resetVerificacion = () => {
    setOtpEnviado(false)
    setCodigoInput('')
    setOtpError(null)
    onChange({ telefono_verificado: false, telefono_verificacion: undefined })
  }

  const fieldBorder = (valid: boolean, isTouched: boolean) => {
    if (!isTouched) return 'border-gray-200'
    return valid ? 'border-green-400' : 'border-red-400'
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Tus datos de contacto</h2>
      <p className="text-gray-500 mb-8">
        Para enviarte la cotización detallada y hacer seguimiento a tu proyecto
      </p>

      <div className="space-y-5">
        {/* Nombre + Teléfono */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Nombre */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre completo *</label>
            <input
              type="text"
              placeholder="Nombre y apellido"
              value={datos.nombre ?? ''}
              onChange={(e) => { onChange({ nombre: e.target.value }); resetVerificacion() }}
              onBlur={() => touch('nombre')}
              className={cn('w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors', fieldBorder(nombreOk, !!touched.nombre))}
            />
            {touched.nombre && !nombreOk && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Ingresa nombre y apellido (solo letras)
              </p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp *</label>
            <div className="flex gap-2">
              <select
                value={prefijo}
                onChange={(e) => cambiarTelefono(e.target.value, numeroLocal)}
                disabled={datos.telefono_verificado}
                aria-label="Código de país"
                className="w-28 flex-shrink-0 px-2 py-3 border-2 border-gray-200 rounded-xl bg-white focus:outline-none disabled:bg-green-50 disabled:border-green-400 text-sm"
              >
                {PAISES.map(p => (
                  <option key={p.codigo} value={p.codigo}>{p.bandera} +{p.codigo}</option>
                ))}
              </select>
              <div className="relative flex-1 min-w-0">
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder={prefijo === '58' ? '0414-0000000' : 'Tu número sin el código'}
                  value={numeroLocal}
                  onChange={(e) => cambiarTelefono(prefijo, e.target.value)}
                  onBlur={() => touch('telefono')}
                  disabled={datos.telefono_verificado}
                  className={cn(
                    'w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors',
                    datos.telefono_verificado ? 'border-green-400 bg-green-50 pr-10' : fieldBorder(telefonoOk, !!touched.telefono)
                  )}
                />
                {datos.telefono_verificado && (
                  <CheckCircle className="absolute right-3 top-3.5 w-5 h-5 text-green-500" />
                )}
              </div>
            </div>
            {touched.telefono && !telefonoOk && !datos.telefono_verificado && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {prefijo === '58' ? 'Formato válido: 0414-1234567 (0412, 0414, 0416, 0424, 0426)' : 'Escribe tu número completo sin el código de país (solo dígitos)'}
              </p>
            )}
            {!datos.telefono_verificado && (
              <p className="text-xs text-gray-400 mt-1">
                🌍 Fuera de Venezuela: elige tu país en la lista y escribe tu número sin el código. {prefijo !== '58' && datos.telefono ? <>Se enviará a <strong>{datos.telefono}</strong>.</> : null}
              </p>
            )}

            {/* Botón verificar / código */}
            {!datos.telefono_verificado && telefonoOk && (
              <div className="mt-2">
                {!otpEnviado ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={enviarOtp}
                      disabled={enviandoOtp}
                      className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
                      style={{ backgroundColor: '#25D366' }}
                    >
                      {enviandoOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {enviandoOtp ? 'Enviando...' : '📲 Verificar número por WhatsApp'}
                    </button>
                    <p className="text-xs text-gray-500">
                      Te llegará un WhatsApp de <strong>KersaDesign (+58 424-139-3173)</strong> con un código de 6 dígitos. Es solo para confirmar que este número es tuyo y mostrarte tu cotización.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800">
                      ✅ Te enviamos un WhatsApp desde <strong>KersaDesign (+58 424-139-3173)</strong> con tu código de 6 dígitos. Es el código para verificar tu número y ver tu cotización — no lo compartas con nadie.
                    </div>
                    <p className="text-xs text-gray-600 font-medium">Escribe aquí el código que te llegó:</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="000000"
                        value={codigoInput}
                        onChange={(e) => setCodigoInput(e.target.value.replace(/\D/g, ''))}
                        className="w-32 px-4 py-2 border-2 border-gray-200 rounded-xl text-center text-lg font-bold tracking-widest focus:outline-none"
                        onFocus={e => e.target.style.borderColor = '#134a9c'}
                        onBlur={e => e.target.style.borderColor = 'rgb(229 231 235)'}
                      />
                      <button
                        type="button"
                        onClick={verificarOtp}
                        disabled={codigoInput.length < 6 || verificandoOtp}
                        className="text-sm font-semibold text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                        style={{ backgroundColor: '#134a9c' }}
                      >
                        {verificandoOtp ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Confirmar'}
                      </button>
                    </div>
                    <button type="button" onClick={enviarOtp} disabled={enviandoOtp} className="text-xs text-gray-400 underline">
                      Reenviar código
                    </button>
                  </div>
                )}
              </div>
            )}
            {datos.telefono_verificado && (
              <p className="text-xs text-green-600 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Número verificado
              </p>
            )}
            {otpError && (
              <div className="mt-1 space-y-1">
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {otpError}
                </p>
                <p className="text-xs text-gray-500">
                  Revisa que el número tenga WhatsApp activo y esté bien escrito. Sin el código no podemos generar tu cotización.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Correo electrónico *</label>
          <input
            type="email"
            placeholder="tucorreo@ejemplo.com"
            value={datos.email ?? ''}
            onChange={(e) => onChange({ email: e.target.value })}
            onBlur={() => touch('email')}
            className={cn('w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors', fieldBorder(emailOk, !!touched.email))}
          />
          {touched.email && !emailOk && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Ingresa un correo electrónico válido
            </p>
          )}
        </div>

        <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500">
          🔒 Tus datos están seguros. Solo los usamos para enviarte tu cotización y hacer seguimiento a tu proyecto. No compartimos tu información con terceros.
        </div>
      </div>
    </div>
  )
}
