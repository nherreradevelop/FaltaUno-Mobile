import type { DatosCrearActividad, LugarActividad, NivelActividad } from '../api/actividades';

export interface FormularioActividad {
  nombre: string;
  descripcion: string;
  deporteId: string;
  fecha: string;
  hora: string;
  cupoMaximo: string;
  nivel: NivelActividad;
  origen: LugarActividad | null;
  destino: LugarActividad | null;
  tieneVehiculo: boolean;
  lugaresVehiculo: string;
  requiereVehiculo: boolean;
  invitados: string[];
  costo: string;
}
export function formularioInicial(): FormularioActividad {
  return {
    nombre: '',
    descripcion: '',
    deporteId: '',
    fecha: '',
    hora: '',
    cupoMaximo: '2',
    nivel: 'principiante',
    origen: null,
    destino: null,
    tieneVehiculo: false,
    lugaresVehiculo: '',
    requiereVehiculo: false,
    invitados: [],
    costo: '',
  };
}

/** Identificador aleatorio de intención/búsqueda, sin función de autenticación. */
export function nuevaClave(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (letra) => {
    const valor = Math.floor(Math.random() * 16);
    return (letra === 'x' ? valor : (valor & 3) | 8).toString(16);
  });
}

/** Pesos del formulario -> centésimos enteros, sin multiplicar un decimal binario. */
export function aCentavos(valor: string): number | null {
  const limpio = valor.trim();
  if (!limpio) return null;
  if (!/^\d{1,10}([.,]\d{1,2})?$/.test(limpio)) throw new Error('Ingresá un costo válido con hasta dos decimales.');
  const [enteros, decimales = ''] = limpio.replace(',', '.').split('.');
  return Number(enteros) * 100 + Number(decimales.padEnd(2, '0'));
}
export function mostrarImporte(centavos: number): string {
  return `$ ${Math.trunc(centavos / 100).toLocaleString('es-UY')},${String(centavos % 100).padStart(2, '0')}`;
}

/** CU10: hora local uruguaya -> ISO con zona explícita. Rechaza fechas normalizadas, como 30 de febrero. */
export function fechaDeActividad(fecha: string, hora: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^\d{2}:\d{2}$/.test(hora)) {
    throw new Error('Completá la fecha (AAAA-MM-DD) y la hora (HH:mm).');
  }
  const instante = new Date(`${fecha}T${hora}:00-03:00`);
  if (
    Number.isNaN(instante.getTime()) ||
    new Date(instante.getTime() - 3 * 3600000).toISOString().slice(0, 16) !== `${fecha}T${hora}`
  ) {
    throw new Error('Revisá la fecha y la hora ingresadas.');
  }
  return instante.toISOString();
}

/** Errores de presentación; las reglas se vuelven a comprobar en la API al guardar. */
export class ErrorFormulario extends Error {
  readonly campos: Record<string, string>;

  constructor(campos: Record<string, string>) {
    super('Revisá los campos señalados antes de crear la actividad.');
    this.name = 'ErrorFormulario';
    this.campos = campos;
  }
}

