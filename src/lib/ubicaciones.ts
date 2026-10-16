// Cobertura de Kersa (instalación y visita técnica), definida por JM el 16-oct-2026:
// toda Caracas; en Miranda solo Chacao, Baruta, Sucre, El Hatillo, Guarenas,
// Guatire, San Antonio de los Altos y Los Teques; en La Guaira de Catia La Mar
// hasta Tanaguarenas (sin la costa más allá ni Carayaca). Fuera de esto no se cotiza.
export const CIUDADES_MUNICIPIOS: Record<string, string[]> = {
  'Caracas (Distrito Capital)': ['Libertador'],
  'Miranda': [
    'Chacao', 'Baruta', 'Sucre', 'El Hatillo',
    'Plaza (Guarenas)', 'Zamora (Guatire)', 'Los Salias (San Antonio de los Altos)', 'Guaicaipuro (Los Teques)',
  ],
  'La Guaira (Vargas)': ['Catia La Mar', 'Maiquetía', 'La Guaira', 'Macuto', 'Caraballeda', 'Tanaguarenas'],
}

export const CIUDADES = Object.keys(CIUDADES_MUNICIPIOS)

export const COBERTURA_TEXTO =
  'Atendemos toda Caracas; en Miranda: Chacao, Baruta, Sucre, El Hatillo, Guarenas, Guatire, San Antonio de los Altos y Los Teques; y La Guaira desde Catia La Mar hasta Tanaguarenas.'

// Municipios con mínimo reducido de 15 m² para piso vinil
const MUNICIPIOS_MIN_15 = ['Chacao', 'Sucre', 'Baruta', 'Libertador']

export function minimoM2Vinil(municipio?: string): number {
  return municipio && MUNICIPIOS_MIN_15.includes(municipio) ? 15 : 30
}
