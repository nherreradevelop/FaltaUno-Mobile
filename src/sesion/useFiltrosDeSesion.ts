import { useCallback, useEffect, useState } from 'react';
import type { FiltrosDeBusqueda } from '../api/tipos';
import { obtenerMiPerfil } from '../api/usuarios';
import { FILTROS_INICIALES } from '../comun/filtrosDeSesion';
import { almacenSesion } from './almacenSesion';
import { useSesion } from './SesionContexto';

/** Recupera filtros de la sesión; solo su primera visita toma los deportes de interés del perfil. */
export function useFiltrosDeSesion() {
  const { sesion } = useSesion();
  const token = sesion?.token;
  const [filtros, setFiltros] = useState<FiltrosDeBusqueda | null>(() => almacenSesion.filtrosDeBusqueda());
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    const guardados = almacenSesion.filtrosDeBusqueda();
    setFiltros(guardados);
    setError(null);
    if (!token || guardados) return;
    obtenerMiPerfil()
      .then((perfil) => {
        if (!vigente || almacenSesion.token() !== token) return;
        const iniciales = { ...FILTROS_INICIALES, deportes: perfil.deportes.map((deporte) => deporte.id) };
        setFiltros(iniciales);
        void Promise.resolve(almacenSesion.guardarFiltrosDeBusqueda(token, iniciales)).catch(() => {
          if (vigente) setError('No se pudieron guardar tus filtros en el dispositivo. Probá nuevamente.');
        });
      })
      .catch(() => {
        if (vigente) setError('No se pudieron cargar tus deportes de interés. Probá nuevamente.');
      });
    return () => {
      vigente = false;
    };
  }, [token, intento]);

  const aplicar = useCallback(
    (nuevos: FiltrosDeBusqueda) => {
      if (!token || almacenSesion.token() !== token) return;
      setFiltros(nuevos);
      setError(null);
      void Promise.resolve(almacenSesion.guardarFiltrosDeBusqueda(token, nuevos)).catch(() => {
        if (almacenSesion.token() === token) setError('No se pudieron guardar tus filtros en el dispositivo. Probá nuevamente.');
      });
    },
    [token],
  );
  const reintentar = () => {
    if (filtros) aplicar(filtros);
    else setIntento((anterior) => anterior + 1);
  };
  return { filtros, aplicar, error, reintentar };
}