/** CU10 E1–E4: informa todos los problemas sin depender de la disponibilidad del proveedor de mapas. */
export function datosDelFormulario(
  formulario: FormularioActividad,
  maximoParticipantes: number,
  ahora: Date = new Date(),
): DatosCrearActividad {
  const campos: Record<string, string> = {};
  const nombre = formulario.nombre.trim();
  const descripcion = formulario.descripcion.trim();
  if (!nombre) campos.nombre = 'Ingresá el nombre de la actividad.';
  else if (nombre.length > 100) campos.nombre = 'El nombre admite hasta 100 caracteres.';
  if (!descripcion) campos.descripcion = 'Ingresá una descripción.';
  else if (descripcion.length > 1000) campos.descripcion = 'La descripción admite hasta 1000 caracteres.';
  if (!/^\d+$/.test(formulario.deporteId) || Number(formulario.deporteId) < 1) campos.deporteId = 'Seleccioná un deporte.';

  let fechaHoraInicio = '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(formulario.fecha)) campos.fecha = 'Ingresá una fecha válida.';
  if (!/^\d{2}:\d{2}$/.test(formulario.hora)) campos.hora = 'Ingresá una hora válida.';
  if (!campos.fecha && !campos.hora) {
    try {
      fechaHoraInicio = fechaDeActividad(formulario.fecha, formulario.hora);
      if (new Date(fechaHoraInicio) <= ahora) campos.fechaHoraInicio = 'La fecha y hora deben ser futuras.';
    } catch {
      campos.fechaHoraInicio = 'Revisá la fecha y la hora ingresadas.';
    }
  }

  const cupo = Number(formulario.cupoMaximo);
  if (!/^\d+$/.test(formulario.cupoMaximo) || !Number.isSafeInteger(cupo)) campos.cupoMaximo = 'Ingresá un cupo entero.';
  else if (cupo < 2 || cupo > maximoParticipantes) campos.cupoMaximo = `El cupo debe estar entre 2 y ${maximoParticipantes}.`;

  if (formulario.tieneVehiculo && !formulario.origen) {
    campos.origenPlaceId = 'Si tenés vehículo propio, seleccioná tu punto de origen.';
  }
  for (const [campo, lugar] of [
    ['origenPlaceId', formulario.origen],
    ['destinoPlaceId', formulario.destino],
  ] as const) {
    if (
      lugar?.tipo === 'pin' &&
      (!Number.isFinite(lugar.lat) || !Number.isFinite(lugar.lng) || Math.abs(lugar.lat!) > 90 || Math.abs(lugar.lng!) > 180)
    ) {
      campos[campo] = 'Marcá un punto válido en el mapa.';
    } else if (lugar && lugar.tipo !== 'pin' && !lugar.placeId) {
      campos[campo] = 'Seleccioná un lugar válido.';
    }
  }
  if (!formulario.destino) campos.destinoPlaceId = 'Seleccioná un lugar o un pin como destino.';
  if (
    formulario.tieneVehiculo &&
    (!/^\d+$/.test(formulario.lugaresVehiculo) ||
      !Number.isSafeInteger(Number(formulario.lugaresVehiculo)) ||
      Number(formulario.lugaresVehiculo) > 32767)
  ) {
    campos.lugaresVehiculo = 'Indicá una cantidad válida de personas que podés llevar.';
  }
  if (Number.isSafeInteger(cupo) && 1 + formulario.invitados.length > cupo)
    campos.invitados = 'El organizador y los participantes externos no pueden superar el cupo.';
  formulario.invitados.forEach((invitado, indice) => {
    if (!invitado.trim()) campos[`invitados.${indice}`] = `Ingresá el nombre del participante externo ${indice + 1}.`;
    else if (invitado.trim().length > 100)
      campos[`invitados.${indice}`] = `El nombre del participante externo ${indice + 1} admite hasta 100 caracteres.`;
  });
  let costoEstimadoCentavos: number | null = null;
  try {
    costoEstimadoCentavos = aCentavos(formulario.costo);
  } catch (error) {
    campos.costoEstimadoCentavos = error instanceof Error ? error.message : 'Ingresá un costo válido.';
  }
  if (Object.keys(campos).length > 0) throw new ErrorFormulario(campos);
  return {
    nombre,
    descripcion,
    deporteId: Number(formulario.deporteId),
    fechaHoraInicio,
    cupoMaximo: cupo,
    nivel: formulario.nivel,
    origenPlaceId: formulario.origen?.tipo === 'pin' ? null : (formulario.origen?.placeId ?? null),
    destinoPlaceId: formulario.destino!.tipo === 'pin' ? null : formulario.destino!.placeId,
    ...(formulario.origen?.tipo === 'pin'
      ? { origenCoordenadas: { lat: formulario.origen.lat!, lng: formulario.origen.lng! } }
      : {}),
    ...(formulario.destino?.tipo === 'pin'
      ? { destinoCoordenadas: { lat: formulario.destino.lat!, lng: formulario.destino.lng! } }
      : {}),
    tieneVehiculo: formulario.tieneVehiculo,
    lugaresVehiculo: formulario.tieneVehiculo ? Number(formulario.lugaresVehiculo) : null,
    requiereVehiculo: formulario.requiereVehiculo,
    invitados: formulario.invitados.map((nombre) => nombre.trim()),
    costoEstimadoCentavos,
  };
}

/** Solo estos errores de infraestructura confirman que el alta todavía no comenzó. */
export function resultadoIncierto(error: { estado: number; codigo: string }): boolean {
  return (
    (error.estado === 0 || error.estado >= 500) &&
    !error.codigo.startsWith('MAPAS_') &&
    !error.codigo.startsWith('PUNTOS_') &&
    error.codigo !== 'IDEMPOTENCIA_NO_DISPONIBLE'
  );
}
