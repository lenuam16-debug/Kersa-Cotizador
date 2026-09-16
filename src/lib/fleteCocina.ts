import { COCINA_FLETE_TIERS } from './pricing'

// Flete de cocina: tarifa plana por grupo de zona (no por km/peso como el de
// piso vinil, ver flete.ts) — mismo tabulador que COCINA_FLETE en la app interna.
export type ResultadoFleteCocina =
  | { tipo: 'monto'; zona: string; sku: string; monto: number }
  | { tipo: 'sin_zona' }

export function calcularFleteCocina(zona: string | undefined): ResultadoFleteCocina {
  if (!zona) return { tipo: 'sin_zona' }
  const tier = COCINA_FLETE_TIERS.find(t => t.zonas.includes(zona))
  if (!tier) return { tipo: 'sin_zona' }
  return { tipo: 'monto', zona, sku: tier.sku, monto: tier.tarifa }
}
