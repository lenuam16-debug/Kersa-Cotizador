export type Servicio = 'vinil-lvt' | 'vinil-spc' | 'laminas-pvc' | 'wallpanel' | 'cocina-modular'

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

export interface PasoForm {
  servicio?: Servicio
  metros_cuadrados?: number
  metros_lineales?: number
  color_seleccionado?: string
  detalles_adicionales?: string
  nombre?: string   // campo del form (se mapea a name en BD)
  telefono?: string
  email?: string
  ciudad?: string
  fecha_proyecto?: string
}
