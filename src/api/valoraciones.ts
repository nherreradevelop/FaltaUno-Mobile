import { pedir } from './cliente';

/** CU21: la valoración que el usuario le dio a otro participante. */
export interface MiValoracion {
  puntaje: number;
  comentario: string | null;
}

/** CU21 FP paso 2: otro participante de la actividad; miValoracion es null si todavía no lo valoró. */
export interface ParticipanteParaValorar {
  usuario: { id: string; nombre: string; fotoUrl: string | null };
  esOrganizador: boolean;
  miValoracion: MiValoracion | null;
}

/** CU21 FP pasos 1 y 2: los demás participantes, con la valoración que ya les diste. */
export async function obtenerMisValoraciones(actividadId: string): Promise<ParticipanteParaValorar[]> {
  const { participantes } = await pedir<{ participantes: ParticipanteParaValorar[] }>(
    `/api/actividades/${encodeURIComponent(actividadId)}/valoraciones`,
  );
  return participantes;
}

/** CU21 FP pasos 6 a 10 y A2: guarda (o reemplaza) la valoración y devuelve la que quedó registrada. */
export async function guardarValoracion(actividadId: string, usuarioId: string, valoracion: MiValoracion): Promise<MiValoracion> {
  const respuesta = await pedir<{ valoracion: MiValoracion }>(
    `/api/actividades/${encodeURIComponent(actividadId)}/valoraciones/${encodeURIComponent(usuarioId)}`,
    { metodo: 'PUT', cuerpo: valoracion },
  );
  return respuesta.valoracion;
}
