import { COCINA_FLETE_TIERS } from './pricing'

// Flete de cocina: tarifa plana por grupo de zona (no por km/peso como el de
// piso vinil, ver flete.ts) — mismo tabulador que COCINA_FLETE en la app interna.
export type ResultadoFleteCocina =
  | { tipo: 'monto'; zona: string; sku: string; monto: number; titulo: string }
  | { tipo: 'sin_zona' }

// Los grupos de flete son municipios: se derivan del municipio que el cliente
// ya eligió en la ubicación, sin pedirle la zona otra vez.
const MUNICIPIO_A_ZONA: Record<string, string> = {
  'Libertador': 'Libertador',
  'Chacao': 'Chacao',
  'Sucre': 'Sucre',
  'Baruta': 'Baruta',
  'El Hatillo': 'El Hatillo',
  'Vargas': 'La Guaira',
  'Guaicaipuro': 'Los Teques',
}

export function zonaCocinaDesdeMunicipio(municipio?: string): string | undefined {
  if (!municipio) return undefined
  return MUNICIPIO_A_ZONA[municipio] ?? 'otra'
}

export function calcularFleteCocina(zona: string | undefined): ResultadoFleteCocina {
  if (!zona) return { tipo: 'sin_zona' }
  const tier = COCINA_FLETE_TIERS.find(t => t.zonas.includes(zona))
  if (!tier) return { tipo: 'sin_zona' }
  return { tipo: 'monto', zona, sku: tier.sku, monto: tier.tarifa, titulo: tier.titulo }
}
