import { Observable } from './observable';

/** CU11: resultado de intentar unirse, que la pantalla del formulario avisa al cerrarse. */
export interface IncorporacionTerminada {
  actividadId: string;
  /** unido: FP paso 10 (o RN2, ya estaba anotado). sinLugar: E1, E2 o E3. */
  tipo: 'unido' | 'sinLugar';
  mensaje: string;
}

/**
 * La pantalla de unirse y el detalle son pantallas distintas del Stack y no se conocen: el formulario avisa acá y
 * el detalle, que está suscripto, muestra el aviso y se recarga. Pendiente: CU08 – la sección "Me uní" del inicio
 * también puede suscribirse para refrescarse.
 */
export const incorporaciones = new Observable<IncorporacionTerminada>((error) =>
  console.error('Falló un observador de incorporaciones', error),
);
