import { Pressable, StyleSheet, Text } from 'react-native';
import type { MiValoracion } from '../api/valoraciones';
import { colores, fuentes } from '../comun/tema';
import { etiquetaDelBotonDeValorar, PUNTAJES } from '../comun/valoraciones';

interface PropsEstrellas {
  nombre: string;
  /** La valoración que el usuario ya le dio (A2), o null si está pendiente (A1). */
  valoracion: MiValoracion | null;
  alPresionar: () => void;
}

/**
 * CU21: junto a cada participante, las estrellas muestran con cuánto lo valoraste. Tocarlas abre el formulario para
 * valorarlo o cambiar la valoración (A2). Es un solo botón: las estrellas se eligen dentro del formulario.
 */
export function EstrellasDeValoracion({ nombre, valoracion, alPresionar }: PropsEstrellas) {
  const puntaje = valoracion?.puntaje ?? 0;
  const dibujo = PUNTAJES.map((estrella) => (estrella <= puntaje ? '★' : '☆')).join('');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiquetaDelBotonDeValorar(nombre, valoracion)}
      onPress={alPresionar}
      hitSlop={6}
      style={({ pressed }) => [estilos.boton, pressed ? estilos.presionado : null]}
    >
      <Text style={[estilos.estrellas, valoracion ? null : estilos.estrellasPendientes]}>{dibujo}</Text>
      {/* El color no es la única señal: el texto dice si falta valorarlo */}
      <Text style={estilos.texto}>{valoracion ? 'Cambiar' : 'Valorar'}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: { minHeight: 44, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 6, borderRadius: 12 },
  presionado: { backgroundColor: colores.primarioClaro },
  estrellas: { fontSize: 16, lineHeight: 20, letterSpacing: 1, color: colores.acento },
  estrellasPendientes: { color: colores.textoSuave },
  texto: { fontFamily: fuentes.texto, fontSize: 13, fontWeight: '600', color: colores.primario },
});
