import type { DatosUnirseActividad, LugarActividad } from '../api/actividades';

// Mismo archivo en web/src/comun y mobile/src/comun: la lógica del formulario no depende de la plataforma.

/** CU11 FP pasos 5 y 6: lo que el usuario completa antes de unirse. */
export interface FormularioUnirse {
  tieneVehiculo: boolean;
  /** Texto del campo; se convierte a número al enviar. */
  lugaresVehiculo: string;
  /** null si no indica punto de partida (es opcional, RN10). */
  puntoPartida: LugarActividad | null;
  invitados: string[];
}

export function formularioUnirseInicial(): FormularioUnirse {
  return { tieneVehiculo: false, lugaresVehiculo: '', puntoPartida: null, invitados: [] };
}

/** Errores de cada campo; las claves de invitados son `invitados.0`, `invitados.1`... */
export type CamposConError = Record<string, string>;

export const MENSAJE_UNIDO = 'Te uniste a la actividad.';
/**
 * CU11 paso 5: quién ve el punto de partida. Decisión del equipo del 21/11/2026 (lo ven participantes y organizador),
 * pendiente de pasar a la ficha. Si se decide ocultarlo, cambiar también este texto.
 */
export const AVISO_PUNTO_DE_PARTIDA =
  'Completalo si querés compartir el traslado. Lo van a ver los demás participantes de la actividad. ' +
  'Podés marcar una esquina o un lugar conocido cerca; no hace falta tu dirección exacta.';

/** CU11 ER1: el usuario puede intentar nuevamente sin perder lo que completó. */
export const MENSAJE_FALLA_AL_UNIRSE = 'No pudimos completar tu incorporación. Probá de nuevo.';

/** Validación de forma antes de enviar. Las reglas de negocio (cupo, estado, RN2) las valida la API. */
export function validarFormularioUnirse(formulario: FormularioUnirse): CamposConError {
  const campos: CamposConError = {};
  if (formulario.tieneVehiculo) {
    const lugares = Number(formulario.lugaresVehiculo);
    const esEnteroValido = formulario.lugaresVehiculo.trim() !== '' && Number.isInteger(lugares) && lugares >= 0;
    if (!esEnteroValido) {
      campos.lugaresVehiculo = 'Indicá cuántas personas podés llevar.';
    }
  }
  formulario.invitados.forEach((nombre, indice) => {
    if (nombre.trim() === '') {
      campos[`invitados.${indice}`] = `Ingresá el nombre del invitado ${indice + 1}.`;
    } else if (nombre.trim().length > 100) {
      campos[`invitados.${indice}`] = `El nombre del invitado ${indice + 1} admite hasta 100 caracteres.`;
    }
  });
  return campos;
}

/** Cuerpo de POST /api/actividades/:id/participantes. */
export function aDatosUnirse(formulario: FormularioUnirse): DatosUnirseActividad {
  const punto = formulario.puntoPartida;
  const esPin = punto?.tipo === 'pin';
  const datos: DatosUnirseActividad = {
    tieneVehiculo: formulario.tieneVehiculo,
    lugaresVehiculo: formulario.tieneVehiculo ? Number(formulario.lugaresVehiculo) : null,
    puntoPartidaPlaceId: punto && !esPin ? punto.placeId : null,
    invitados: formulario.invitados.map((nombre) => nombre.trim()),
  };
  if (punto && esPin) {
    datos.puntoPartidaCoordenadas = { lat: punto.lat!, lng: punto.lng! };
  }
  return datos;
}

/** Lo mínimo de un error de la API que hace falta para decidir qué mostrar. */
export interface ErrorAlUnirse {
  estado: number;
  codigo: string;
  message: string;
  campos?: Record<string, string>;
}

/**
 * Qué hace la pantalla con cada respuesta de error:
 * - unido: RN2, ya estaba anotado (por ejemplo, un reintento cuya primera respuesta se perdió). Se muestra como éxito.
 * - sinLugar: E1, E2 o E3. Se cierra el formulario, se avisa y se recarga el detalle (A1: sigue fuera de la actividad).
 * - campos: algo para corregir en el formulario, que queda abierto con lo que el usuario escribió.
 * - falla: ER1 o sin conexión. El formulario queda abierto para reintentar.
 */
export type ResultadoDeErrorAlUnirse =
  | { tipo: 'unido' }
  | { tipo: 'sinLugar'; mensaje: string }
  | { tipo: 'campos'; campos: CamposConError }
  | { tipo: 'falla'; mensaje: string };

const CODIGOS_SIN_LUGAR = [
  'ACTIVIDAD_COMPLETA',
  'ACTIVIDAD_NO_ADMITE_INCORPORACIONES',
  'ACTIVIDAD_CANCELADA',
  'ACTIVIDAD_NO_DISPONIBLE',
];

export function clasificarErrorAlUnirse(error: ErrorAlUnirse | null): ResultadoDeErrorAlUnirse {
  if (error === null) {
    return { tipo: 'falla', mensaje: MENSAJE_FALLA_AL_UNIRSE };
  }
  if (error.codigo === 'YA_PARTICIPA') {
    return { tipo: 'unido' };
  }
  if (CODIGOS_SIN_LUGAR.includes(error.codigo)) {
    return { tipo: 'sinLugar', mensaje: error.message };
  }
  if (error.codigo === 'LUGARES_INSUFICIENTES') {
    return { tipo: 'campos', campos: { invitados: error.message } }; // RN9: puede sacar invitados y reintentar
  }
  const esFallaDeMapas = error.codigo.startsWith('MAPAS_') || error.codigo.startsWith('PUNTOS_');
  if (esFallaDeMapas) {
    return { tipo: 'campos', campos: { puntoPartida: error.message } }; // puede sacar el punto de partida o reintentar
  }
  if (error.estado === 400 && error.campos) {
    return { tipo: 'campos', campos: camposDelFormulario(error.campos) };
  }
  return { tipo: 'falla', mensaje: MENSAJE_FALLA_AL_UNIRSE };
}

/** La API nombra el punto de partida por cómo se eligió; en el formulario es un solo campo. */
function camposDelFormulario(camposDeLaApi: Record<string, string>): CamposConError {
  const campos: CamposConError = {};
  for (const [campo, mensaje] of Object.entries(camposDeLaApi)) {
    const esDelPuntoDePartida = campo.startsWith('puntoPartida') || campo === 'ubicacion';
    campos[esDelPuntoDePartida ? 'puntoPartida' : campo] = mensaje;
  }
  return campos;
}

/** RN5/RN9: cuántos invitados más entran, contando que el usuario también ocupa un lugar. */
export function lugaresParaInvitados(cuposLibres: number, cantidadInvitados: number): number {
  return Math.max(0, cuposLibres - 1 - cantidadInvitados);
}

export function textoLugaresParaInvitados(cuposLibres: number, cantidadInvitados: number): string {
  const restantes = lugaresParaInvitados(cuposLibres, cantidadInvitados);
  if (restantes === 0) {
    return 'Vos también ocupás un lugar. No quedan lugares para más invitados.';
  }
  if (restantes === 1) {
    return 'Vos también ocupás un lugar. Queda 1 lugar para invitados.';
  }
  return `Vos también ocupás un lugar. Quedan ${restantes} lugares para invitados.`;
}
