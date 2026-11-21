import { rutaDeEnlace } from '../src/sesion/enlacePendiente';

/**
 * CU39 A4: un enlace a una actividad (CU09 A3, CU19) que abre el sistema operativo se muestra dentro de Explorar.
 * El detalle existe en todas las secciones de la barra y, sin nombrar la sección, Expo Router elegiría la primera
 * en orden alfabético. Los demás enlaces siguen igual.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    return rutaDeEnlace(path) ?? path;
  } catch {
    // Un error acá cerraría la app: ante la duda, se deja el enlace como vino
    return path;
  }
}
