import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorApi } from '../api/cliente';
import { unirseAActividad, type Coordenadas } from '../api/actividades';
import { incorporaciones } from '../comun/eventosActividad';
import {
  aDatosUnirse,
  AVISO_PUNTO_DE_PARTIDA,
  clasificarErrorAlUnirse,
  formularioUnirseInicial,
  lugaresParaInvitados,
  MENSAJE_UNIDO,
  textoLugaresParaInvitados,
  validarFormularioUnirse,
  type CamposConError,
  type FormularioUnirse as DatosDelFormulario,
} from '../comun/formularioUnirse';
import { colores, fuentes } from '../comun/tema';
import { Boton } from './Boton';
import { Campo } from './Campo';
import { SelectorUbicacion } from './SelectorUbicacion';

/** Lo que el detalle le pasa a esta pantalla: no hace falta volver a pedir la actividad. */
export interface ActividadParaUnirse {
  id: string;
  nombre: string;
  cuposLibres: number;
  /** Centro inicial del mapa del punto de partida. */
  destino: Coordenadas;
}

/**
 * M – CU11 FP pasos 5 y 6: vehículo, punto de partida e invitados externos. La usa app/(app)/actividades/[id]/unirse.tsx.
 * Si el envío falla, el formulario queda con lo que el usuario escribió.
 */
