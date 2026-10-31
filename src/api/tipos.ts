/** Tipos de las respuestas de la API (ver Swagger en /api/docs). */
export interface UsuarioSesion {
  id: string;
  nombre: string;
  email: string;
  fotoUrl: string | null;
}

export interface RespuestaLogin {
  token: string;
  venceEn: string;
  usuario: UsuarioSesion;
}
