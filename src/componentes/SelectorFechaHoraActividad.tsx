import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Keyboard, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { fechaHoraUruguay, valorDelSelector, ZONA_HORARIA_ACTIVIDAD } from '../comun/fechaHoraActividad';
import { colores, fuentes } from '../comun/tema';

type CampoFechaHora = 'fecha' | 'hora';
interface Props {
  fecha: string;
  hora: string;
  errorFecha?: string;
  errorHora?: string;
  deshabilitado?: boolean;
  alCambiar: (campo: CampoFechaHora, valor: string) => void;
  alVisitar: (campo: CampoFechaHora) => void;
}
interface Seleccion {
  campo: CampoFechaHora;
  valor: Date;
  minimo: Date;
}

/** CU10: calendario/reloj nativos. Solo confirmar modifica el formulario; cancelar conserva lo escrito. */
export function SelectorFechaHoraActividad({ fecha, hora, errorFecha, errorHora, deshabilitado, alCambiar, alVisitar }: Props) {
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null);

  function abrir(campo: CampoFechaHora) {
    if (deshabilitado) return;
    Keyboard.dismiss();
    const ahora = new Date();
    const minimo = new Date(`${fechaHoraUruguay(ahora).fecha}T00:00:00-03:00`);
    const valor = valorDelSelector(fecha, hora, ahora);
    setSeleccion({ campo, minimo, valor: campo === 'fecha' && valor < minimo ? minimo : valor });
  }
  function cancelar() {
    if (seleccion) alVisitar(seleccion.campo);
    setSeleccion(null);
  }
  function confirmar(valor: Date) {
    if (!seleccion || deshabilitado) return;
    const partes = fechaHoraUruguay(valor);
    alCambiar(seleccion.campo, partes[seleccion.campo]);
    alVisitar(seleccion.campo);
    setSeleccion(null);
  }
  const campos = [
    { campo: 'fecha' as const, etiqueta: 'Fecha', valor: fecha ? fecha.split('-').reverse().join('/') : '', error: errorFecha },
    { campo: 'hora' as const, etiqueta: 'Hora (Uruguay)', valor: hora, error: errorHora },
  ];
  return (
    <View style={estilos.fila}>
      {campos.map(({ campo, etiqueta, valor, error }) => (
        <View key={campo} style={estilos.campo}>
          <Text style={estilos.etiqueta}>{etiqueta}</Text>
          <Pressable
            testID={`selector-${campo}-actividad`}
            accessibilityRole="button"
            accessibilityLabel={etiqueta}
            accessibilityValue={{ text: valor || `Seleccionar ${campo}` }}
            accessibilityHint={`Abre el selector de ${campo}. Horario de Uruguay.`}
            accessibilityState={{ disabled: Boolean(deshabilitado) }}
            disabled={deshabilitado}
            onPress={() => abrir(campo)}
            style={[estilos.selector, error ? estilos.conError : null, deshabilitado ? estilos.deshabilitado : null]}
          >
            <Text style={[estilos.valor, !valor && estilos.placeholder]}>{valor || `Seleccionar ${campo}`}</Text>
            <Text style={estilos.indicador} accessibilityElementsHidden importantForAccessibility="no">
              ▾
            </Text>
          </Pressable>
          {error && (
            <Text style={estilos.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          )}
        </View>
      ))}
      {seleccion && Platform.OS === 'android' && (
        <DateTimePicker
          value={seleccion.valor}
          mode={seleccion.campo === 'fecha' ? 'date' : 'time'}
          display={seleccion.campo === 'fecha' ? 'calendar' : 'spinner'}
          minimumDate={seleccion.campo === 'fecha' ? seleccion.minimo : undefined}
          timeZoneName={ZONA_HORARIA_ACTIVIDAD}
          is24Hour
          positiveButton={{ label: 'Aceptar' }}
          negativeButton={{ label: 'Cancelar' }}
          onValueChange={(_evento, valor) => confirmar(valor)}
          onDismiss={cancelar}
        />
      )}
      {seleccion && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide" onRequestClose={cancelar}>
          <View style={estilos.fondoModal}>
            <View style={estilos.modal} accessibilityViewIsModal>
              <Text style={estilos.titulo}>Seleccionar {seleccion.campo} · Uruguay</Text>
              <DateTimePicker
                value={seleccion.valor}
                mode={seleccion.campo === 'fecha' ? 'date' : 'time'}
                display="spinner"
                locale="es-UY"
                timeZoneName={ZONA_HORARIA_ACTIVIDAD}
                minimumDate={seleccion.campo === 'fecha' ? seleccion.minimo : undefined}
                themeVariant="light"
                onValueChange={(_evento, valor) => setSeleccion((actual) => (actual ? { ...actual, valor } : null))}
              />
              <View style={estilos.acciones}>
                <Pressable accessibilityRole="button" onPress={cancelar} style={estilos.accion}>
                  <Text style={estilos.valor}>Cancelar</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => confirmar(seleccion.valor)} style={estilos.accion}>
                  <Text style={estilos.indicador}>Aceptar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', gap: 12 },
  campo: { flex: 1, gap: 6 },
  etiqueta: { fontFamily: fuentes.texto, fontSize: 14, fontWeight: '600', color: colores.texto },
  selector: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.blanco,
  },
  valor: { flexShrink: 1, fontFamily: fuentes.texto, fontSize: 16, color: colores.texto },
  placeholder: { color: colores.textoSuave },
  indicador: { color: colores.primario, fontSize: 18, fontWeight: '600' },
  conError: { borderColor: colores.error },
  deshabilitado: { opacity: 0.5 },
  error: { fontFamily: fuentes.texto, fontSize: 13, color: colores.error },
  fondoModal: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,37,55,0.4)' },
  modal: { backgroundColor: colores.blanco, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  titulo: { fontFamily: fuentes.titulos, fontSize: 20, color: colores.texto },
  acciones: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20 },
  accion: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12 },
});
