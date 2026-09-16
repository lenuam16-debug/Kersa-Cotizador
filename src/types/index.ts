export type Servicio = 'vinil-lvt' | 'vinil-lvt-3mm' | 'vinil-spc' | 'laminas-pvc' | 'wallpanel' | 'cocina-modular'

export type EstadoSeguimiento = 'nuevo' | 'contactado' | 'en-negociacion' | 'cerrado-ganado' | 'cerrado-perdido'

export interface Lead {
  id?: string
  name: string        // columna del CRM
  email?: string
  telefono?: string
  ciudad?: string
  fecha_proyecto?: string
  stage?: string
  platform?: string
  created_at?: string
}

export interface Cotizacion {
  id?: string
  lead_id?: string
  numero_app?: string
  servicio: Servicio
  metros_cuadrados?: number
  metros_lineales?: number
  color_seleccionado?: string
  detalles_adicionales?: string
  precio_min: number
  precio_max: number
  estado: EstadoSeguimiento
  notas_admin?: string
  created_at?: string
  lead?: Lead
  config_cocina?: Record<string, unknown> | null
}

export interface Render {
  id?: string
  cotizacion_id?: string
  imagen_original_url: string
  imagen_render_url?: string
  servicio: Servicio
  color_seleccionado?: string
  estado: 'procesando' | 'completado' | 'error'
  created_at?: string
}

export type TipoPiso =
  | 'ceramica'
  | 'porcelanato'
  | 'losa-rustica'
  | 'cemento'
  | 'granito'
  | 'microcemento'
  | 'otro'

export const PISOS_SIN_ACONDICIONAMIENTO: TipoPiso[] = ['granito', 'microcemento']

export type AcabadoCocina = 'blanco-mate' | 'formica-color' | 'melamina-color'
export type MaterialTope = 'cuarzo' | 'piedra-esp' | 'piedra-china'
export type ColorLed = 'blanca' | 'amarilla'

export interface AccesoriosCocina {
  condimentero: number
  platera: number
  cubiertero: number
}

export interface PasoForm {
  servicio?: Servicio
  metros_cuadrados?: number
  metros_lineales?: number
  color_seleccionado?: string
  tipo_piso_actual?: TipoPiso
  detalles_adicionales?: string
  nombre?: string   // campo del form (se mapea a name en BD)
  telefono?: string
  email?: string
  ciudad?: string
  municipio?: string
  zona_entrega?: string   // nombre de ZONAS_FLETE (piso) o de COCINA_FLETE_TIERS (cocina), o 'otra'
  fecha_proyecto?: string
  incluir_rodapie?: boolean
  ml_rodapie?: number
  telefono_verificado?: boolean
  // Cocina modular
  acabado_cocina?: AcabadoCocina
  tope_incluido?: boolean   // default true (undefined = incluido)
  tope_material?: MaterialTope
  tope_color?: string
  tope_ml?: number
  salpicadero_incluido?: boolean   // default false
  salpicadero_ml?: number
  led_incluido?: boolean   // default false
  led_color?: ColorLed
  led_ml?: number
  accesorios_cocina?: AccesoriosCocina
}
