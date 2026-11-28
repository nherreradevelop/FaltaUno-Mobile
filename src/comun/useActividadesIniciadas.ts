import { useCallback, useEffect, useState } from 'react';
import { obtenerActividadesIniciadas } from '../api/actividadesIniciadas';
import type { ActividadIniciada } from '../api/tipos';
import { MENSAJE_FALLA_INICIADAS, unirActividadesIniciadas } from './actividadesIniciadas';

/** CU42: consulta paginada, reintentos y actualización sin perder resultados por una falla. */
export function useActividadesIniciadas(cargarAlMontar = true) {
  const [actividades, setActividades] = useState<ActividadIniciada[]>([]);
  const [consulta, setConsulta] = useState({ pagina: 1, intento: cargarAlMontar ? 0 : -1 });
  const [paginaCargada, setPaginaCargada] = useState(0);
  const [hayMas, setHayMas] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (consulta.intento < 0) return;
    let vigente = true;
    setCargando(true);
    setError(null);
    obtenerActividadesIniciadas(consulta.pagina)
      .then((resultado) => {
        if (!vigente) return;
        setActividades((anteriores) =>
          consulta.pagina === 1 ? resultado.actividades : unirActividadesIniciadas(anteriores, resultado.actividades),
        );
        setPaginaCargada(resultado.pagina);
        setHayMas(resultado.hayMas);
      })
      .catch(() => {
        if (vigente) setError(MENSAJE_FALLA_INICIADAS);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [consulta]);

  const actualizar = useCallback(() => {
    setCargando(true);
    setError(null);
    setConsulta((anterior) => ({ pagina: 1, intento: anterior.intento + 1 }));
  }, []);

  function reintentar() {
    setCargando(true);
    setError(null);
    setConsulta((anterior) => ({ ...anterior, intento: anterior.intento + 1 }));
  }

  function verMas() {
    if (cargando || error || !hayMas) return;
    setCargando(true);
    setConsulta((anterior) => ({ pagina: paginaCargada + 1, intento: anterior.intento + 1 }));
  }

  return { actividades, cargando, error, hayMas, actualizar, reintentar, verMas };
}
