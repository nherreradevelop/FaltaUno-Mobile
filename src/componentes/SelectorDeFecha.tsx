import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { aFechaIso, aFechaLocal, formatearFechaCorta } from '../comun/filtrosDeBusqueda';
import { colores, fuentes } from '../comun/tema';

interface PropsSelectorDeFecha {
  etiqueta: string;
  /** AAAA-MM-DD, o '' si no hay fecha elegida. */
  valor: string;
  alCambiar: (valor: string) => void;
  /** AAAA-MM-DD: no se puede elegir una fecha anterior (por ejemplo, "hasta" no puede ser antes de "desde"). */
  minimo?: string;
  error?: string;
}

/**
 * CU08 A2: campo de fecha que abre el selector nativo del sistema.
 * En Android el selector es un diálogo que se cierra solo; en iOS se muestra un calendario debajo del campo.
 */
export function SelectorDeFecha({ etiqueta, valor, alCambiar, minimo, error }: PropsSelectorDeFecha) {
  const [abierto, setAbierto] = useState(false);
  const fechaMostrada = valor ? aFechaLocal(valor) : minimo ? aFechaLocal(minimo) : new Date();

  function alElegir(evento: DateTimePickerEvent, fecha?: Date) {
    // En Android el diálogo se cierra al elegir o al cancelar; en iOS el calendario queda abierto hasta tocar "Listo"
    if (Platform.OS === 'android') {
      setAbierto(false);
    }
    if (evento.type === 'set' && fecha) {
      alCambiar(aFechaIso(fecha));
    }
  }

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <View style={[estilos.campo, error ? estilos.campoConError : null]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${etiqueta}: ${valor ? formatearFechaCorta(valor) : 'sin fecha'}`}
          onPress={() => setAbierto((anterior) => !anterior)}
          style={estilos.areaTocable}
        >
          <Text style={valor ? estilos.texto : estilos.textoVacio}>{valor ? formatearFechaCorta(valor) : 'Elegir fecha'}</Text>
        </Pressable>
        {valor ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Quitar la fecha ${etiqueta.toLowerCase()}`}
            onPress={() => alCambiar('')}
            hitSlop={10}
          >
            <Text style={estilos.quitar}>✕</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={estilos.error}>{error}</Text> : null}

      {abierto ? (
        <View>
          <DateTimePicker
            mode="date"
            value={fechaMostrada}
            minimumDate={minimo ? aFechaLocal(minimo) : undefined}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            locale="es-UY"
            onChange={alElegir}
          />
          {Platform.OS === 'ios' ? (
            <Pressable accessibilityRole="button" onPress={() => setAbierto(false)} style={estilos.listo}>
              <Text style={estilos.textoListo}>Listo</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: 6 },
  etiqueta: { fontFamily: fuentes.texto, fontSize: 14, fontWeight: '600', color: colores.texto },
  campo: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: colores.blanco,
  },
  campoConError: { borderColor: colores.error },
  areaTocable: { flex: 1, height: '100%', justifyContent: 'center' },
  texto: { fontFamily: fuentes.texto, fontSize: 16, color: colores.texto },
  textoVacio: { fontFamily: fuentes.texto, fontSize: 16, color: colores.textoSuave },
  quitar: { fontSize: 16, color: colores.textoSuave },
  error: { fontFamily: fuentes.texto, fontSize: 13, color: colores.error },
  listo: { alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 4 },
  textoListo: { fontFamily: fuentes.texto, fontSize: 16, fontWeight: '700', color: colores.primario },
});
