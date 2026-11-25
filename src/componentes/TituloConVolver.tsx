import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colores, fuentes, OPACIDAD_DESHABILITADO } from '../comun/tema';

interface PropsBotonVolver {
  alVolver: () => void;
  /** Lo que lee el lector de pantalla, por ejemplo "Volver a gastos". */
  etiqueta?: string;
  deshabilitado?: boolean;
}

/** Flecha para volver: círculo de 44×44, igual que el "‹" del detalle de la actividad. */
export function BotonVolver({ alVolver, etiqueta = 'Volver', deshabilitado = false }: PropsBotonVolver) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: deshabilitado }}
      disabled={deshabilitado}
      onPress={alVolver}
      style={({ pressed }) => [estilos.boton, pressed ? estilos.presionado : null, deshabilitado ? estilos.deshabilitado : null]}
    >
      <Text style={estilos.flecha} accessible={false}>
        ‹
      </Text>
    </Pressable>
  );
}

interface PropsTitulo extends PropsBotonVolver {
  titulo: string;
}

/** Título de pantalla con la flecha para volver a su izquierda. */
export function TituloConVolver({ titulo, ...volver }: PropsTitulo) {
  return (
    <View style={estilos.fila}>
      <BotonVolver {...volver} />
      <Text style={estilos.titulo} accessibilityRole="header">
        {titulo}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  boton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presionado: { backgroundColor: colores.primarioClaro, borderColor: colores.primario },
  deshabilitado: { opacity: OPACIDAD_DESHABILITADO },
  flecha: { fontSize: 22, lineHeight: 26, fontWeight: '700', color: colores.texto },
  titulo: { flex: 1, fontFamily: fuentes.titulos, fontSize: 26, color: colores.texto },
});
