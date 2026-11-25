import { Observable } from './observable';

interface CambioFinanciero {
  usuarioId: string;
  actividadId: string | null;
}

interface CanalFinanciero {
  on(evento: string, escuchar: (datos: unknown) => void): unknown;
  off(evento: string, escuchar: (datos: unknown) => void): unknown;
}

const cambios = new Observable<CambioFinanciero>((error) => console.error('Falló la actualización financiera', error));

/** Reutiliza el socket autenticado; nunca transporta importes ni el historial de pagos. */
export function conectarActualizacionesFinancieras(canal: CanalFinanciero, usuarioId: string): () => void {
  function recibir(datos: unknown) {
    if (typeof datos !== 'object' || datos === null || !('actividadId' in datos)) return;
    if (typeof datos.actividadId !== 'string' || !datos.actividadId) return;
    cambios.notificar({ usuarioId, actividadId: datos.actividadId });
  }
  const reconectar = () => refrescarFinanzasDelUsuario(usuarioId);
  canal.on('finanzas:actualizadas', recibir);
  canal.on('connect', reconectar);
  return () => {
    canal.off('finanzas:actualizadas', recibir);
    canal.off('connect', reconectar);
  };
}

/** Una reconexión o el regreso a primer plano recupera también los cambios ocurridos sin conexión. */
export function refrescarFinanzasDelUsuario(usuarioId: string): void {
  cambios.notificar({ usuarioId, actividadId: null });
}

/** Agrupa ráfagas y serializa consultas. Si llega otro cambio durante un GET, vuelve a consultar al terminar. */
export function suscribirActualizacionFinanciera(
  usuarioId: string,
  actividadId: string,
  recargar: () => Promise<void>,
): () => void {
  let vigente = true;
  let pendiente = false;
  let consultando = false;
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  function programar() {
    if (!vigente || temporizador || consultando) return;
    temporizador = setTimeout(() => {
      temporizador = undefined;
      void actualizar();
    }, 100);
  }
  async function actualizar() {
    pendiente = false;
    consultando = true;
    try {
      await recargar();
    } catch (error) {
      console.error('No se pudieron actualizar las finanzas', error);
    } finally {
      consultando = false;
      if (pendiente) programar();
    }
  }
  const desconectar = cambios.suscribir((cambio) => {
    if (!vigente || cambio.usuarioId !== usuarioId) return;
    if (cambio.actividadId !== null && cambio.actividadId !== actividadId) return;
    pendiente = true;
    programar();
  });
  return () => {
    vigente = false;
    desconectar();
    clearTimeout(temporizador);
  };
}
