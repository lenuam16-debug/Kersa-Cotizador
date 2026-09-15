// Tabulador de fletes — copia exacta del de la app interna
// (kersa-nube-flask/cotizador.html, bloque "FLETE: tabulador de zonas").
// Si allá cambian tarifas o zonas, hay que cambiarlas aquí también: esta copia
// existe para que el cliente web y el vendedor den el mismo flete.

export const FLETE_TARIFA = {
  baseCorto: 16, porKmCorto: 3.2,                            // hasta 15 km (−20%)
  baseLargo: 20, porKmLargo: 4, kmCorte: 15, porKmExtra: 2.2, // más de 15 km
  porKg: 0.03, maxKg: 1100,                                   // pickup
}

function costoRecorrido(km: number): number {
  const t = FLETE_TARIFA
  if (km <= t.kmCorte) return t.baseCorto + km * t.porKmCorto
  return t.baseLargo + t.kmCorte * t.porKmLargo + (km - t.kmCorte) * t.porKmExtra
}

/** Zonas de entrega con su distancia en km desde La Campiña. */
export const ZONAS_FLETE: [string, number][] = [
  ['La Campiña / Sabana Grande', 2],
  ['Chacao / Bello Monte', 3],
  ['La Castellana / El Rosal', 4],
  ['Altamira / Los Palos Grandes', 5],
  ['Las Mercedes / Chuao', 6],
  ['El Paraíso / San Bernardino', 7],
  ['Catia / Propatria', 9],
  ['La California / El Marqués', 9],
  ['Petare / La Urbina', 10],
  ['El Valle / Coche', 10],
  ['Baruta / Santa Fe', 10],
  ['La Trinidad / Los Naranjos', 13],
  ['El Hatillo', 16],
  ['San Antonio de los Altos', 22],
  ['Guarenas', 27],
  ['Los Teques', 30],
  ['Guatire', 33],
  ['La Guaira / Catia La Mar', 32],
]

// Pesos del catálogo de la app: "Piso vinílico" 6 kg/m²; el rodapié no tiene
// peso cargado y la app usa su promedio por metro lineal (PESO_PROM_U).
export const KG_M2_VINIL = 6
export const KG_ML_RODAPIE = 1

export type ResultadoFlete =
  | { tipo: 'monto'; zona: string; km: number; kg: number; monto: number }
  | { tipo: 'camion'; zona: string; km: number; kg: number }  // supera la pickup
  | { tipo: 'sin_zona' }                                     // zona fuera del tabulador

/** Mismo cálculo que calcFlete() de la app: recorrido por km + peso de la carga. */
export function calcularFlete(zona: string | undefined, kg: number): ResultadoFlete {
  const z = ZONAS_FLETE.find(([nombre]) => nombre === zona)
  if (!z) return { tipo: 'sin_zona' }
  const [nombre, km] = z
  if (kg > FLETE_TARIFA.maxKg) return { tipo: 'camion', zona: nombre, km, kg }
  const monto = Math.round((costoRecorrido(km) + kg * FLETE_TARIFA.porKg) * 100) / 100
  return { tipo: 'monto', zona: nombre, km, kg, monto }
}
