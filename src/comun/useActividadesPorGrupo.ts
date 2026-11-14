import { useEffect, useState } from 'react';
import { buscarActividades } from '../api/actividades';
import type { ActividadEncontrada, FiltrosDeBusqueda, GrupoDeActividades, UbicacionDelUsuario } from '../api/tipos';
import { mensajeDeErrorDeBusqueda } from './mensajesExplorar';

interface EstadoResultados {
  clave: string;
  actividades: ActividadEncontrada[];
  paginaPedida: number;
  paginaCargada: number;
  hayMas: boolean;
  cargando: boolean;
  error: string | null;
}
const estadoInicial = (clave: string): EstadoResultados => ({
  clave,
  actividades: [],
  paginaPedida: 1,
  paginaCargada: 0,
  hayMas: false,
  cargando: true,
  error: null,
});

/** Una consulta paginada por sección; descarta respuestas de filtros anteriores y reinicia desde la página 1. */
export function useActividadesPorGrupo(
  grupo: GrupoDeActividades,
  filtros: FiltrosDeBusqueda | null,
  ubicacion: UbicacionDelUsuario | null,
  actualizacion = 0,
) {
  const clave = JSON.stringify({ grupo, filtros, ubicacion, actualizacion });
  const [estado, setEstado] = useState<EstadoResultados>(() => estadoInicial(clave));
  const [intento, setIntento] = useState(0);
  const actual = estado.clave === clave ? estado : estadoInicial(clave);
  const pagina = actual.paginaPedida;

  useEffect(() => {
    const consulta = JSON.parse(clave) as {
      grupo: GrupoDeActividades;
      filtros: FiltrosDeBusqueda | null;
      ubicacion: UbicacionDelUsuario | null;
    };
    if (!consulta.filtros) return;
    let vigente = true;
    setEstado((anterior) => ({ ...(anterior.clave === clave ? anterior : estadoInicial(clave)), cargando: true, error: null }));
    buscarActividades(consulta.filtros, pagina, consulta.ubicacion, consulta.grupo)
      .then((resultado) => {
        if (!vigente) return;
        setEstado((anterior) => ({
          ...anterior,
          actividades: [...anterior.actividades, ...resultado.actividades],
          paginaCargada: resultado.pagina,
          hayMas: resultado.hayMas,
          cargando: false,
        }));
      })
      .catch((error: unknown) => {
        if (vigente) setEstado((anterior) => ({ ...anterior, cargando: false, error: mensajeDeErrorDeBusqueda(error) }));
      });
    return () => {
      vigente = false;
    };
  }, [clave, pagina, intento]);

  return {
    ...actual,
    reintentar: () => setIntento((anterior) => anterior + 1),
    verMas: () => {
      if (!actual.hayMas || actual.cargando || actual.error) return;
      setEstado({ ...actual, paginaPedida: actual.paginaCargada + 1 });
    },
  };
}
