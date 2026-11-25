import type { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colores, fuentes } from '../comun/tema';

interface PropsCampo extends TextInputProps {
  etiqueta: string;
  error?: string;
  tonoError?: 'error' | 'advertencia';
  /** Control a la derecha del campo, en la misma línea (por ejemplo, un botón para quitarlo). */
  accesorio?: ReactNode;
}

/** Campo de formulario con etiqueta y mensaje de error. */
export function Campo({ etiqueta, error, tonoError = 'error', style, accesorio, ...propsInput }: PropsCampo) {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <View style={estilos.fila}>
        <TextInput
          accessibilityLabel={etiqueta}
          placeholderTextColor={colores.textoSuave}
          style={[
            estilos.input,
            error ? (tonoError === 'advertencia' ? estilos.inputConAdvertencia : estilos.inputConError) : null,
            style,
          ]}
          {...propsInput}
        />
        {accesorio}
      </View>
      {error ? <Text style={[estilos.error, tonoError === 'advertencia' ? estilos.textoAdvertencia : null]}>{error}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: 6 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  etiqueta: { fontFamily: fuentes.texto, fontSize: 14, fontWeight: '600', color: colores.texto },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: fuentes.texto,
    backgroundColor: colores.superficie,
    color: colores.texto,
  },
  inputConAdvertencia: { borderColor: colores.acento },
  textoAdvertencia: { color: colores.advertencia },
  inputConError: { borderColor: colores.error },
  error: { fontFamily: fuentes.texto, fontSize: 13, color: colores.error },
});
