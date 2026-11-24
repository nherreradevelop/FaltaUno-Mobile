import { useActualizacionFinanciera } from './useActualizacionFinanciera';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ErrorApi } from '../api/cliente';
import {
  consultarOperacionPago,
  enviarPago,
  listarPagos,
  obtenerPago,
  type DatosPago,
  type Pago,
  type IntentoPago,
  type OpcionesPago,
  type ResultadoPago,
} from '../api/pagos';
import { useSesion } from '../sesion/SesionContexto';

// Conserva la intención al cambiar de pestaña, aislada por usuario y actividad, sin guardar tokens.
const pendientes = new Map<string, IntentoPago>();

/** Estado de CU26 y pagos de CU24–CU25: no permite cambiar una intención con resultado desconocido. */
export function usePagos(actividadId: string) {
  const { sesion } = useSesion();
  const ambito = `${sesion?.usuario.id ?? ''}:${actividadId}`;
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [opciones, setOpciones] = useState<OpcionesPago | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [codigo, setCodigo] = useState('');
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState('');
  const [pendiente, setPendiente] = useState<IntentoPago | null>(() => pendientes.get(ambito) ?? null);
  const [puedeReintentar, setPuedeReintentar] = useState(false);
  const vigente = useRef(true);
  const enCurso = useRef(false);
  const consultaActual = useRef(0);

  const recargar = useCallback(
    async (conservarError = false, segundoPlano = false) => {
      const consulta = ++consultaActual.current;
      if (!segundoPlano) setCargando(true);
      if (!conservarError) setError('');
      try {
        const pagina = await listarPagos(actividadId);
        if (vigente.current && consulta === consultaActual.current) {
          setPagos(pagina.pagos);
          setOpciones(pagina.opciones);
          setCursor(pagina.siguienteCursor);
        }
      } catch (fallo) {
        if (vigente.current && consulta === consultaActual.current && !segundoPlano) setError(mensaje(fallo));
      } finally {
        if (vigente.current && consulta === consultaActual.current) setCargando(false);
      }
    },
    [actividadId],
  );

  useEffect(() => {
    vigente.current = true;
    void recargar();
    return () => {
      vigente.current = false;
    };
  }, [recargar]);

  useActualizacionFinanciera(actividadId, recargar);

  function guardarPendiente(intento: IntentoPago | null) {
    if (intento) pendientes.set(ambito, intento);
    else pendientes.delete(ambito);
    if (vigente.current) {
      setPendiente(intento);
      setPuedeReintentar(false);
    }
  }

  async function completar(resultado: ResultadoPago, accion: IntentoPago['accion']) {
    guardarPendiente(null);
    if (vigente.current) {
      setError('');
      setCampos({});
      setCodigo('');
      const texto = {
        registrar: 'El pago fue registrado correctamente.',
        editar: 'El pago fue actualizado.',
        eliminar: 'El pago fue eliminado.',
      }[accion];
      setAviso(resultado.sinCambios ? 'No hay cambios para guardar.' : texto);
    }
    await recargar();
  }

  async function ejecutar(intento: IntentoPago): Promise<boolean> {
    if (enCurso.current) return false;
    enCurso.current = true;
    setOcupado(true);
    setError('');
    setCampos({});
    setCodigo('');
    setAviso('');
    guardarPendiente(intento);
    try {
      await completar(await enviarPago(actividadId, intento), intento.accion);
      return true;
    } catch (fallo) {
      const incierto = !(fallo instanceof ErrorApi) || fallo.estado === 0 || fallo.estado >= 500;
      if (!incierto) guardarPendiente(null);
      if (vigente.current) {
        setError(
          incierto
            ? 'No pudimos confirmar la operación. Conservamos tus datos. Verificá el resultado antes de reenviarla.'
            : mensaje(fallo),
        );
        if (fallo instanceof ErrorApi) {
          setCampos(fallo.campos ?? {});
          setCodigo(fallo.codigo);
        }
      }
      if (!incierto && fallo instanceof ErrorApi && [400, 403, 404, 409, 410].includes(fallo.estado)) await recargar(true);
      return false;
    } finally {
      enCurso.current = false;
      if (vigente.current) setOcupado(false);
    }
  }

  async function enviar(accion: IntentoPago['accion'], datos: DatosPago | null, pago: Pago | null) {
    if (pendiente || enCurso.current) return false;
    // Clave de correlación, no credencial: combina tiempo y tres componentes aleatorios para funcionar en Hermes.
    const clave = `pago_${Date.now().toString(36)}_${[0, 1, 2].map(() => Math.random().toString(36).slice(2)).join('_')}`;
    return ejecutar({ clave, accion, datos, pago });
  }

  async function verificar(): Promise<boolean> {
    if (!pendiente || enCurso.current) return false;
    enCurso.current = true;
    setOcupado(true);
    try {
      const consulta = await consultarOperacionPago(actividadId, pendiente.clave);
      if (consulta.estado === 'confirmada') {
        await completar(consulta.resultado, pendiente.accion);
        return true;
      }
      setPuedeReintentar(true);
      setError('La operación aún no figura registrada. Podés reenviar el mismo intento sin cambiar sus datos.');
      return false;
    } catch (fallo) {
      if (fallo instanceof ErrorApi && fallo.estado === 410) {
        guardarPendiente(null);
        setError(fallo.message);
        await recargar(true);
        return false;
      }
      setError('Todavía no pudimos determinar el resultado. Tus datos siguen pendientes de verificación.');
      return false;
    } finally {
      enCurso.current = false;
      if (vigente.current) setOcupado(false);
    }
  }

  async function reintentar(): Promise<boolean> {
    return pendiente && puedeReintentar ? ejecutar(pendiente) : false;
  }
  async function verMas() {
    if (!cursor || enCurso.current) return;
    enCurso.current = true;
    setOcupado(true);
    try {
      const consulta = consultaActual.current;
      const pagina = await listarPagos(actividadId, cursor);
      if (!vigente.current || consulta !== consultaActual.current) return;
      setPagos((lista) => [...lista, ...pagina.pagos.filter((g) => !lista.some((anterior) => anterior.id === g.id))]);
      setCursor(pagina.siguienteCursor);
    } catch (fallo) {
      setError(mensaje(fallo));
    } finally {
      enCurso.current = false;
      setOcupado(false);
    }
  }
  async function revisar(pagoId: string): Promise<Pago | null> {
    if (enCurso.current) return null;
    enCurso.current = true;
    setOcupado(true);
    try {
      const pago = await obtenerPago(actividadId, pagoId);
      setError('');
      setCodigo('');
      return pago;
    } catch (fallo) {
      setError(mensaje(fallo));
      await recargar(true);
      return null;
    } finally {
      enCurso.current = false;
      if (vigente.current) setOcupado(false);
    }
  }
  return {
    pagos,
    opciones,
    cargando,
    ocupado,
    error,
    codigo,
    campos,
    aviso,
    pendiente,
    puedeReintentar,
    hayMas: cursor !== null,
    recargar,
    enviar,
    verificar,
    reintentar,
    verMas,
    revisar,
  };
}

function mensaje(error: unknown): string {
  return error instanceof ErrorApi ? error.message : 'No pudimos cargar los pagos. Probá de nuevo.';
}
