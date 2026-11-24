import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ErrorApi } from '../api/cliente';
import { guardarValoracion, type MiValoracion } from '../api/valoraciones';
import { colores, fuentes } from '../comun/tema';
import { armarValoracion, LARGO_MAXIMO_COMENTARIO, MENSAJES_VALORACION, PUNTAJES } from '../comun/valoraciones';
import { Boton } from './Boton';

interface PropsFormulario {
  actividadId: string;
  participante: { id: string; nombre: string };
  /** A2: si ya lo había valorado, el formulario arranca con esa valoración. */
  valoracionActual: MiValoracion | null;
  alGuardar: (valoracion: MiValoracion) => void;
  /** A1: cerrar sin guardar deja al participante como estaba (pendiente o con su valoración anterior). */
  alCerrar: () => void;
}

/**
 * CU21 FP pasos 4 a 10: formulario de valoración en un modal (puntaje obligatorio y comentario opcional, RN6).
 * Si falla, conserva lo ingresado para reintentar (ER1).
 */
export function FormularioDeValoracion({ actividadId, participante, valoracionActual, alGuardar, alCerrar }: PropsFormulario) {
  const [puntaje, setPuntaje] = useState<number | null>(valoracionActual?.puntaje ?? null);
  const [comentario, setComentario] = useState(valoracionActual?.comentario ?? '');
  const [errorPuntaje, setErrorPuntaje] = useState<string | null>(null);
  const [errorAlGuardar, setErrorAlGuardar] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function enviar() {
    const valoracion = armarValoracion(puntaje, comentario);
    if (valoracion === null) {
      setErrorPuntaje(MENSAJES_VALORACION.sinPuntaje); // E1
      return;
    }
    setGuardando(true);
    setErrorAlGuardar(null);
    try {
      alGuardar(await guardarValoracion(actividadId, participante.id, valoracion));
    } catch (error) {
      setErrorAlGuardar(mensajeDeError(error));
      setGuardando(false);
    }
  }

  function elegirPuntaje(elegido: number) {
    setPuntaje(elegido);
    setErrorPuntaje(null);
  }

  function cerrar() {
    if (!guardando) alCerrar();
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={cerrar}>
      <KeyboardAvoidingView style={estilos.fondo} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={estilos.tarjeta}>
          <Text style={estilos.titulo} accessibilityRole="header">
            Valorar a {participante.nombre}
          </Text>

          <Text style={estilos.etiqueta}>Puntaje</Text>
          <View style={estilos.estrellas} accessibilityRole="radiogroup" accessibilityLabel="Puntaje">
            {PUNTAJES.map((opcion) => {
              const llena = puntaje !== null && opcion <= puntaje;
              return (
                <Pressable
                  key={opcion}
                  accessibilityRole="radio"
                  accessibilityLabel={`${opcion} de 5 estrellas`}
                  accessibilityState={{ checked: puntaje === opcion }}
                  onPress={() => elegirPuntaje(opcion)}
                  style={({ pressed }) => [estilos.estrella, pressed ? estilos.estrellaPresionada : null]}
                >
                  <Text style={[estilos.dibujoEstrella, llena ? estilos.estrellaLlena : null]}>{llena ? '★' : '☆'}</Text>
                </Pressable>
              );
            })}
          </View>
          {errorPuntaje ? (
            <Text style={estilos.errorCampo} accessibilityLiveRegion="polite">
              {errorPuntaje}
            </Text>
          ) : null}

          <Text style={estilos.etiqueta}>Comentario (opcional)</Text>
          <TextInput
            accessibilityLabel="Comentario (opcional)"
            style={estilos.comentario}
            multiline
            maxLength={LARGO_MAXIMO_COMENTARIO}
            value={comentario}
            onChangeText={setComentario}
            textAlignVertical="top"
          />

          {errorAlGuardar ? (
            <View style={estilos.aviso} accessibilityRole="alert">
              <Text style={estilos.textoAviso}>{errorAlGuardar}</Text>
            </View>
          ) : null}

          <View style={estilos.acciones}>
            <Boton texto="Guardar valoración" alPresionar={() => void enviar()} cargando={guardando} />
            <Boton texto="Cancelar" variante="secundario" alPresionar={cerrar} deshabilitado={guardando} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** ER1 si es una falla técnica; si la API rechazó la valoración (E2, RN1), su propio mensaje. */
function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorApi && !error.esFallaTecnica()) {
    return error.message;
  }
  return MENSAJES_VALORACION.errorAlGuardar;
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.velo, justifyContent: 'center', padding: 20 },
  tarjeta: { backgroundColor: colores.superficie, borderRadius: 20, padding: 20, gap: 10 },
  titulo: { fontFamily: fuentes.titulos, fontWeight: '700', fontSize: 20, color: colores.texto, marginBottom: 6 },
  etiqueta: { fontFamily: fuentes.texto, fontSize: 14, fontWeight: '600', color: colores.texto },
  estrellas: { flexDirection: 'row', gap: 4 },
  // Área táctil de 44x44
  estrella: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  estrellaPresionada: { backgroundColor: colores.primarioClaro },
  dibujoEstrella: { fontSize: 30, lineHeight: 36, color: colores.textoSuave },
  estrellaLlena: { color: colores.acento },
  errorCampo: { fontFamily: fuentes.texto, fontSize: 13, color: colores.error },
  comentario: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fuentes.texto,
    fontSize: 16,
    color: colores.texto,
    backgroundColor: colores.superficie,
  },
  aviso: { backgroundColor: colores.errorFondo, borderRadius: 14, padding: 14 },
  textoAviso: { fontFamily: fuentes.texto, fontSize: 14, lineHeight: 20, color: colores.error },
  acciones: { gap: 10, marginTop: 6 },
});
