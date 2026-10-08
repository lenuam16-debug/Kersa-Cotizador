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
            <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono / WhatsApp *</label>
            <div className="relative">
              <input
                type="tel"
                placeholder="0414-0000000"
                value={datos.telefono ?? ''}
                onChange={(e) => {
                  onChange({ telefono: e.target.value, telefono_verificado: false, telefono_verificacion: undefined })
                  setOtpEnviado(false)
                  setCodigoInput('')
                  setOtpError(null)
                }}
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
            {touched.telefono && !telefonoOk && !datos.telefono_verificado && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Formato válido: 0414-1234567 (0412, 0414, 0416, 0424, 0426)
              </p>
            )}
            {!datos.telefono_verificado && (
              <p className="text-xs text-gray-400 mt-1">
                🌍 ¿Estás fuera de Venezuela? Escribe tu número de WhatsApp con el código de tu país, ej: +34 612 345 678 (España), +56 9 1234 5678 (Chile), +1 305 123 4567 (USA)
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
