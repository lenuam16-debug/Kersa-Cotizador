export const CIUDADES_MUNICIPIOS: Record<string, string[]> = {
  'Caracas (Distrito Capital)': ['Libertador'],
  'Miranda': [
    'Baruta', 'Chacao', 'El Hatillo', 'Sucre', 'Zamora',
    'Guaicaipuro', 'Acevedo', 'Brión', 'Buroz', 'Cristóbal Rojas',
    'Independencia', 'Lander', 'Los Salias', 'Páez', 'Paz Castillo',
    'Pedro Gual', 'Urdaneta',
  ],
  'La Guaira (Vargas)': ['Vargas'],
}

export const CIUDADES = Object.keys(CIUDADES_MUNICIPIOS)

// Municipios con mínimo reducido de 15 m² para piso vinil
const MUNICIPIOS_MIN_15 = ['Chacao', 'Sucre', 'Baruta']

export function minimoM2Vinil(municipio?: string): number {
  return municipio && MUNICIPIOS_MIN_15.includes(municipio) ? 15 : 30
}
