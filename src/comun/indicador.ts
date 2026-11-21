const MAXIMO_EN_EL_INDICADOR = 9;

/**
 * Indicador numérico de novedades: muestra la cantidad hasta 9 y "9+" desde 10; con cero no se muestra (null).
 * Lo usan la campana de notificaciones (CU40 RN4) y la barra de navegación (CU39 RN5).
 */
export function textoDelIndicador(cantidad: number): string | null {
  if (cantidad <= 0) return null;
  if (cantidad > MAXIMO_EN_EL_INDICADOR) return `${MAXIMO_EN_EL_INDICADOR}+`;
  return String(cantidad);
}
