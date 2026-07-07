'use client'

import { useState } from 'react'
import { PasoForm } from '@/types'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  datos: PasoForm
  onChange: (d: Partial<PasoForm>) => void
}

const CIUDADES_MUNICIPIOS: Record<string, string[]> = {
  'Caracas (Distrito Capital)': ['Libertador'],
  'Miranda': [
    'Baruta', 'Chacao', 'El Hatillo', 'Sucre', 'Zamora',
    'Guaicaipuro', 'Acevedo', 'Brión', 'Buroz', 'Cristóbal Rojas',
    'Independencia', 'Lander', 'Los Salias', 'Páez', 'Paz Castillo',
    'Pedro Gual', 'Urdaneta',
  ],
  'La Guaira (Vargas)': ['Vargas'],
}

const CIUDADES = Object.keys(CIUDADES_MUNICIPIOS)

// ── Validaciones ──────────────────────────────────────────────
export function validNombre(n: string) {
  const trimmed = n.trim()
  return /^[A-Za-záéíóúÁÉÍÓÚüÜñÑ\s]{3,}$/.test(trimmed) && trimmed.split(/\s+/).length >= 2
}

export function validTelefono(p: string) {
  return /^(\+?58\s?)?0?(412|414|416|424|426)[\s-]?\d{3}[\s-]?\d{4}$/.test(p.trim())
}

export function validEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())
}

// ── Componente ────────────────────────────────────────────────
export default function PasoDatos({ datos, onChange }: Props) {
  const municipios = datos.ciudad ? CIUDADES_MUNICIPIOS[datos.ciudad] ?? [] : []

  // OTP state
  const [otpEnviado, setOtpEnviado] = useState(false)
  const [codigoInput, setCodigoInput] = useState('')
  const [enviandoOtp, setEnviandoOtp] = useState(false)
  const [verificandoOtp, setVerificandoOtp] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)

  // Touched para mostrar errores solo tras interacción
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const touch = (field: string) => setTouched(t => ({ ...t, [field]: true }))

  const nombreOk = validNombre(datos.nombre ?? '')
  const telefonoOk = validTelefono(datos.telefono ?? '')
  const emailOk = validEmail(datos.email ?? '')

  const enviarOtp = async () => {
    setEnviandoOtp(true)
    setOtpError(null)
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: datos.telefono }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error enviando código')
      setOtpEnviado(true)
    } catch (e) {
      setOtpError(e instanceof Error ? e.message : 'Error enviando código')
    } finally {
      setEnviandoOtp(false)
    }
  }

  const verificarOtp = async () => {
    setVerificandoOtp(true)
    setOtpError(null)
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: datos.telefono, code: codigoInput }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Código incorrecto')
      onChange({ telefono_verificado: true })
    } catch (e) {
      setOtpError(e instanceof Error ? e.message : 'Error verificando código')
    } finally {
      setVerificandoOtp(false)
    }
  }

  const resetVerificacion = () => {
    setOtpEnviado(false)
    setCodigoInput('')
    setOtpError(null)
    onChange({ telefono_verificado: false })
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
                  onChange({ telefono: e.target.value, telefono_verificado: false })
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

            {/* Botón verificar / OTP */}
            {!datos.telefono_verificado && telefonoOk && (
              <div className="mt-2">
                {!otpEnviado ? (
                  <button
                    type="button"
                    onClick={enviarOtp}
                    disabled={enviandoOtp}
                    className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
                    style={{ backgroundColor: '#134a9c' }}
                  >
                    {enviandoOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {enviandoOtp ? 'Enviando...' : 'Verificar número por WhatsApp'}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600 font-medium">
                      Ingresa el código de 6 dígitos enviado a tu WhatsApp
                    </p>
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
                    <button type="button" onClick={() => enviarOtp()} className="text-xs text-gray-400 underline">
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
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {otpError}
              </p>
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

        {/* Ciudad + Municipio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Estado *</label>
            <select
              value={datos.ciudad ?? ''}
              onChange={(e) => { onChange({ ciudad: e.target.value, municipio: '' }); touch('ciudad') }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none bg-white"
            >
              <option value="">Selecciona tu estado / ciudad</option>
              {CIUDADES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Municipio *</label>
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

        <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500">
          🔒 Tus datos están seguros. Solo los usamos para enviarte tu cotización y hacer seguimiento a tu proyecto. No compartimos tu información con terceros.
        </div>
      </div>
    </div>
  )
}
