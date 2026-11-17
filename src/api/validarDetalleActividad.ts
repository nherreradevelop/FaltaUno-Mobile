import type { DetalleActividad, OpcionDeActividad } from './tipos';

const OPCIONES: Record<OpcionDeActividad, true> = {
  verParticipantes: true,
  verMapa: true,
  unirse: true,
  abandonar: true,
  verChat: true,
  verGastos: true,
  invitarAmigos: true,
  modificarParticipacion: true,
  silenciar: true,
  valorar: true,
  compartir: true,
  editar: true,
  removerParticipantes: true,
  cancelar: true,
  archivar: true,
};
function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}
function esFecha(valor: unknown): boolean {
  return typeof valor === 'string' && Number.isFinite(Date.parse(valor));
}
function esNumero(valor: unknown): boolean {
  return typeof valor === 'number' && Number.isFinite(valor);
}
function esEntero(valor: unknown): boolean {
  return esNumero(valor) && Number.isSafeInteger(valor);
}
function esTextoNullable(valor: unknown): boolean {
  return valor === null || typeof valor === 'string';
}
function esNivel(valor: unknown): boolean {
  return valor === 'principiante' || valor === 'intermedio' || valor === 'avanzado';
}
function esUbicacion(valor: unknown): boolean {
  return esObjeto(valor) && typeof valor.direccion === 'string' && esNumero(valor.lat) && esNumero(valor.lng);
}
function esOrganizador(valor: unknown): boolean {
  return (
    valor === null ||
    (esObjeto(valor) && typeof valor.id === 'string' && typeof valor.nombre === 'string' && esTextoNullable(valor.fotoUrl))
  );
}
function esPronostico(valor: unknown): boolean {
  return (
    valor === null ||
    (esObjeto(valor) &&
      typeof valor.resumen === 'string' &&
      (valor.nivelRecomendado === null || esNivel(valor.nivelRecomendado)) &&
      typeof valor.interpretacionDisponible === 'boolean' &&
      esFecha(valor.fechaGeneracion))
  );
}

/** CU09 H01: valida el contrato recibido antes de que la pantalla acceda a campos anidados. */
export function esDetalleDeActividad(valor: unknown): valor is DetalleActividad {
  if (!esObjeto(valor) || !esObjeto(valor.deporte)) return false;
  return (
    typeof valor.id === 'string' &&
    typeof valor.nombre === 'string' &&
    esEntero(valor.deporte.id) &&
    typeof valor.deporte.nombre === 'string' &&
    ['programada', 'iniciada', 'archivada', 'cancelada'].includes(String(valor.estado)) &&
    esFecha(valor.fechaHoraInicio) &&
    (valor.fechaLimiteGastos === null || esFecha(valor.fechaLimiteGastos)) &&
    esNivel(valor.nivel) &&
    esTextoNullable(valor.descripcion) &&
    (valor.origen === null || esUbicacion(valor.origen)) &&
    esUbicacion(valor.destino) &&
    esEntero(valor.cupoMaximo) &&
    esEntero(valor.cuposOcupados) &&
    esOrganizador(valor.organizador) &&
    (valor.costoEstimadoCentesimos === null || esEntero(valor.costoEstimadoCentesimos)) &&
    esPronostico(valor.pronostico) &&
    ['organizador', 'participante', 'ninguno'].includes(String(valor.miRol)) &&
    Array.isArray(valor.opciones) &&
    valor.opciones.every((opcion) => typeof opcion === 'string' && Object.hasOwn(OPCIONES, opcion))
  );
}
