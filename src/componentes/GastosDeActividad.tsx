import { obtenerGasto } from '../api/gastos';
import { ErrorApi } from '../api/cliente';
import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Balance, Gasto, ParteGasto } from '../api/gastos';
import { nombrePersona } from '../comun/gastos';
import { formatearMonto } from '../comun/formato';
import { colores, fuentes } from '../comun/tema';
import { useGastos } from '../hooks/useGastos';
import { Boton } from './Boton';
import { FormularioGasto } from './FormularioGasto';

type Fila =
  | { tipo: 'gasto'; gasto: Gasto }
  | { tipo: 'parte'; parte: ParteGasto }
  | { tipo: 'balance'; balance: Balance }
  | { tipo: 'tituloBalance' };

function claveFila(fila: Fila): string {
  if (fila.tipo === 'gasto') return fila.gasto.id;
  if (fila.tipo === 'parte') return fila.parte.personaId;
  if (fila.tipo === 'balance') return `${fila.balance.deudorId}:${fila.balance.acreedorId}`;
  return 'balances';
}

/** CU23–CU25, solo gastos. CU26 se abre desde cada balance; pendiente el resto de CU34. */
export function GastosDeActividad({ actividadId }: { actividadId: string }) {
  const modelo = useGastos(actividadId);
  const primerFoco = useRef(true);
  const recargarGastos = modelo.recargar;
  useFocusEffect(
    useCallback(() => {
      if (primerFoco.current) primerFoco.current = false;
      else void recargarGastos();
    }, [recargarGastos]),
  );
  const [seleccionado, setSeleccionado] = useState<Gasto | null>(modelo.pendiente?.gasto ?? null);
  const [formulario, setFormulario] = useState(!!modelo.pendiente && modelo.pendiente.accion !== 'eliminar');
  const [confirmar, setConfirmar] = useState(false);
  const personas = modelo.opciones?.personas ?? [];
  const bloqueado = modelo.ocupado || modelo.pendiente !== null;
  const detalleId = seleccionado?.id;
  useEffect(() => {
    // La lectura sigue los cambios; un borrador o una confirmación conserva su versión para revisar conflictos.
    if (!detalleId || formulario || confirmar || modelo.pendiente || modelo.ocupado) return;
    let vigente = true;
    obtenerGasto(actividadId, detalleId)
      .then((actual) => {
        if (vigente) setSeleccionado(actual);
      })
      .catch((error: unknown) => {
        if (vigente && error instanceof ErrorApi && [404, 410].includes(error.estado)) setSeleccionado(null);
      });
    return () => {
      vigente = false;
    };
  }, [actividadId, detalleId, formulario, confirmar, modelo.pendiente, modelo.ocupado, modelo.gastos]);

  const puedeEditar =
    seleccionado && modelo.opciones?.puedeEscribir && seleccionado.registradoPorId === modelo.opciones.participacionActualId;
  const filas: Fila[] = seleccionado
    ? seleccionado.partes.map((parte) => ({ tipo: 'parte', parte }))
    : [
        ...modelo.gastos.map((gasto): Fila => ({ tipo: 'gasto', gasto })),
        { tipo: 'tituloBalance' },
        ...modelo.balances.map((balance): Fila => ({ tipo: 'balance', balance })),
      ];
  function terminar(ok: boolean) {
    if (ok) {
      setFormulario(false);
      setSeleccionado(null);
    }
  }
  async function revisar() {
    if (!seleccionado) return;
    const actual = await modelo.revisar(seleccionado.id);
    setSeleccionado(actual);
    if (!actual) setFormulario(false);
  }
  return (
    <SafeAreaView style={s.pantalla} edges={['top', 'left', 'right', 'bottom']}>
      <FlatList
        data={modelo.opciones ? filas : []}
        contentContainerStyle={s.contenido}
        keyExtractor={claveFila}
        ListHeaderComponent={
          <View style={s.cabecera}>
            <Boton
              texto={seleccionado ? 'Volver a gastos' : 'Volver a la actividad'}
              variante="secundario"
              deshabilitado={bloqueado}
              alPresionar={() => (seleccionado ? setSeleccionado(null) : router.back())}
            />
            <Text style={s.titulo} accessibilityRole="header">
              {seleccionado ? seleccionado.concepto : 'Gastos de la actividad'}
            </Text>
            {!seleccionado && (
              <Boton
                texto="Ver mis pagos"
                variante="secundario"
                deshabilitado={bloqueado}
                alPresionar={() => router.push({ pathname: '/(app)/actividades/[id]/pagos', params: { id: actividadId } })}
              />
            )}
            {seleccionado && (
              <>
                <Text style={s.monto}>{formatearMonto(seleccionado.montoCentesimos)}</Text>
                <Text style={s.texto}>Pagó {nombrePersona(personas, seleccionado.pagadorId)}</Text>
                <Text style={s.subtitulo}>Reparto</Text>
              </>
            )}
            {!!modelo.aviso && (
              <Text accessibilityLiveRegion="polite" style={s.aviso}>
                {modelo.aviso}
              </Text>
            )}
            {!!modelo.error && (
              <View style={s.panelError}>
                <Text accessibilityRole="alert" style={s.error}>
                  {modelo.error}
                </Text>
                {!modelo.pendiente && (
                  <Boton
                    texto="Actualizar lista y balances"
                    variante="secundario"
                    deshabilitado={modelo.ocupado}
                    alPresionar={() => void modelo.recargar()}
                  />
                )}
              </View>
            )}
            {modelo.pendiente && (
              <View style={s.panel}>
                <Text style={s.texto}>Operación pendiente de verificación.</Text>
                <Boton
                  texto="Verificar resultado"
                  variante="secundario"
                  deshabilitado={modelo.ocupado}
                  alPresionar={() => void modelo.verificar().then(terminar)}
                />
                {modelo.puedeReintentar && (
                  <Boton
                    texto="Reenviar mismo intento"
                    variante="secundario"
                    deshabilitado={modelo.ocupado}
                    alPresionar={() => void modelo.reintentar().then(terminar)}
                  />
                )}
              </View>
            )}
            {!!modelo.opciones?.motivo && <Text style={s.aviso}>{modelo.opciones.motivo}</Text>}
            {modelo.codigo === 'GASTO_MODIFICADO' && seleccionado && (
              <Boton texto="Cargar versión actual" variante="secundario" alPresionar={() => void revisar()} />
            )}
            {modelo.cargando && !modelo.opciones && <View accessibilityLabel="Cargando gastos" style={s.esqueleto} />}
            {!seleccionado && modelo.opciones?.puedeEscribir && (
              <Boton texto="Registrar gasto" deshabilitado={bloqueado} alPresionar={() => setFormulario(true)} />
            )}
            {!seleccionado && modelo.opciones && !modelo.gastos.length && (
              <Text style={s.suave}>Todavía no hay gastos registrados en esta actividad.</Text>
            )}
          </View>
        }
        renderItem={({ item }) => {
          if (item.tipo === 'tituloBalance')
            return (
              <View style={s.cabecera}>
                {modelo.hayMas && (
                  <Boton
                    texto="Ver más gastos"
                    variante="secundario"
                    deshabilitado={bloqueado}
                    alPresionar={() => void modelo.verMas()}
                  />
                )}
                <Text style={s.subtitulo}>Balances vigentes</Text>
                {!modelo.balances.length && <Text style={s.suave}>No hay deudas pendientes.</Text>}
              </View>
            );
          if (item.tipo === 'gasto')
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${item.gasto.concepto}, ${formatearMonto(item.gasto.montoCentesimos)}. Ver detalle`}
                disabled={bloqueado}
                style={s.tarjeta}
                onPress={() => {
                  setSeleccionado(item.gasto);
                  void modelo.revisar(item.gasto.id).then(setSeleccionado);
                }}
              >
                <Text style={s.subtitulo}>{item.gasto.concepto}</Text>
                <Text style={s.suave}>Pagó {nombrePersona(personas, item.gasto.pagadorId)}</Text>
                <Text style={s.monto}>{formatearMonto(item.gasto.montoCentesimos)}</Text>
              </Pressable>
            );
          if (item.tipo === 'parte')
            return (
              <View style={s.tarjeta}>
                <Text style={s.texto}>{nombrePersona(personas, item.parte.personaId)}</Text>
                <Text style={s.monto}>{formatearMonto(item.parte.montoCentesimos)}</Text>
              </View>
            );
          return (
            <View style={s.tarjeta}>
              <Text style={s.texto}>
                {nombrePersona(personas, `p:${item.balance.deudorId}`)} debe a{' '}
                {nombrePersona(personas, `p:${item.balance.acreedorId}`)}
              </Text>
              <Text style={s.monto}>{formatearMonto(item.balance.montoCentesimos)}</Text>
              {[item.balance.deudorId, item.balance.acreedorId].includes(modelo.opciones?.participacionActualId ?? '') && (
                <Boton
                  texto={modelo.opciones?.puedeEscribir ? 'Registrar pago' : 'Ver mis pagos'}
                  variante="secundario"
                  deshabilitado={bloqueado}
                  alPresionar={() =>
                    router.push({
                      pathname: '/(app)/actividades/[id]/pagos',
                      params: {
                        id: actividadId,
                        deudorId: item.balance.deudorId,
                        acreedorId: item.balance.acreedorId,
                      },
                    })
                  }
                />
              )}
            </View>
          );
        }}
        ListFooterComponent={
          puedeEditar ? (
            <View style={s.cabecera}>
              <Boton texto="Editar" variante="secundario" deshabilitado={bloqueado} alPresionar={() => setFormulario(true)} />
              <Boton texto="Eliminar gasto" variante="peligro" deshabilitado={bloqueado} alPresionar={() => setConfirmar(true)} />
            </View>
          ) : undefined
        }
      />
      {formulario && modelo.opciones && (
        <FormularioGasto
          key={`${seleccionado?.id ?? 'nuevo'}:${seleccionado?.version ?? 0}`}
          gasto={seleccionado}
          personas={personas}
          inicial={modelo.pendiente?.datos}
          campos={modelo.campos}
          bloqueado={bloqueado}
          puedeGuardar={modelo.opciones.puedeEscribir}
          ocupado={modelo.ocupado}
          error={modelo.error}
          aviso={modelo.aviso}
          pendiente={!!modelo.pendiente}
          puedeReintentar={modelo.puedeReintentar}
          conflicto={modelo.codigo === 'GASTO_MODIFICADO'}
          alVerificar={() => void modelo.verificar().then(terminar)}
          alReintentar={() => void modelo.reintentar().then(terminar)}
          alRevisar={() => void revisar()}
          alCancelar={() => setFormulario(false)}
          alGuardar={(datos) => void modelo.enviar(seleccionado ? 'editar' : 'registrar', datos, seleccionado).then(terminar)}
        />
      )}
      <Modal transparent visible={confirmar && !bloqueado} animationType="fade" onRequestClose={() => setConfirmar(false)}>
        <View style={s.velo}>
          <View style={s.dialogo} accessibilityViewIsModal>
            <Text style={s.subtitulo}>Eliminar gasto</Text>
            <Text style={s.texto}>
              ¿Eliminar “{seleccionado?.concepto}” por {formatearMonto(seleccionado?.montoCentesimos ?? 0)}, pagado por{' '}
              {nombrePersona(personas, seleccionado?.pagadorId ?? '')}? Esto actualizará los balances de la actividad.
            </Text>
            <Boton texto="Cancelar" variante="secundario" alPresionar={() => setConfirmar(false)} />
            <Pressable
              accessibilityRole="button"
              style={s.confirmar}
              onPress={() => {
                setConfirmar(false);
                if (seleccionado) void modelo.enviar('eliminar', null, seleccionado).then(terminar);
              }}
            >
              <Text style={s.confirmarTexto}>Eliminar gasto</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: 20, gap: 12 },
  cabecera: { gap: 14, paddingVertical: 12 },
  titulo: { fontFamily: fuentes.titulos, fontSize: 26, color: colores.texto },
  subtitulo: { fontFamily: fuentes.texto, fontSize: 17, fontWeight: '700', color: colores.texto },
  texto: { fontFamily: fuentes.texto, fontSize: 15, color: colores.texto },
  suave: { fontFamily: fuentes.texto, fontSize: 14, color: colores.textoSuave },
  monto: { fontFamily: fuentes.texto, fontSize: 21, fontWeight: '700', color: colores.primarioOscuro },
  tarjeta: {
    padding: 18,
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  aviso: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: colores.primarioClaro,
    color: colores.primarioOscuro,
    fontFamily: fuentes.texto,
  },
  panel: { padding: 14, borderRadius: 12, backgroundColor: colores.primarioClaro, gap: 12 },
  panelError: { padding: 14, borderRadius: 12, backgroundColor: colores.errorFondo, gap: 12 },
  error: { fontFamily: fuentes.texto, color: colores.error, fontSize: 14 },
  esqueleto: { height: 180, borderRadius: 16, backgroundColor: colores.superficieSutil },
  velo: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colores.velo },
  dialogo: { padding: 22, gap: 16, borderRadius: 20, backgroundColor: colores.superficie },
  confirmar: { minHeight: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.error },
  confirmarTexto: { fontFamily: fuentes.texto, fontSize: 16, fontWeight: '700', color: colores.sobrePrimario },
});
