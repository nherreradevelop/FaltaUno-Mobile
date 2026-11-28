import { ErrorApi, pedir } from './cliente';
import type { ResultadoDeIniciadas } from './tipos';
import { esResultadoDeIniciadas, MENSAJE_FALLA_INICIADAS } from '../comun/actividadesIniciadas';

/** CU42 FP: la API determina el usuario a partir de su sesión. */
export async function obtenerActividadesIniciadas(pagina: number): Promise<ResultadoDeIniciadas> {
  const respuesta = await pedir<unknown>(`/api/actividades/iniciadas?pagina=${pagina}`);
  if (!esResultadoDeIniciadas(respuesta, pagina)) {
    throw new ErrorApi(0, 'RESPUESTA_INVALIDA', MENSAJE_FALLA_INICIADAS);
  }
  return respuesta;
}
