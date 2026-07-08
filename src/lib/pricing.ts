import { Servicio } from '@/types'

export const SERVICIOS = {
  'vinil-lvt': {
    nombre: 'Piso Vinil LVT',
    descripcion: 'Vinil de lujo 2.5mm con instalación incluida desde $17/m²',
    unidad: 'm²',
    precioBase: 17,
    margen: 0.1,
    icono: '🪵',
  },
  'vinil-spc': {
    nombre: 'Piso Vinil SPC',
    descripcion: 'Vinil SPC 5mm con instalación incluida desde $25/m²',
    unidad: 'm²',
    precioBase: 25,
    margen: 0.1,
    icono: '🪵',
  },
  'laminas-pvc': {
    nombre: 'Láminas PVC',
    descripcion: 'Instalación de láminas PVC para paredes y cielos',
    unidad: 'm²',
    precioBase: null,
    margen: 0,
    icono: '📋',
  },
  'wallpanel': {
    nombre: 'Wallpanel',
    descripcion: 'Paneles decorativos para paredes interiores',
    unidad: 'm²',
    precioBase: null,
    margen: 0,
    icono: '🔲',
  },
  'cocina-modular': {
    nombre: 'Cocina Modular Básica',
    descripcion: 'Encajonamiento de nevera incluido desde $400/ML',
    unidad: 'ML',
    precioBase: 400,
    margen: 0.15,
    icono: '🍳',
  },
} satisfies Record<Servicio, {
  nombre: string
  descripcion: string
  unidad: string
  precioBase: number | null
  margen: number
  icono: string
}>

export const COSTO_ACONDICIONAMIENTO = 3 // $/m² estimado base

export function calcularCotizacion(
  servicio: Servicio,
  cantidad: number,
  requiereAcondicionamiento = false
): { min: number; max: number; acondicionamiento: number } | null {
  const s = SERVICIOS[servicio]
  if (!s.precioBase) return null

  const base = s.precioBase * cantidad
  const min = Math.round(base * 0.95)
  const max = Math.round(base * (1 + s.margen))
  const acondicionamiento = requiereAcondicionamiento ? COSTO_ACONDICIONAMIENTO * cantidad : 0

  return { min: min + acondicionamiento, max: max + acondicionamiento, acondicionamiento }
}

export const COLORES_VINIL: { id: string; nombre: string; hex?: string; imagen?: string }[] = [
  // 1.8mm — $17/m²
  { id: 'lucca',       nombre: 'Lucca',       imagen: 'https://kersadesign.com/imagenes/embed_038_91a45af7.jpg' },
  { id: 'padova',      nombre: 'Padova',      imagen: 'https://kersadesign.com/imagenes/embed_039_d742d92e.jpg' },
  { id: 'palermo',     nombre: 'Palermo',     imagen: 'https://kersadesign.com/imagenes/embed_040_dab566dc.jpg' },
  { id: 'positano',    nombre: 'Positano',    imagen: 'https://kersadesign.com/imagenes/embed_041_c6beea5c.jpg' },
  { id: 'siena',       nombre: 'Siena',       imagen: 'https://kersadesign.com/imagenes/embed_042_cc307bdc.jpg' },
  // 2.5mm — $17/m²
  { id: 'alaska',      nombre: 'Alaska',      imagen: 'https://kersadesign.com/imagenes/embed_043_91fea8f0.jpg' },
  { id: 'alto-adicse', nombre: 'Alto Adicse', imagen: 'https://kersadesign.com/imagenes/embed_044_bf202a33.jpg' },
  { id: 'arizona',     nombre: 'Arizona',     imagen: 'https://kersadesign.com/imagenes/embed_045_196220e7.jpg' },
  { id: 'dakota',      nombre: 'Dakota',      imagen: 'https://kersadesign.com/imagenes/embed_046_684025f4.jpg' },
  { id: 'denver',      nombre: 'Denver',      imagen: 'https://kersadesign.com/imagenes/embed_047_1a57f0d6.jpg' },
  { id: 'grand-river', nombre: 'Grand River', imagen: 'https://kersadesign.com/imagenes/embed_048_981e026a.jpg' },
  { id: 'kingston',    nombre: 'Kingston',    imagen: 'https://kersadesign.com/imagenes/embed_049_6dac553a.jpg' },
  { id: 'manitova',    nombre: 'Manitova',    imagen: 'https://kersadesign.com/imagenes/embed_050_5d8dfb39.jpg' },
  { id: 'terry-fox',   nombre: 'Terry Fox',   imagen: 'https://kersadesign.com/imagenes/embed_051_ff504fe1.jpg' },
  { id: 'vicent-bay',  nombre: 'Vicent Bay',  imagen: 'https://kersadesign.com/imagenes/embed_052_3b529724.jpg' },
  { id: 'laredo',      nombre: 'Laredo',      imagen: 'https://kersadesign.com/imagenes/embed_084_dd57a1d6.jpg' },
  { id: 'michigan',    nombre: 'Michigan',    imagen: 'https://kersadesign.com/imagenes/embed_085_42f54301.jpg' },
  { id: 'montana',     nombre: 'Montana',     imagen: 'https://kersadesign.com/imagenes/embed_086_b0daebd0.jpg' },
  { id: 'oregon',      nombre: 'Oregon',      imagen: 'https://kersadesign.com/imagenes/embed_087_2d17083d.jpg' },
  { id: 'pasadena',    nombre: 'Pasadena',    imagen: 'https://kersadesign.com/imagenes/embed_088_dc85ef9a.jpg' },
  { id: 'vermont',     nombre: 'Vermont',     imagen: 'https://kersadesign.com/imagenes/embed_089_653c8c30.jpg' },
]

export const COLORES_COCINA: { id: string; nombre: string; hex?: string; imagen?: string }[] = [
  { id: 'blanco-mate', nombre: 'Blanco Mate', hex: '#F8F8F5' },
  { id: 'gris-perla', nombre: 'Gris Perla', hex: '#D0CDC8' },
  { id: 'negro-mate', nombre: 'Negro Mate', hex: '#2C2C2C' },
  { id: 'madera-clara', nombre: 'Madera Clara', hex: '#C8A882' },
  { id: 'verde-sage', nombre: 'Verde Sage', hex: '#8FAF8A' },
]
