import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { router, usePreventRemove } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { crearActividad, opcionesActividad, type DatosCrearActividad, type OpcionesActividad } from '../api/actividades';
import { ErrorApi } from '../api/cliente';
import { aCentavos, mostrarImporte, nuevaClave, resultadoIncierto } from '../comun/formularioActividad';
import { colores, fuentes } from '../comun/tema';
import { Campo } from './Campo';
import { Boton } from './Boton';
import { SelectorUbicacion } from './SelectorUbicacion';
import { SelectorFechaHoraActividad } from './SelectorFechaHoraActividad';
import { useSesion } from '../sesion/SesionContexto';
import { useFormularioActividad } from '../hooks/useFormularioActividad';

/**
 * CU10 mobile. Conserva el formulario y la intención de alta hasta conocer su resultado.
 * Al confirmarse el alta se abre el detalle de la actividad creada (CU10 FP paso 11 → CU09).
 */
export function FormularioActividad() {
  const margenesSeguros = useSafeAreaInsets();
  const { sesion } = useSesion();
  const [opciones, setOpciones] = useState<OpcionesActividad | null>(null);
  const [error, setError] = useState('');
  const { formulario, campos, cambiar, visitar, validar, registrarErrores } = useFormularioActividad(
    opciones?.maximoParticipantes,
    opciones?.mapasDisponibles === false ? opciones.destinoPorDefecto : undefined,
  );
  const [enviando, setEnviando] = useState(false);
  const [pendiente, setPendiente] = useState(false);
  const [recarga, setRecarga] = useState(0);
  const intento = useRef<{ datos: DatosCrearActividad; clave: string } | null>(null);
  const envioEnCurso = useRef(false);
  const contenidoFormulario = useRef<ComponentRef<typeof ScrollView>>(null);
  const sinMapas = useCallback(() => setOpciones((actual) => (actual ? { ...actual, mapasDisponibles: false } : actual)), []);
  const [permitirSalida, setPermitirSalida] = useState(false);
  useEffect(() => {
    let vigente = true;
    opcionesActividad()
      .then((datos) => {
        if (vigente) {
          setOpciones(datos);
          setError('');
        }
      })
      .catch((fallo: unknown) => {
        if (vigente) setError(fallo instanceof Error ? fallo.message : 'No pudimos cargar el formulario.');
      });
    return () => {
      vigente = false;
    };
  }, [recarga]);
  const desactivarConfirmacionDeSalida = usePreventRemove(!permitirSalida && sesion !== null, ({ repeat }) => {
    if (enviando || pendiente) {
      Alert.alert('Confirmación pendiente', 'Reintentá para conocer el resultado antes de salir.');
      return;
    }
    Alert.alert('Cancelar creación', '¿Querés descartar los datos de la actividad?', [
      { text: 'Seguir editando', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => {
          setPermitirSalida(true);
          repeat();
        },
      },
    ]);
  });

  async function enviar() {
    if (envioEnCurso.current || !opciones) return;
    setError('');
    try {
      if (!pendiente) intento.current = { datos: validar(), clave: nuevaClave() };
      if (!intento.current) return;
      envioEnCurso.current = true;
      setEnviando(true);
      const resultado = await crearActividad(intento.current.datos, intento.current.clave);
      // La protección contra salir se apaga antes de navegar: el estado recién se aplica en el próximo render
      setPermitirSalida(true);
      desactivarConfirmacionDeSalida();
      // replace: con "Atrás" desde el detalle no se regresa a un formulario ya enviado.
      // Se nombra la sección (CU39): crear una actividad se abre desde Explorar y el detalle se muestra ahí.
      router.replace({
        pathname: '/(explorar)/actividades/[id]',
        params: { id: resultado.id, creada: 'si', destinoProvisional: resultado.destinoProvisional ? 'si' : 'no' },
      });
    } catch (fallo) {
      const incierto = fallo instanceof ErrorApi && resultadoIncierto(fallo);
      setPendiente(incierto);
      if (!incierto) intento.current = null;
      if (fallo instanceof ErrorApi) {
        registrarErrores(fallo.campos ?? {});
        if (fallo.estado === 503 && fallo.codigo.startsWith('MAPAS_')) sinMapas();
      }
      contenidoFormulario.current?.scrollTo({ y: 0, animated: true });
      setError(
        incierto
          ? 'No pudimos confirmar el alta. Reintentá para recuperar el resultado sin crear otra actividad.'
          : fallo instanceof Error
            ? fallo.message
            : 'No pudimos crear la actividad.',
      );
    } finally {
      envioEnCurso.current = false;
      setEnviando(false);
    }
  }
  function cancelar() {
    if (!enviando && !pendiente) router.back();
  }
  function mostrarCampoEnfocado() {
    const campo = TextInput.State.currentlyFocusedInput();
    if (campo && Keyboard.isVisible()) {
      // H02: el cursor puede estar visible aunque la parte inferior de un campo multilínea quede tapada.
      contenidoFormulario.current?.scrollResponderScrollNativeHandleToKeyboard(campo, margenesSeguros.top + 16, true);
    }
  }
  const bloqueado = enviando || pendiente;
  const cantidad = 1 + formulario.invitados.length;
  let total: number | null = null;
  try {
    total = aCentavos(formulario.costo);
  } catch {
    /* La validación se informa al confirmar. */
  }
  return (
    <SafeAreaView style={estilos.pantalla}>
      <KeyboardAvoidingView style={estilos.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          ref={contenidoFormulario}
          contentContainerStyle={estilos.contenido}
          keyboardShouldPersistTaps="handled"
          onLayout={mostrarCampoEnfocado}
        >
          <View style={estilos.encabezado}>
            <Pressable accessibilityRole="button" accessibilityLabel="Cancelar creación" disabled={bloqueado} onPress={cancelar}>
              <Text style={estilos.cerrar}>×</Text>
            </Pressable>
            <Text style={estilos.titulo}>Nueva actividad</Text>
          </View>
          {error ? (
            <View style={estilos.aviso} accessibilityLiveRegion="assertive">
              <Text style={estilos.error}>{error}</Text>
              {Object.entries(campos).map(([campo, mensaje]) => (
                <Text key={campo} style={estilos.error}>
                  {mensaje}
                </Text>
              ))}
            </View>
          ) : null}
          {!opciones ? (
            <View style={estilos.seccion}>
              {!error && <ActivityIndicator color={colores.primario} />}
              <Text style={estilos.texto}>{error ? 'El formulario no está disponible.' : 'Cargando opciones…'}</Text>
              {error ? <Boton texto="Reintentar" alPresionar={() => setRecarga((actual) => actual + 1)} /> : null}
            </View>
          ) : (
            <>
              <Campo
                etiqueta="Nombre de la actividad"
                maxLength={100}
                value={formulario.nombre}
                error={campos.nombre}
                editable={!bloqueado}
                onBlur={() => visitar('nombre')}
                onChangeText={(v) => cambiar('nombre', v)}
              />
              <Text style={estilos.etiqueta}>Deporte</Text>
              {campos.deporteId && <Text style={estilos.error}>{campos.deporteId}</Text>}
              <View style={estilos.opciones}>
                {opciones.deportes.map((deporte) => (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: formulario.deporteId === String(deporte.id) }}
                    disabled={bloqueado}
                    key={deporte.id}
                    style={[estilos.opcion, formulario.deporteId === String(deporte.id) && estilos.elegida]}
                    onPress={() => {
                      cambiar('deporteId', String(deporte.id));
                      visitar('deporteId');
                    }}
                  >
                    <Text style={estilos.texto}>{deporte.nombre}</Text>
                  </Pressable>
                ))}
              </View>
              <Campo
                etiqueta={`Cupo máximo (2 a ${opciones.maximoParticipantes})`}
                keyboardType="number-pad"
                value={formulario.cupoMaximo}
                error={campos.cupoMaximo}
                editable={!bloqueado}
                onBlur={() => visitar('cupoMaximo')}
                onChangeText={(v) => cambiar('cupoMaximo', v)}
              />
              <SelectorFechaHoraActividad
                fecha={formulario.fecha}
                hora={formulario.hora}
                errorFecha={campos.fecha || campos.fechaHoraInicio}
                errorHora={campos.hora}
                deshabilitado={bloqueado}
                alCambiar={(campo, valor) => cambiar(campo, valor)}
                alVisitar={(campo) => visitar(campo)}
              />
              <Text style={estilos.etiqueta}>Nivel de dificultad</Text>
              <View style={estilos.opciones}>
                {opciones.niveles.map((nivel) => (
                  <Pressable
                    key={nivel}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: formulario.nivel === nivel }}
                    disabled={bloqueado}
                    style={[estilos.opcion, formulario.nivel === nivel && estilos.elegida]}
                    onPress={() => cambiar('nivel', nivel)}
                  >
                    <Text style={estilos.texto}>{nivel}</Text>
                  </Pressable>
                ))}
              </View>
              <Campo
                etiqueta="Descripción"
                onFocus={mostrarCampoEnfocado}
                multiline
                maxLength={1000}
                style={estilos.descripcion}
                value={formulario.descripcion}
                error={campos.descripcion}
                editable={!bloqueado}
                onBlur={() => visitar('descripcion')}
                onChangeText={(v) => cambiar('descripcion', v)}
              />
              <View style={estilos.seccion}>
                <Text style={estilos.subtitulo}>Traslado</Text>
                <View style={estilos.interruptor}>
                  <Text style={estilos.texto}>Tengo vehículo propio</Text>
                  <Switch
                    accessibilityLabel="Tengo vehículo propio"
                    disabled={bloqueado}
                    value={formulario.tieneVehiculo}
                    onValueChange={(v) => cambiar('tieneVehiculo', v)}
                  />
                </View>
                {formulario.tieneVehiculo && (
                  <Campo
                    etiqueta="Personas que puedo llevar al destino (incluyéndome a mí mismo)"
                    keyboardType="number-pad"
                    value={formulario.lugaresVehiculo}
                    error={campos.lugaresVehiculo}
                    editable={!bloqueado}
                    onBlur={() => visitar('lugaresVehiculo')}
                    onChangeText={(v) => cambiar('lugaresVehiculo', v)}
                  />
                )}
                <View style={estilos.interruptor}>
                  <Text style={estilos.texto}>Buscando traslado</Text>
                  <Switch
                    accessibilityLabel="Buscando traslado"
                    disabled={bloqueado}
                    value={formulario.requiereVehiculo}
                    onValueChange={(v) => cambiar('requiereVehiculo', v)}
                  />
                </View>
                <Campo
                  etiqueta="Costo total estimado (opcional)"
                  error={campos.costoEstimadoCentavos}
                  keyboardType="decimal-pad"
                  placeholder="0,00"
                  value={formulario.costo}
                  editable={!bloqueado}
                  onBlur={() => visitar('costo')}
                  onChangeText={(v) => cambiar('costo', v)}
                />
                {total !== null && (
                  <Text style={estilos.nota}>
                    Con {cantidad} participantes actuales: aproximadamente {mostrarImporte(Math.round(total / cantidad))} por
                    persona. El total se divide entre los participantes y el importe cambia si se suman más.
                  </Text>
                )}
              </View>
              <View style={estilos.seccion}>
                <Text style={estilos.subtitulo}>Recorrido</Text>
                {!opciones.mapasDisponibles && (
                  <Text style={estilos.error}>
                    La búsqueda de ubicaciones no está disponible por el momento. Vamos a usar una ubicación por defecto como
                    destino. Como organizador, tenés que editar esa ubicación más adelante. El origen es opcional si no tenés
                    vehículo propio.
                  </Text>
                )}
                {!opciones.mapasDisponibles && (
                  <Boton
                    texto="Reintentar Google Maps"
                    variante="secundario"
                    deshabilitado={bloqueado}
                    alPresionar={() => setOpciones((actual) => (actual ? { ...actual, mapasDisponibles: true } : actual))}
                  />
                )}
                {formulario.origen && (
                  <Boton
                    texto="Quitar origen"
                    variante="secundario"
                    deshabilitado={bloqueado}
                    alPresionar={() => cambiar('origen', null)}
                  />
                )}
                <SelectorUbicacion
                  key={'origen:' + JSON.stringify(formulario.origen)}
                  centroInicial={opciones.destinoPorDefecto}
                  etiqueta={
                    formulario.tieneVehiculo
                      ? 'Punto de encuentro / origen (obligatorio)'
                      : 'Punto de encuentro / origen (opcional)'
                  }
                  valor={formulario.origen}
                  error={campos.origenPlaceId}
                  alNoDisponible={sinMapas}
                  alCambiar={(v) => cambiar('origen', v)}
                  deshabilitado={bloqueado || !opciones.mapasDisponibles}
                />
                <SelectorUbicacion
                  key={'destino:' + JSON.stringify(formulario.destino)}
                  centroInicial={opciones.destinoPorDefecto}
                  etiqueta="Destino"
                  error={campos.destinoPlaceId}
                  valor={formulario.destino}
                  alNoDisponible={sinMapas}
                  alCambiar={(v) => cambiar('destino', v)}
                  deshabilitado={bloqueado || !opciones.mapasDisponibles}
                />
                <View style={estilos.pronostico}>
                  <Text style={estilos.etiqueta}>Pronóstico para la actividad</Text>
                  <Text style={estilos.texto}>{opciones.pronostico.mensaje}</Text>
                </View>
              </View>
              <View style={estilos.seccion}>
                <Text style={estilos.subtitulo}>Participantes externos</Text>
                <Text style={estilos.texto}>
                  Vos también ocupás un lugar. Ocupados: {cantidad} de {formulario.cupoMaximo || '—'}.
                </Text>
                {formulario.invitados.map((nombre, indice) => (
                  <View key={indice} style={estilos.seccion}>
                    <Campo
                      etiqueta={`Nombre del participante externo ${indice + 1}`}
                      error={campos[`invitados.${indice}`]}
                      onBlur={() => visitar(`invitados.${indice}`)}
                      maxLength={100}
                      value={nombre}
                      editable={!bloqueado}
                      onChangeText={(v) =>
                        cambiar(
                          'invitados',
                          formulario.invitados.map((n, i) => (i === indice ? v : n)),
                        )
                      }
                    />
                    <Boton
                      texto={`Quitar participante externo ${indice + 1}`}
                      variante="secundario"
                      deshabilitado={bloqueado}
                      alPresionar={() =>
                        cambiar(
                          'invitados',
                          formulario.invitados.filter((_, i) => i !== indice),
                        )
                      }
                    />
                  </View>
                ))}
                <Boton
                  texto="Agregar participante externo"
                  variante="secundario"
                  deshabilitado={bloqueado || cantidad >= Number(formulario.cupoMaximo)}
                  alPresionar={() => cambiar('invitados', [...formulario.invitados, ''])}
                />
              </View>
              {campos.invitados && <Text style={estilos.error}>{campos.invitados}</Text>}
              <Boton
                texto={pendiente ? 'Reintentar confirmación' : 'Crear actividad'}
                cargando={enviando}
                alPresionar={() => {
                  void enviar();
                }}
              />
              <Boton texto="Cancelar" variante="secundario" deshabilitado={bloqueado} alPresionar={cancelar} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  flex: { flex: 1 },
  contenido: { padding: 20, gap: 18, paddingBottom: 40 },
  encabezado: { flexDirection: 'row', gap: 18, alignItems: 'center' },
  cerrar: { fontSize: 36, color: colores.texto, paddingHorizontal: 8 },
  titulo: { fontFamily: fuentes.titulos, fontSize: 28, fontWeight: '800', color: colores.texto },
  subtitulo: { fontFamily: fuentes.titulos, fontSize: 22, fontWeight: '700', color: colores.texto },
  texto: { fontFamily: fuentes.texto, fontSize: 16, color: colores.texto },
  etiqueta: { fontFamily: fuentes.texto, fontSize: 14, fontWeight: '600', color: colores.texto },
  nota: { fontFamily: fuentes.texto, fontSize: 14, lineHeight: 20, color: colores.textoSuave },
  fila: { flexDirection: 'row', gap: 12 },
  seccion: { gap: 12 },
  descripcion: { height: 110, textAlignVertical: 'top', paddingTop: 12 },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcion: { backgroundColor: colores.superficie, padding: 12, borderWidth: 1, borderColor: colores.borde, borderRadius: 14 },
  elegida: { backgroundColor: colores.primarioClaro, borderColor: colores.primario },
  interruptor: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aviso: { backgroundColor: colores.errorFondo, padding: 14, borderRadius: 14, gap: 6 },
  error: { color: colores.error, fontFamily: fuentes.texto, fontSize: 15 },
  pronostico: { backgroundColor: colores.primarioClaro, padding: 16, borderRadius: 16, gap: 8 },
});
