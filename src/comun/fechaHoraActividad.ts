export const ZONA_HORARIA_ACTIVIDAD = 'America/Montevideo';

/** CU10: extrae fecha y hora uruguayas, independientemente de la zona del celular. */
export function fechaHoraUruguay(instante: Date): { fecha: string; hora: string } {
  const partes = new Intl.DateTimeFormat('es-UY', {
    timeZone: ZONA_HORARIA_ACTIVIDAD,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instante);
  const obtener = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((parte) => parte.type === tipo)!.value;
  return {
    fecha: `${obtener('year')}-${obtener('month')}-${obtener('day')}`,
    hora: `${obtener('hour')}:${obtener('minute')}`,
  };
}

/** Valor inicial del selector; no completa campos hasta que el usuario confirma. */
export function valorDelSelector(fecha: string, hora: string, ahora = new Date()): Date {
  const actual = fechaHoraUruguay(ahora);
  const valor = new Date(`${fecha || actual.fecha}T${hora || actual.hora}:00-03:00`);
  return Number.isNaN(valor.getTime()) ? ahora : valor;
}
