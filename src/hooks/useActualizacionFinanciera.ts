import { useEffect } from 'react';
import { suscribirActualizacionFinanciera } from '../comun/actualizacionesFinancieras';
import { useSesion } from '../sesion/SesionContexto';

/** CU23–CU26: mantiene la vista actual sin reemplazar formularios ni intenciones pendientes. */
export function useActualizacionFinanciera(
  actividadId: string,
  recargar: (conservarError?: boolean, segundoPlano?: boolean) => Promise<void>,
  /** false mientras la vista no se abrió: no hay nada en pantalla que mantener actualizado. */
  habilitado = true,
) {
  const { sesion } = useSesion();
  const usuarioId = sesion?.usuario.id;
  useEffect(() => {
    if (!usuarioId || !habilitado) return;
    return suscribirActualizacionFinanciera(usuarioId, actividadId, () => recargar(true, true));
  }, [usuarioId, actividadId, recargar, habilitado]);
}
