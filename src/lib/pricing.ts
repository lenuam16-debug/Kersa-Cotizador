import { Servicio, AcabadoCocina, MaterialTope, ColorLed, AccesoriosCocina } from '@/types'

export const SERVICIOS = {
  'vinil-lvt': {
    nombre: 'Piso Vinil LVT',
    descripcion: 'Vinil de lujo 2.5mm con instalación incluida desde $17/m²',
    unidad: 'm²',
    precioBase: 17,
    margen: 0.1,
    icono: '🪵',
  },
  'vinil-lvt-3mm': {
    nombre: 'Piso Vinil LVT 2.8-3mm',
    descripcion: 'Vinil de lujo 2.8mm y 3mm, uso residencial premium y comercial, con instalación incluida desde $20/m²',
    unidad: 'm²',
    precioBase: 20,
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
    descripcion: 'Diseño, fabricación e instalación a tu medida · mesón y extras se cotizan aparte · entrega en 30 días hábiles',
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
export const COSTO_FOAM_SPC = 3 // $/m² — foam base niveladora, siempre incluido en piso SPC (clic)

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

// Piso Vinil LVT 2.8mm y 3mm — $20/m² instalado
export const COLORES_LVT_3MM: { id: string; nombre: string; espesor: string; hex?: string; imagen?: string }[] = [
  // 2.8mm
  { id: 'amaro',       nombre: 'Amaro',       espesor: '2.8mm', imagen: 'https://kersadesign.com/imagenes/embed_053_e460acf2.jpg' },
  { id: 'castellani',  nombre: 'Castellani',  espesor: '2.8mm', imagen: 'https://kersadesign.com/imagenes/embed_054_a089233a.jpg' },
  { id: 'grappa',      nombre: 'Grappa',      espesor: '2.8mm', imagen: 'https://kersadesign.com/imagenes/embed_055_fc0ba249.jpg' },
  { id: 'new-legend',  nombre: 'New Legend',  espesor: '2.8mm', imagen: 'https://kersadesign.com/imagenes/embed_056_77c788f3.jpg' },
  { id: 'oak',         nombre: 'Oak',         espesor: '2.8mm', imagen: 'https://kersadesign.com/imagenes/embed_057_9ff627ab.jpg' },
  { id: 'ragnar',      nombre: 'Ragnar',      espesor: '2.8mm', imagen: 'https://kersadesign.com/imagenes/embed_058_7d5f331e.jpg' },
  // 3mm
  { id: 'boston',      nombre: 'Boston',      espesor: '3mm', imagen: 'https://kersadesign.com/imagenes/embed_059_9dd044f6.jpg' },
  { id: 'california',  nombre: 'California',  espesor: '3mm', imagen: 'https://kersadesign.com/imagenes/embed_060_f488a0a8.jpg' },
  { id: 'dallara',     nombre: 'Dallara',     espesor: '3mm', imagen: 'https://kersadesign.com/imagenes/embed_061_199eee46.jpg' },
  { id: 'eofor',       nombre: 'Eofor',       espesor: '3mm', imagen: 'https://kersadesign.com/imagenes/embed_062_dd8fa181.jpg' },
  { id: 'hamlet',      nombre: 'Hamlet',      espesor: '3mm', imagen: 'https://kersadesign.com/imagenes/embed_063_d54c2582.jpg' },
  { id: 'new-stone',   nombre: 'New Stone',   espesor: '3mm', imagen: 'https://kersadesign.com/imagenes/embed_064_7e25e3bb.jpg' },
  { id: 'new-york',    nombre: 'New York',    espesor: '3mm', imagen: 'https://kersadesign.com/imagenes/embed_065_1b65a0a1.jpg' },
  { id: 'nordic-grey', nombre: 'Nordic Grey', espesor: '3mm', imagen: 'https://kersadesign.com/imagenes/embed_066_c464affd.jpg' },
  { id: 'overbrook',   nombre: 'Overbrook',   espesor: '3mm', imagen: 'https://kersadesign.com/imagenes/embed_067_f6a81e9d.jpg' },
  { id: 'pure-stone',  nombre: 'Pure Stone',  espesor: '3mm', imagen: 'https://kersadesign.com/imagenes/embed_068_a33b2998.jpg' },
  { id: 'rimini',      nombre: 'Rimini',      espesor: '3mm', imagen: 'https://kersadesign.com/imagenes/embed_069_b620acb0.jpg' },
  { id: 'roller-park', nombre: 'Roller Park', espesor: '3mm', imagen: 'https://kersadesign.com/imagenes/embed_070_36284680.jpg' },
  { id: 'stone-brown', nombre: 'Stone Brown', espesor: '3mm', imagen: 'https://kersadesign.com/imagenes/embed_071_121856e3.jpg' },
  { id: 'stone-dark',  nombre: 'Stone Dark',  espesor: '3mm', imagen: 'https://kersadesign.com/imagenes/embed_072_bf78c24c.jpg' },
  { id: 'stone-grey',  nombre: 'Stone Grey',  espesor: '3mm', imagen: 'https://kersadesign.com/imagenes/embed_073_0161abe6.jpg' },
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

// Cocina modular — catálogo real (mismos SKU y precios que la app interna,
// kersa-nube-flask/cotizador.html: COCINA_MODULOS, TOPES, COCINA_ACC, COCINA_LUZ,
// COCINA_FLETE). El precio del acabado ya incluye fabricación e instalación.
export const ACABADOS_COCINA: { id: AcabadoCocina; nombre: string; descripcion: string; nota?: string; hex: string; precio: number; sku: string }[] = [
  { id: 'blanco-mate',    nombre: 'Blanco Mate',       descripcion: 'Muebles blancos sin brillo. La opción más económica.', hex: '#F7F7F4', precio: 400, sku: 'SRV-COCINA-BLANCO' },
  { id: 'formica-color',  nombre: 'Color Fórmica',     descripcion: 'Lámina de fórmica de color.', nota: 'Colores seleccionados en tienda', hex: '#C9A66B', precio: 500, sku: 'SRV-COCINA-FORMICA' },
  { id: 'melamina-color', nombre: 'Melamina de Color', descripcion: 'Tablero de melamina en color o tono madera.', hex: '#5B6B73', precio: 600, sku: 'SRV-COCINA-MELAMINA' },
]

// Tope (mesón) y salpicadero cobran al mismo precio del material elegido; el
// salpicadero lleva SKU con prefijo SALP-, igual que en la app interna.
export const TOPES_COCINA: {
  id: MaterialTope
  nombre: string
  precio: number
  sku: string
  colores: { id: string; nombre: string }[]
}[] = [
  {
    id: 'cuarzo', nombre: 'Cuarzo', precio: 150, sku: 'SRV-TOPE-CUARZO',
    colores: [
      { id: 'blanco-estelar', nombre: 'Blanco Estelar' },
      { id: 'negro-estelar',  nombre: 'Negro Estelar' },
      { id: 'gris-estelar',   nombre: 'Gris Estelar' },
    ],
  },
  {
    id: 'piedra-esp', nombre: 'Piedra Sinterizada Española', precio: 300, sku: 'SRV-TOPE-ESP',
    colores: [
      { id: 'laminam', nombre: 'Laminam' },
      { id: 'ascale',  nombre: 'Ascale' },
      { id: 'techlam', nombre: 'Techlam' },
      { id: 'lapitec', nombre: 'Lapitec' },
      { id: 'compac',  nombre: 'Compac' },
    ],
  },
  {
    id: 'piedra-china', nombre: 'Piedra Sinterizada Lamitec', precio: 200, sku: 'SRV-TOPE-CHINA',
    colores: [
      { id: 'blanco', nombre: 'Blanco' },
      { id: 'negro',  nombre: 'Negro' },
    ],
  },
]

export const TOPE_INCLUYE = 'Incluye piedra, fabricación e instalación'

export const LED_COCINA: { id: ColorLed; nombre: string; precio: number; sku: string }[] = [
  { id: 'blanca',   nombre: 'Blanca',   precio: 50, sku: 'SRV-COCINA-LUZ-BLANCA' },
  { id: 'amarilla', nombre: 'Amarilla', precio: 50, sku: 'SRV-COCINA-LUZ-AMARILLA' },
]

export const ACCESORIOS_COCINA: { id: keyof AccesoriosCocina; nombre: string; descripcion: string; precio: number; sku: string }[] = [
  { id: 'condimentero', nombre: 'Condimentero', descripcion: 'Gaveta angosta que se desliza, para especias y botellas', precio: 200, sku: 'SRV-COCINA-CONDIMENTERO' },
  { id: 'platera',      nombre: 'Platera',      descripcion: 'Organizador para escurrir y guardar platos dentro del mueble', precio: 120, sku: 'SRV-COCINA-PLATERA' },
  { id: 'cubiertero',   nombre: 'Cubiertero',   descripcion: 'Bandeja con divisiones para cubiertos dentro de la gaveta', precio: 80,  sku: 'SRV-COCINA-CUBIERTERO' },
]

// Flete plano por grupo de zona (no es por km/peso como el de piso vinil).
export const COCINA_FLETE_TIERS: { zonas: string[]; tarifa: number; sku: string; titulo: string }[] = [
  { zonas: ['Libertador', 'Chacao', 'Sucre', 'Baruta'], tarifa: 200, sku: 'SRV-COCINA-FLETE-1', titulo: 'Libertador / Chacao / Sucre / Baruta' },
  { zonas: ['El Hatillo', 'La Guaira', 'Los Teques'],   tarifa: 350, sku: 'SRV-COCINA-FLETE-2', titulo: 'El Hatillo / La Guaira / Los Teques' },
]

export interface ItemCocina {
  sku: string
  nombre: string      // mismo texto que usa la app interna: viaja al historial y a WhatsApp
  detalle?: string    // línea corta para el cliente (no se sincroniza)
  grupo: 'mueble' | 'tope' | 'extra'
  unidad: 'metro lineal' | 'ud'
  cantidad: number
  precioUnit: number
  subtotal: number
}

export interface EntradaCocina {
  acabado?: AcabadoCocina
  mlMueble?: number
  tope?: { material: MaterialTope; color?: string; ml: number }
  salpicadero?: { ml: number }
  led?: { color: ColorLed; ml: number }
  accesorios?: Partial<AccesoriosCocina>
}

const positivo = (n?: number) => (typeof n === 'number' && !isNaN(n) && n > 0 ? n : undefined)

// Valores efectivos con los mismos defaults que el panel "ARMAR COCINA" de la
// app interna (cocPanelDef): tope activado con el mismo ML del mueble y Cuarzo
// (primera opción) si el cliente no eligió otro; salpicadero hereda el ML del
// tope; el color del tope es opcional porque no cambia el precio.
export function mlEfectivosCocina(d: { metros_lineales?: number; tope_ml?: number; salpicadero_ml?: number; led_ml?: number }) {
  const mueble = positivo(d.metros_lineales)
  const tope = positivo(d.tope_ml) ?? mueble
  const salpicadero = positivo(d.salpicadero_ml) ?? tope
  const led = positivo(d.led_ml)
  return { mueble, tope, salpicadero, led }
}

export function entradaCocinaDesdeForm(d: {
  acabado_cocina?: AcabadoCocina; metros_lineales?: number
  tope_incluido?: boolean; tope_material?: MaterialTope; tope_color?: string; tope_ml?: number
  salpicadero_incluido?: boolean; salpicadero_ml?: number
  led_incluido?: boolean; led_color?: ColorLed; led_ml?: number
  accesorios_cocina?: Partial<AccesoriosCocina>
}): EntradaCocina {
  const ml = mlEfectivosCocina(d)
  const topeIncluido = d.tope_incluido !== false
  return {
    acabado: d.acabado_cocina,
    mlMueble: ml.mueble,
    tope: topeIncluido && ml.tope ? { material: d.tope_material ?? 'cuarzo', color: d.tope_color, ml: ml.tope } : undefined,
    salpicadero: topeIncluido && d.salpicadero_incluido && ml.salpicadero ? { ml: ml.salpicadero } : undefined,
    led: d.led_incluido && ml.led ? { color: d.led_color ?? 'blanca', ml: ml.led } : undefined,
    accesorios: d.accesorios_cocina,
  }
}

/** Suma lineal simple de todos los ítems elegidos: sin mínimo/máximo, sin
 * acondicionamiento/perfil/rodapié (eso es solo de piso vinil). El flete se
 * calcula aparte con calcularFleteCocina(). Los `nombre` copian los títulos de
 * la app interna (COCINA_MODULOS, TOPES, COCINA_LUZ, COCINA_ACC). */
export function calcularCotizacionCocina(e: EntradaCocina): { items: ItemCocina[]; total: number } | null {
  if (!e.acabado || !e.mlMueble || e.mlMueble <= 0) return null
  const items: ItemCocina[] = []

  const acab = ACABADOS_COCINA.find(a => a.id === e.acabado)!
  items.push({
    sku: acab.sku, nombre: `Cocina modular ${acab.nombre}${acab.nota ? ` (${acab.nota.toLowerCase()})` : ''}`,
    detalle: 'Fabricación e instalación incluidas', grupo: 'mueble',
    unidad: 'metro lineal', cantidad: e.mlMueble, precioUnit: acab.precio, subtotal: acab.precio * e.mlMueble,
  })

  if (e.tope && e.tope.ml > 0) {
    const t = TOPES_COCINA.find(t => t.id === e.tope!.material)!
    const colorNombre = t.colores.find(c => c.id === e.tope!.color)?.nombre
    items.push({
      sku: t.sku, nombre: `Tope de ${t.nombre}${colorNombre ? ` — ${colorNombre}` : ''}`,
      detalle: TOPE_INCLUYE, grupo: 'tope',
      unidad: 'metro lineal', cantidad: e.tope.ml, precioUnit: t.precio, subtotal: t.precio * e.tope.ml,
    })

    if (e.salpicadero && e.salpicadero.ml > 0) {
      items.push({
        sku: `SALP-${t.sku}`, nombre: `Salpicadero en ${t.nombre}${colorNombre ? ` ${colorNombre}` : ''}`,
        detalle: TOPE_INCLUYE, grupo: 'extra',
        unidad: 'metro lineal', cantidad: e.salpicadero.ml, precioUnit: t.precio, subtotal: t.precio * e.salpicadero.ml,
      })
    }
  }

  if (e.led && e.led.ml > 0) {
    const l = LED_COCINA.find(l => l.id === e.led!.color)!
    items.push({
      sku: l.sku, nombre: `Luz LED ${l.nombre}`, detalle: 'Instalada', grupo: 'extra',
      unidad: 'metro lineal', cantidad: e.led.ml, precioUnit: l.precio, subtotal: l.precio * e.led.ml,
    })
  }

  for (const acc of ACCESORIOS_COCINA) {
    const cant = e.accesorios?.[acc.id] ?? 0
    if (cant > 0) {
      items.push({ sku: acc.sku, nombre: `${acc.nombre} para cocina`, detalle: acc.descripcion, grupo: 'extra', unidad: 'ud', cantidad: cant, precioUnit: acc.precio, subtotal: acc.precio * cant })
    }
  }

  const total = Math.round(items.reduce((s, i) => s + i.subtotal, 0) * 100) / 100
  return { items, total }
}
