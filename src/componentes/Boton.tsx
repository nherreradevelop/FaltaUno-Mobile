import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colores, fuentes, OPACIDAD_DESHABILITADO } from '../comun/tema';

type TonoBoton = 'marca' | 'finanzas' | 'balances';

const tonos = {
  marca: { primario: colores.primario, fuerte: colores.primarioOscuro },
  finanzas: { primario: colores.finanzasPrimario, fuerte: colores.finanzasFuerte },
  balances: { primario: colores.balancesPrimario, fuerte: colores.balancesPrimario },
};

interface PropsBoton {
  texto: string;
  alPresionar: () => void;
  cargando?: boolean;
  /** peligro: acción que saca al usuario de algo (por ejemplo, abandonar una actividad). */
  variante?: 'principal' | 'secundario' | 'peligro';
  /** Conserva la importancia del botón y adapta el color a su sección. */
  tono?: TonoBoton;
  /** Deshabilitado sin estar cargando (por ejemplo, una opción de un caso de uso pendiente). */
  deshabilitado?: boolean;
}

/** Mientras carga, el indicador va del color del texto de la variante. */
function colorDelIndicador(variante: 'principal' | 'secundario' | 'peligro', primario: string): string {
  if (variante === 'principal') return colores.sobrePrimario;
  if (variante === 'peligro') return colores.error;
  return primario;
}

/** Botón redondeado. Mientras carga queda deshabilitado para no enviar dos veces (RNF-10). */
export function Boton({
  texto,
  alPresionar,
  cargando = false,
  variante = 'principal',
  tono = 'marca',
  deshabilitado = false,
}: PropsBoton) {
  const paleta = tonos[tono];
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
        esPrincipal ? { backgroundColor: paleta.primario } : { borderColor: paleta.primario },
        esPeligro ? estilos.peligro : null,
        pressed && esPrincipal ? { backgroundColor: paleta.fuerte } : null,
        inactivo ? estilos.deshabilitado : null,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={colorDelIndicador(variante, paleta.primario)} />
      ) : (
        <Text
          style={[
            estilos.texto,
            esPrincipal ? estilos.textoPrincipal : estilos.textoSecundario,
            !esPrincipal ? { color: paleta.primario } : null,
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
  secundario: { backgroundColor: colores.superficie, borderWidth: 1, borderColor: colores.primario },
  peligro: { borderColor: colores.error },
  deshabilitado: { opacity: OPACIDAD_DESHABILITADO },
  texto: { fontFamily: fuentes.texto, fontSize: 16, fontWeight: '700' },
  textoPrincipal: { color: colores.sobrePrimario },
  textoSecundario: { color: colores.primario, fontWeight: '700', fontSize: 15 },
  textoPeligro: { color: colores.error },
});
