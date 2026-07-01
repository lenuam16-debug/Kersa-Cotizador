import { Servicio } from '@/types'

export const SERVICIOS = {
  'vinil-lvt': {
    nombre: 'Piso Vinílico LVT',
    descripcion: 'Vinilo de lujo 2.5mm con instalación incluida',
    unidad: 'm²',
    precioBase: 17,
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

export function calcularCotizacion(
  servicio: Servicio,
  cantidad: number
): { min: number; max: number } | null {
  const s = SERVICIOS[servicio]
  if (!s.precioBase) return null

  const base = s.precioBase * cantidad
  const min = Math.round(base * 0.95)
  const max = Math.round(base * (1 + s.margen))
  return { min, max }
}

export const COLORES_VINIL = [
  { id: 'roble-natural', nombre: 'Roble Natural', hex: '#C8A882' },
  { id: 'roble-gris', nombre: 'Roble Gris', hex: '#9B9B8E' },
  { id: 'roble-oscuro', nombre: 'Roble Oscuro', hex: '#6B4F3A' },
  { id: 'cemento-claro', nombre: 'Cemento Claro', hex: '#C4C4BF' },
  { id: 'cemento-oscuro', nombre: 'Cemento Oscuro', hex: '#7A7A72' },
  { id: 'blanco-polar', nombre: 'Blanco Polar', hex: '#F5F5F0' },
  { id: 'nogal', nombre: 'Nogal', hex: '#8B6914' },
  { id: 'pino', nombre: 'Pino', hex: '#D4A853' },
]

export const COLORES_COCINA = [
  { id: 'blanco-mate', nombre: 'Blanco Mate', hex: '#F8F8F5' },
  { id: 'gris-perla', nombre: 'Gris Perla', hex: '#D0CDC8' },
  { id: 'negro-mate', nombre: 'Negro Mate', hex: '#2C2C2C' },
  { id: 'madera-clara', nombre: 'Madera Clara', hex: '#C8A882' },
  { id: 'verde-sage', nombre: 'Verde Sage', hex: '#8FAF8A' },
]
