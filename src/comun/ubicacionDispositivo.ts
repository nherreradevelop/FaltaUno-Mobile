export interface UbicacionDispositivo {
  lat: number;
  lng: number;
  precisionMetros: number | null;
}

/** Adaptador de plataforma: permite probar permisos y respuestas tardías sin consultar un GPS real. */
export interface FuenteUbicacion {
  pedirPermiso: () => Promise<boolean>;
  serviciosActivos: () => Promise<boolean>;
  obtenerPosicion: () => Promise<UbicacionDispositivo>;
}

/** Una única posición por acción explícita; ignora respuestas después de cancelar o vencer el plazo. */
export function obtenerUbicacionActual(
  fuente: FuenteUbicacion,
  signal?: AbortSignal,
  esperaMs = 15000,
): Promise<UbicacionDispositivo> {
  return new Promise((resolve, reject) => {
    let terminado = false;
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    function terminar(resultado: () => void) {
      if (terminado) return;
      terminado = true;
      clearTimeout(temporizador);
      signal?.removeEventListener('abort', cancelar);
      resultado();
    }
    function cancelar() {
      terminar(() => reject(new Error('Se canceló la solicitud de ubicación.')));
    }
    if (signal?.aborted) return cancelar();
    signal?.addEventListener('abort', cancelar, { once: true });
    async function consultar() {
      try {
        const permitido = await fuente.pedirPermiso();
        if (terminado) return;
        if (!permitido) {
          terminar(() => reject(new Error('No diste permiso de ubicación. Podés marcar el punto manualmente.')));
          return;
        }
        const activo = await fuente.serviciosActivos();
        if (terminado) return;
        if (!activo) {
          terminar(() => reject(new Error('La ubicación del dispositivo está apagada. Podés marcar el punto manualmente.')));
          return;
        }
        temporizador = setTimeout(() => {
          terminar(() => reject(new Error('La ubicación está tardando demasiado. Reintentá o marcá el punto manualmente.')));
        }, esperaMs);
        const posicion = await fuente.obtenerPosicion();
        if (terminado) return;
        if (
          !Number.isFinite(posicion.lat) ||
          !Number.isFinite(posicion.lng) ||
          Math.abs(posicion.lat) > 90 ||
          Math.abs(posicion.lng) > 180 ||
          (posicion.precisionMetros !== null && (!Number.isFinite(posicion.precisionMetros) || posicion.precisionMetros < 0))
        ) {
          terminar(() => reject(new Error('El dispositivo devolvió una ubicación inválida. Podés marcar el punto manualmente.')));
          return;
        }
        terminar(() => resolve(posicion));
      } catch {
        terminar(() => reject(new Error('No pudimos obtener tu ubicación. Reintentá o marcá el punto manualmente.')));
      }
    }
    void consultar();
  });
}
