import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colores, fuentes } from '../comun/tema';

interface PropsCampo extends TextInputProps {
  etiqueta: string;
  error?: string;
}

/** Campo de formulario con etiqueta y mensaje de error. */
export function Campo({ etiqueta, error, style, ...propsInput }: PropsCampo) {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <TextInput
        accessibilityLabel={etiqueta}
        placeholderTextColor={colores.textoSuave}
        style={[estilos.input, error ? estilos.inputConError : null, style]}
        {...propsInput}
      />
      {error ? <Text style={estilos.error}>{error}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: 6 },
  etiqueta: { fontFamily: fuentes.texto, fontSize: 14, fontWeight: '600', color: colores.texto },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: fuentes.texto,
    backgroundColor: colores.blanco,
    color: colores.texto,
  },
  inputConError: { borderColor: colores.error },
  error: { fontFamily: fuentes.texto, fontSize: 13, color: colores.error },
});