export function FormularioUnirse({ actividad }: { actividad: ActividadParaUnirse }) {
  const [formulario, setFormulario] = useState<DatosDelFormulario>(formularioUnirseInicial);
  const [campos, setCampos] = useState<CamposConError>({});
  const [falla, setFalla] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mapasDisponibles, setMapasDisponibles] = useState(true);

  function cambiar<Campo extends keyof DatosDelFormulario>(campo: Campo, valor: DatosDelFormulario[Campo]) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function cambiarInvitado(indice: number, nombre: string) {
    cambiar(
      'invitados',
      formulario.invitados.map((actual, posicion) => (posicion === indice ? nombre : actual)),
    );
  }

  function quitarInvitado(indice: number) {
    cambiar(
      'invitados',
      formulario.invitados.filter((_, posicion) => posicion !== indice),
    );
  }

  /** CU11 A1: el usuario decide no continuar; sigue fuera de la actividad. */
  function cancelar() {
    if (!enviando) router.back();
  }

  /** Avisa al detalle (suscripto a incorporaciones) y vuelve a él. */
  function terminar(tipo: 'unido' | 'sinLugar', mensaje: string) {
    incorporaciones.notificar({ actividadId: actividad.id, tipo, mensaje });
    router.back();
  }

  async function enviar() {
    const camposConError = validarFormularioUnirse(formulario);
    setCampos(camposConError);
    setFalla('');
    if (Object.keys(camposConError).length > 0) return;

    setEnviando(true);
    try {
      await unirseAActividad(actividad.id, aDatosUnirse(formulario));
      terminar('unido', MENSAJE_UNIDO); // FP paso 10
    } catch (error) {
      manejarError(error);
    } finally {
      setEnviando(false);
    }
  }

  function manejarError(error: unknown) {
    const resultado = clasificarErrorAlUnirse(error instanceof ErrorApi ? error : null);
    if (resultado.tipo === 'unido') terminar('unido', MENSAJE_UNIDO);
    if (resultado.tipo === 'sinLugar') terminar('sinLugar', resultado.mensaje);
    if (resultado.tipo === 'campos') setCampos(resultado.campos);
    if (resultado.tipo === 'falla') setFalla(resultado.mensaje);
  }

  const puedeAgregarInvitado = lugaresParaInvitados(actividad.cuposLibres, formulario.invitados.length) > 0;

  return (
    <SafeAreaView style={estilos.pantalla}>
      <KeyboardAvoidingView style={estilos.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
          <View style={estilos.encabezado}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
              disabled={enviando}
              onPress={cancelar}
              hitSlop={8}
            >
              <Text style={estilos.cerrar}>×</Text>
            </Pressable>
            <Text style={estilos.titulo} accessibilityRole="header">
              Unirme a {actividad.nombre}
            </Text>
          </View>

          <View style={estilos.seccion}>
            <Text style={estilos.subtitulo}>Traslado</Text>
            <View style={estilos.interruptor}>
              <Text style={estilos.texto}>Tengo vehículo propio</Text>
              <Switch
                accessibilityLabel="Tengo vehículo propio"
                disabled={enviando}
                value={formulario.tieneVehiculo}
                onValueChange={(valor) => cambiar('tieneVehiculo', valor)}
              />
            </View>
            {formulario.tieneVehiculo && (
              <Campo
                etiqueta="Personas que puedo llevar al destino (incluyéndome a mí mismo)"
                keyboardType="number-pad"
                value={formulario.lugaresVehiculo}
                error={campos.lugaresVehiculo}
                editable={!enviando}
                onChangeText={(valor) => cambiar('lugaresVehiculo', valor)}
              />
            )}
            {formulario.puntoPartida && (
              <Boton
                texto="Quitar punto de partida"
                variante="secundario"
                deshabilitado={enviando}
                alPresionar={() => cambiar('puntoPartida', null)}
              />
            )}
            <SelectorUbicacion
              key={'punto:' + JSON.stringify(formulario.puntoPartida)}
              etiqueta="Punto de partida (opcional)"
              centroInicial={actividad.destino}
              valor={formulario.puntoPartida}
              error={campos.puntoPartida}
              deshabilitado={!mapasDisponibles || enviando}
              alNoDisponible={() => setMapasDisponibles(false)}
              alCambiar={(valor) => cambiar('puntoPartida', valor)}
            />
            <Text style={estilos.nota}>{AVISO_PUNTO_DE_PARTIDA}</Text>
            {!mapasDisponibles && (
              <Text style={estilos.nota}>La búsqueda de lugares no está disponible. Podés unirte sin punto de partida.</Text>
            )}
          </View>

          <View style={estilos.seccion}>
            <Text style={estilos.subtitulo}>Invitados externos</Text>
            <Text style={estilos.nota}>{textoLugaresParaInvitados(actividad.cuposLibres, formulario.invitados.length)}</Text>
            {formulario.invitados.map((nombre, indice) => (
              <View key={indice} style={estilos.seccion}>
                <Campo
                  etiqueta={`Nombre del invitado ${indice + 1}`}
                  maxLength={100}
                  autoCapitalize="words"
                  value={nombre}
                  error={campos[`invitados.${indice}`]}
                  editable={!enviando}
                  onChangeText={(valor) => cambiarInvitado(indice, valor)}
                />
                <Boton
                  texto={`Quitar invitado ${indice + 1}`}
                  variante="secundario"
                  deshabilitado={enviando}
                  alPresionar={() => quitarInvitado(indice)}
                />
              </View>
            ))}
            <Boton
              texto="Agregar invitado"
              variante="secundario"
              deshabilitado={enviando || !puedeAgregarInvitado}
              alPresionar={() => cambiar('invitados', [...formulario.invitados, ''])}
            />
            {campos.invitados ? <Text style={estilos.error}>{campos.invitados}</Text> : null}
          </View>

          {falla ? (
            <View style={estilos.aviso} accessibilityLiveRegion="assertive">
              <Text style={estilos.error}>{falla}</Text>
            </View>
          ) : null}

          <Boton
            texto="Unirme"
            cargando={enviando}
            alPresionar={() => {
              void enviar();
            }}
          />
          <Boton texto="Cancelar" variante="secundario" deshabilitado={enviando} alPresionar={cancelar} />
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
  titulo: { flex: 1, fontFamily: fuentes.titulos, fontSize: 26, fontWeight: '800', color: colores.texto },
  subtitulo: { fontFamily: fuentes.titulos, fontSize: 22, fontWeight: '700', color: colores.texto },
  texto: { fontFamily: fuentes.texto, fontSize: 16, color: colores.texto },
  nota: { fontFamily: fuentes.texto, fontSize: 14, lineHeight: 20, color: colores.textoSuave },
  seccion: { gap: 12 },
  interruptor: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aviso: { backgroundColor: colores.errorFondo, padding: 14, borderRadius: 14, gap: 6 },
  error: { color: colores.error, fontFamily: fuentes.texto, fontSize: 15 },
});
