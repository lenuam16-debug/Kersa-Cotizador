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
    descripcion: 'Vinil SPC rígido sistema clic 5mm y 6mm con instalación incluida desde $26/m²',
    unidad: 'm²',
    precioBase: 26,
    margen: 0,
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
    nombre: 'Cocina Modular',
    descripcion: 'Diseño, fabricación e instalación desde $400/ML · entrega en 30 días hábiles',
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

// Piso Vinil SPC — promo $26/m² instalado (5mm + 6mm, sin Decoroyal)
export const COLORES_SPC: { id: string; nombre: string; espesor: string; hex?: string; imagen?: string }[] = [
  // 5mm
  { id: 'savannah-antique', nombre: 'Savannah Antique', espesor: '5mm', imagen: '/materiales/spc-5mm/savannah-antique.jpg' },
  { id: 'douglas-brown',    nombre: 'Douglas Brown',    espesor: '5mm', imagen: '/materiales/spc-5mm/douglas-brown.jpg' },
  { id: 'lawson-natural',   nombre: 'Lawson Natural',   espesor: '5mm', imagen: '/materiales/spc-5mm/lawson-natural.jpg' },
  { id: 'lawson-nogal',     nombre: 'Lawson Nogal',     espesor: '5mm', imagen: '/materiales/spc-5mm/lawson-nogal.jpg' },
  { id: 'lawson-ash',       nombre: 'Lawson Ash',       espesor: '5mm', imagen: '/materiales/spc-5mm/lawson-ash.jpg' },
  { id: 'savannah-natural', nombre: 'Savannah Natural', espesor: '5mm', imagen: '/materiales/spc-5mm/savannah-natural.jpg' },
  { id: 'savannah-nogal',   nombre: 'Savannah Nogal',   espesor: '5mm', imagen: '/materiales/spc-5mm/savannah-nogal.jpg' },
  { id: 'savannah-ash',     nombre: 'Savannah Ash',     espesor: '5mm', imagen: '/materiales/spc-5mm/savannah-ash.jpg' },
  { id: 'austral-oak',      nombre: 'Austral Oak',      espesor: '5mm', imagen: '/materiales/spc-5mm/austral-oak.jpg' },
  { id: 'austral-eucalyptus', nombre: 'Austral Eucalyptus', espesor: '5mm', imagen: '/materiales/spc-5mm/austral-eucalyptus.jpg' },
  // 6mm
  { id: 'baldur',     nombre: 'Baldur',     espesor: '6mm', imagen: '/materiales/spc-6mm/baldur.jpg' },
  { id: 'cedro',      nombre: 'Cedro',      espesor: '6mm', imagen: '/materiales/spc-6mm/cedro.jpg' },
  { id: 'ceniza',     nombre: 'Ceniza',     espesor: '6mm', imagen: '/materiales/spc-6mm/ceniza.jpg' },
  { id: 'miel',       nombre: 'Miel',       espesor: '6mm', imagen: '/materiales/spc-6mm/miel.jpg' },
  { id: 'drakar',     nombre: 'Drakar',     espesor: '6mm', imagen: '/materiales/spc-6mm/drakar.jpg' },
  { id: 'eirik',      nombre: 'Eirik',      espesor: '6mm', imagen: '/materiales/spc-6mm/eirik.jpg' },
  { id: 'gull',       nombre: 'Gull',       espesor: '6mm', imagen: '/materiales/spc-6mm/gull.jpg' },
  { id: 'haya',       nombre: 'Haya',       espesor: '6mm', imagen: '/materiales/spc-6mm/haya.jpg' },
  { id: 'marfil',     nombre: 'Marfil',     espesor: '6mm', imagen: '/materiales/spc-6mm/marfil.jpg' },
  { id: 'creta',      nombre: 'Creta',      espesor: '6mm', imagen: '/materiales/spc-6mm/creta.jpg' },
  { id: 'ikaria',     nombre: 'Ikaria',     espesor: '6mm', imagen: '/materiales/spc-6mm/ikaria.jpg' },
  { id: 'naxos',      nombre: 'Naxos',      espesor: '6mm', imagen: '/materiales/spc-6mm/naxos.jpg' },
  { id: 'santorini',  nombre: 'Santorini',  espesor: '6mm', imagen: '/materiales/spc-6mm/santorini.jpg' },
]

// Piso Vinil SPC 6.5mm — precio aparte, solo catálogo web, NO integrado al cotizador
export const COLORES_SPC_65MM: { id: string; nombre: string; imagen?: string }[] = [
  { id: 'alto-adicse',        nombre: 'Alto Adicse',        imagen: '/materiales/spc-6-5mm/alto-adicse.jpg' },
  { id: 'grand-river-65',     nombre: 'Grand River',        imagen: '/materiales/spc-6-5mm/grand-river.jpg' },
  { id: 'positano-65',        nombre: 'Positano',           imagen: '/materiales/spc-6-5mm/positano.jpg' },
  { id: 'traviso',            nombre: 'Traviso',            imagen: '/materiales/spc-6-5mm/traviso.jpg' },
  { id: 'decoroyal-alaska',   nombre: 'Decoroyal Alaska',   imagen: '/materiales/spc-6-5mm/decoroyal-alaska.jpg' },
  { id: 'decoroyal-arizona',  nombre: 'Decoroyal Arizona',  imagen: '/materiales/spc-6-5mm/decoroyal-arizona.jpg' },
  { id: 'decoroyal-laredo',   nombre: 'Decoroyal Laredo',   imagen: '/materiales/spc-6-5mm/decoroyal-laredo.jpg' },
  { id: 'decoroyal-michigan', nombre: 'Decoroyal Michigan', imagen: '/materiales/spc-6-5mm/decoroyal-michigan.jpg' },
  { id: 'decoroyal-denver',   nombre: 'Decoroyal Denver',   imagen: '/materiales/spc-6-5mm/decoroyal-denver.jpg' },
]

export const COLORES_COCINA: { id: string; nombre: string; hex?: string; imagen?: string }[] = [
  { id: 'blanco-mate', nombre: 'Blanco Mate', hex: '#F8F8F5' },
  { id: 'gris-perla', nombre: 'Gris Perla', hex: '#D0CDC8' },
  { id: 'negro-mate', nombre: 'Negro Mate', hex: '#2C2C2C' },
  { id: 'madera-clara', nombre: 'Madera Clara', hex: '#C8A882' },
  { id: 'verde-sage', nombre: 'Verde Sage', hex: '#8FAF8A' },
]
