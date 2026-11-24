import { useActualizacionFinanciera } from './useActualizacionFinanciera';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ErrorApi } from '../api/cliente';
import {
  consultarOperacionGasto,
  enviarGasto,
  listarGastos,
  obtenerBalances,
  obtenerGasto,
  type Balance,
  type DatosGasto,
  type Gasto,
  type IntentoGasto,
  type OpcionesGasto,
  type ResultadoGasto,
} from '../api/gastos';
import { useSesion } from '../sesion/SesionContexto';

// Conserva la intención al cambiar de pestaña, aislada por usuario y actividad, sin guardar tokens.
const pendientes = new Map<string, IntentoGasto>();

/** Estado común de CU23–CU25: no permite cambiar una intención con resultado desconocido. */
export function useGastos(actividadId: string) {
  const { sesion } = useSesion();
  const ambito = `${sesion?.usuario.id ?? ''}:${actividadId}`;
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [opciones, setOpciones] = useState<OpcionesGasto | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [codigo, setCodigo] = useState('');
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState('');
  const [pendiente, setPendiente] = useState<IntentoGasto | null>(() => pendientes.get(ambito) ?? null);
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
        const [pagina, actuales] = await Promise.all([listarGastos(actividadId), obtenerBalances(actividadId)]);
        if (vigente.current && consulta === consultaActual.current) {
          setGastos(pagina.gastos);
          setOpciones(pagina.opciones);
          setCursor(pagina.siguienteCursor);
          setBalances(actuales);
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

  function guardarPendiente(intento: IntentoGasto | null) {
    if (intento) pendientes.set(ambito, intento);
    else pendientes.delete(ambito);
    if (vigente.current) {
      setPendiente(intento);
      setPuedeReintentar(false);
    }
  }

  async function completar(resultado: ResultadoGasto, accion: IntentoGasto['accion']) {
    guardarPendiente(null);
    if (vigente.current) {
      setError('');
      setCampos({});
      setCodigo('');
      const texto = {
        registrar: 'El gasto fue registrado correctamente.',
        editar: 'El gasto fue actualizado.',
        eliminar: 'El gasto fue eliminado.',
      }[accion];
      setAviso(resultado.sinCambios ? 'No hay cambios para guardar.' : texto);
    }
    await recargar();
  }

  async function ejecutar(intento: IntentoGasto): Promise<boolean> {
    if (enCurso.current) return false;
    enCurso.current = true;
    setOcupado(true);
    setError('');
    setCampos({});
    setCodigo('');
    setAviso('');
    guardarPendiente(intento);
    try {
      await completar(await enviarGasto(actividadId, intento), intento.accion);
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
      if (!incierto && fallo instanceof ErrorApi && [403, 404, 409].includes(fallo.estado)) await recargar(true);
      return false;
    } finally {
      enCurso.current = false;
      if (vigente.current) setOcupado(false);
    }
  }

  async function enviar(accion: IntentoGasto['accion'], datos: DatosGasto | null, gasto: Gasto | null) {
    if (pendiente || enCurso.current) return false;
    // Clave de correlación, no credencial: combina tiempo y tres componentes aleatorios para funcionar en Hermes.
    const clave = `gasto_${Date.now().toString(36)}_${[0, 1, 2].map(() => Math.random().toString(36).slice(2)).join('_')}`;
    return ejecutar({ clave, accion, datos, gasto });
  }

  async function verificar(): Promise<boolean> {
    if (!pendiente || enCurso.current) return false;
    enCurso.current = true;
    setOcupado(true);
    try {
      const consulta = await consultarOperacionGasto(actividadId, pendiente.clave);
      if (consulta.estado === 'confirmada') {
        await completar(consulta.resultado, pendiente.accion);
        return true;
      }
      setPuedeReintentar(true);
      setError('La operación aún no figura registrada. Podés reenviar el mismo intento sin cambiar sus datos.');
      return false;
    } catch {
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
      const pagina = await listarGastos(actividadId, cursor);
      if (!vigente.current || consulta !== consultaActual.current) return;
      setGastos((lista) => [...lista, ...pagina.gastos.filter((g) => !lista.some((anterior) => anterior.id === g.id))]);
      setCursor(pagina.siguienteCursor);
    } catch (fallo) {
      setError(mensaje(fallo));
    } finally {
      enCurso.current = false;
      setOcupado(false);
    }
  }
  async function revisar(gastoId: string): Promise<Gasto | null> {
    if (enCurso.current) return null;
    enCurso.current = true;
    setOcupado(true);
    try {
      const gasto = await obtenerGasto(actividadId, gastoId);
      setError('');
      setCodigo('');
      return gasto;
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
    gastos,
    balances,
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
  return error instanceof ErrorApi ? error.message : 'No pudimos cargar los gastos. Probá de nuevo.';
}
