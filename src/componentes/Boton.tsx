import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colores, fuentes, OPACIDAD_DESHABILITADO } from '../comun/tema';

interface PropsBoton {
  texto: string;
  alPresionar: () => void;
  cargando?: boolean;
  /** peligro: acción que saca al usuario de algo (por ejemplo, abandonar una actividad). */
  variante?: 'principal' | 'secundario' | 'peligro';
  /** Deshabilitado sin estar cargando (por ejemplo, una opción de un caso de uso pendiente). */
  deshabilitado?: boolean;
}

/** Mientras carga, el indicador va del color del texto de la variante. */
function colorDelIndicador(variante: 'principal' | 'secundario' | 'peligro'): string {
  if (variante === 'principal') return colores.sobrePrimario;
  if (variante === 'peligro') return colores.error;
  return colores.primario;
}

/** Botón redondeado. Mientras carga queda deshabilitado para no enviar dos veces (RNF-10). */
export function Boton({ texto, alPresionar, cargando = false, variante = 'principal', deshabilitado = false }: PropsBoton) {
  const esPrincipal = variante === 'principal';
  const esPeligro = variante === 'peligro';
  const inactivo = cargando || deshabilitado;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      disabled={inactivo}
      onPress={alPresionar}
      style={({ pressed }) => [
        estilos.base,
        esPrincipal ? estilos.principal : estilos.secundario,
        esPeligro ? estilos.peligro : null,
        pressed && esPrincipal ? estilos.principalPresionado : null,
        inactivo ? estilos.deshabilitado : null,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={colorDelIndicador(variante)} />
      ) : (
        <Text
          style={[
            estilos.texto,
            esPrincipal ? estilos.textoPrincipal : estilos.textoSecundario,
            esPeligro ? estilos.textoPeligro : null,
          ]}
        >
          {texto}
        </Text>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: { height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  principal: { backgroundColor: colores.primario },
  principalPresionado: { backgroundColor: colores.primarioOscuro },
  secundario: { backgroundColor: colores.superficie, borderWidth: 1, borderColor: colores.primario },
  peligro: { borderColor: colores.error },
  deshabilitado: { opacity: OPACIDAD_DESHABILITADO },
  texto: { fontFamily: fuentes.texto, fontSize: 16, fontWeight: '700' },
  textoPrincipal: { color: colores.sobrePrimario },
  textoSecundario: { color: colores.primario, fontWeight: '700', fontSize: 15 },
  textoPeligro: { color: colores.error },
});
