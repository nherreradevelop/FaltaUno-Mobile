import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colores, fuentes } from '../comun/tema';

interface PropsBoton {
  texto: string;
  alPresionar: () => void;
  cargando?: boolean;
  variante?: 'principal' | 'secundario';
  /** Deshabilitado sin estar cargando (por ejemplo, una opción de un caso de uso pendiente). */
  deshabilitado?: boolean;
}

/** Botón redondeado. Mientras carga queda deshabilitado para no enviar dos veces (RNF-10). */
export function Boton({ texto, alPresionar, cargando = false, variante = 'principal', deshabilitado = false }: PropsBoton) {
  const esPrincipal = variante === 'principal';
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
        pressed && esPrincipal ? estilos.principalPresionado : null,
        inactivo ? estilos.deshabilitado : null,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={esPrincipal ? colores.blanco : colores.primario} />
      ) : (
        <Text style={[estilos.texto, esPrincipal ? estilos.textoPrincipal : estilos.textoSecundario]}>{texto}</Text>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: { height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  principal: { backgroundColor: colores.primario },
  principalPresionado: { backgroundColor: colores.primarioOscuro },
  secundario: { backgroundColor: colores.blanco, borderWidth: 1, borderColor: colores.borde },
  deshabilitado: { opacity: 0.6 },
  texto: { fontFamily: fuentes.texto, fontSize: 16, fontWeight: '700' },
  textoPrincipal: { color: colores.blanco },
  textoSecundario: { color: colores.texto, fontWeight: '600', fontSize: 15 },
});
