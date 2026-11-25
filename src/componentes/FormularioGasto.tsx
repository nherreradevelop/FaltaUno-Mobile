import { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import type { DatosGasto, Gasto, PersonaGasto } from '../api/gastos';
import {
  datosDelFormulario,
  formularioDeGasto,
  formularioDeGastoNuevo,
  leerMontoGasto,
  nombrePersona,
  previsualizarReparto,
  validarFormularioGasto,
} from '../comun/gastos';
import { formatearMonto } from '../comun/formato';
import { colores, fuentes } from '../comun/tema';
import { Boton } from './Boton';
import { Campo } from './Campo';

interface Props {
  gasto: Gasto | null;
  personas: PersonaGasto[];
  /** Para sugerir, en un gasto nuevo, que pagó el usuario actual. */
  participacionActualId: string;
  inicial?: DatosGasto | null;
  bloqueado: boolean;
  puedeGuardar: boolean;
  campos: Record<string, string>;
  error: string;
  aviso: string;
  pendiente: boolean;
  puedeReintentar: boolean;
  ocupado: boolean;
  conflicto: boolean;
  alVerificar: () => void;
  alReintentar: () => void;
  alRevisar: () => void;
  alGuardar: (datos: DatosGasto) => void;
  alCancelar: () => void;
}

/** CU23–CU24: formulario nativo con selección y reparto virtualizados y borrador conservado ante errores. */
export function FormularioGasto(props: Props) {
  const { gasto, personas, inicial, bloqueado, campos, alGuardar, alCancelar } = props;
  const [formulario, setFormulario] = useState(() =>
    inicial
      ? { ...inicial, monto: formularioDeGasto({ montoCentesimos: inicial.montoCentesimos } as Gasto).monto }
      : gasto
        ? formularioDeGasto(gasto)
        : formularioDeGastoNuevo(personas, props.participacionActualId),
  );
  const [enviado, setEnviado] = useState(false);
  const [tocados, setTocados] = useState<Record<string, boolean>>({});
  const errores = validarFormularioGasto(formulario);
  const error = (campo: string) => campos[campo] ?? (enviado || tocados[campo] ? errores[campo] : undefined);
  const reparto = previsualizarReparto(leerMontoGasto(formulario.monto), formulario.participantes, personas);
  function confirmar() {
    setEnviado(true);
    if (!Object.keys(errores).length) alGuardar(datosDelFormulario(formulario));
  }
  return (
    <Modal
      visible
      animationType="slide"
      onRequestClose={() => {
        if (!bloqueado) alCancelar();
      }}
    >
      {/* Dentro de un Modal el SafeAreaView necesita su propio proveedor para conocer el notch y el borde inferior */}
      <SafeAreaProvider>
        <SafeAreaView style={s.pantalla} edges={['top', 'left', 'right', 'bottom']}>
          <KeyboardAvoidingView style={s.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <FlatList
              data={personas}
              keyExtractor={(p) => p.id}
              contentContainerStyle={s.contenido}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              ListHeaderComponent={
                <View style={s.cabecera}>
                  <Text style={s.titulo} accessibilityRole="header">
                    {gasto ? 'Editar gasto' : 'Registrar gasto'}
                  </Text>
                  {!!props.error && (
                    <Text style={s.error} accessibilityRole="alert">
                      {props.error}
                    </Text>
                  )}
                  {props.pendiente && (
                    <View style={s.aviso}>
                      <Text style={s.texto}>
                        Operación pendiente de verificación. No cambies sus datos hasta conocer el resultado.
                      </Text>
                      <Boton
                        texto="Verificar resultado"
                        variante="secundario"
                        deshabilitado={props.ocupado}
                        alPresionar={props.alVerificar}
                      />
                      {props.puedeReintentar && (
                        <Boton
                          texto="Reenviar mismo intento"
                          variante="secundario"
                          deshabilitado={props.ocupado}
                          alPresionar={props.alReintentar}
                        />
                      )}
                    </View>
                  )}
                  {props.conflicto && (
                    <View style={s.aviso}>
                      <Text style={s.texto}>
                        Conservamos tu edición. Revisá la versión actual antes de aplicar nuevamente los cambios.
                      </Text>
                      <Boton texto="Cargar versión actual" variante="secundario" alPresionar={props.alRevisar} />
                    </View>
                  )}
                  <Campo
                    tonoError="advertencia"
                    etiqueta="Concepto"
                    value={formulario.concepto}
                    maxLength={150}
                    editable={!bloqueado}
                    error={error('concepto')}
                    onBlur={() => setTocados((t) => ({ ...t, concepto: true }))}
                    onChangeText={(concepto) => setFormulario({ ...formulario, concepto })}
                  />
                  <Campo
                    tonoError="advertencia"
                    etiqueta="Monto total ($)"
                    value={formulario.monto}
                    keyboardType="decimal-pad"
                    editable={!bloqueado}
                    error={error('montoCentesimos')}
                    onBlur={() => setTocados((t) => ({ ...t, montoCentesimos: true }))}
                    onChangeText={(monto) => setFormulario({ ...formulario, monto })}
                  />
                  <Text style={s.subtitulo}>Quién pagó y entre quiénes se divide</Text>
                  <Text style={s.suave}>
                    Indicá una persona que pagó y seleccioná las personas del reparto. Las partes iguales incluyen el ajuste de
                    centésimos.
                  </Text>
                  {!!error('pagadorId') && <Text style={s.error}>{error('pagadorId')}</Text>}
                  {!!error('participantes') && <Text style={s.error}>{error('participantes')}</Text>}
                </View>
              }
              renderItem={({ item }) => {
                const parte = reparto.find((p) => p.personaId === item.id);
                return (
                  <View style={s.persona}>
                    <Text style={s.texto}>{nombrePersona(personas, item.id)}</Text>
                    <View style={s.acciones}>
                      <Pressable
                        style={[s.opcion, formulario.pagadorId === item.id && s.seleccionada]}
                        accessibilityRole="radio"
                        accessibilityLabel={`Pagó ${item.nombre}`}
                        accessibilityState={{ checked: formulario.pagadorId === item.id, disabled: bloqueado }}
                        disabled={bloqueado}
                        onPress={() => {
                          setFormulario({ ...formulario, pagadorId: item.id });
                          setTocados((t) => ({ ...t, pagadorId: true }));
                        }}
                      >
                        <Text style={s.texto}>{formulario.pagadorId === item.id ? '◉' : '○'} Pagó</Text>
                      </Pressable>
                      <Pressable
                        style={[s.opcion, formulario.participantes.includes(item.id) && s.seleccionada]}
                        accessibilityRole="checkbox"
                        accessibilityLabel={`Incluir a ${item.nombre} en el reparto`}
                        accessibilityState={{ checked: formulario.participantes.includes(item.id), disabled: bloqueado }}
                        disabled={bloqueado}
                        onPress={() => {
                          setFormulario((actual) => ({
                            ...actual,
                            participantes: actual.participantes.includes(item.id)
                              ? actual.participantes.filter((id) => id !== item.id)
                              : [...actual.participantes, item.id],
                          }));
                          setTocados((t) => ({ ...t, participantes: true }));
                        }}
                      >
                        <Text style={s.texto}>{formulario.participantes.includes(item.id) ? '☑' : '☐'} Repartir</Text>
                      </Pressable>
                      {parte && <Text style={s.monto}>{formatearMonto(parte.montoCentesimos)}</Text>}
                    </View>
                  </View>
                );
              }}
            />
            {/* Fuera de la lista: el botón de enviar queda siempre a la vista, arriba del teclado (lineamientos, Formularios) */}
            <View style={s.barraInferior}>
              <Boton
                texto={gasto ? 'Guardar cambios' : 'Registrar gasto'}
                cargando={props.ocupado}
                deshabilitado={bloqueado || !props.puedeGuardar}
                alPresionar={confirmar}
              />
              <Boton texto="Cancelar" variante="secundario" deshabilitado={bloqueado} alPresionar={alCancelar} />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const s = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: 20, gap: 12 },
  barraInferior: {
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colores.borde,
    backgroundColor: colores.fondo,
  },
  cabecera: { gap: 14, paddingBottom: 18 },
  titulo: { fontFamily: fuentes.titulos, fontSize: 26, color: colores.texto },
  subtitulo: { fontFamily: fuentes.texto, fontSize: 17, fontWeight: '700', color: colores.texto },
  texto: { fontFamily: fuentes.texto, fontSize: 15, color: colores.texto },
  suave: { fontFamily: fuentes.texto, fontSize: 14, color: colores.textoSuave },
  error: { fontFamily: fuentes.texto, fontSize: 14, color: colores.advertencia },
  aviso: { padding: 14, gap: 12, borderRadius: 14, backgroundColor: colores.primarioClaro },
  persona: {
    padding: 14,
    gap: 10,
    borderRadius: 14,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  acciones: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  opcion: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  seleccionada: { backgroundColor: colores.primarioClaro, borderColor: colores.primario },
  monto: { fontFamily: fuentes.texto, color: colores.primarioOscuro, fontWeight: '700', fontSize: 16 },
});
