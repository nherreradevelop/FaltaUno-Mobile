/**
 * Paleta única de la app, por roles (lineamientos FaltaUno, "Colores y botones"). Mismos roles que :root en la web.
 * Ningún color se escribe a mano fuera de este archivo. Un color nuevo entra por PR, en web y mobile a la vez.
 */
export const colores = {
  // Neutros
  fondo: '#F3F6F2',
  /** Tarjetas, inputs, menús. */
  superficie: '#FFFFFF',
  /** Esqueletos de carga. */
  superficieSutil: '#E6EBE8',
  borde: '#C9D3CF',
  texto: '#0F2537',
  textoSuave: '#4A5D6B',
  // Marca (azul)
  primario: '#1D6FB8',
  /** primarioFuerte: presionado y texto sobre primarioClaro. */
  primarioOscuro: '#13507F',
  /** primarioSuave. */
  primarioClaro: '#D6E8F5',
  /** Texto e íconos sobre primario, error y avatares. */
  sobrePrimario: '#FFFFFF',
  // Acento (naranja): solo detalles sin texto encima, nunca en botones
  acento: '#EF7D22',
  acentoOscuro: '#D9661A',
  acentoSuave: '#FDEBD9',
  /** Texto sobre acentoSuave. */
  acentoTexto: '#8A4210',
  // Estados
  exito: '#2D5A2D',
  exitoSuave: '#E3EFE3',
  advertencia: '#9A4A0C',
  advertenciaSuave: '#FDF0E3',
  error: '#B3261E',
  /** errorSuave. */
  errorFondo: '#FDECEA',
  // Terceros: atribución de Google Maps (color pedido por Google)
  atribucionGoogle: '#5E5E5E',
  // Capas
  /** Fondo detrás de diálogos y menús modales. */
  velo: 'rgba(15, 37, 55, 0.4)',
} as const;

/** Fondo de los avatares con iniciales (siempre con texto sobrePrimario). Se eligen con colorDeAvatar(nombre). */
export const coloresDeAvatar = ['#B45309', '#1D6FB8', '#2E7D4F', '#6D4AA3', '#0F766E', '#13507F'] as const;

/** Opacidad de todo control deshabilitado. */
export const OPACIDAD_DESHABILITADO = 0.6;

export const fuentes = {
  texto: 'Figtree',
  titulos: 'BricolageGrotesque',
} as const;
