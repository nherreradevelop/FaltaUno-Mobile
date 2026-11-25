import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorApi } from '../api/cliente';
import { obtenerGasto, type Balance, type Gasto, type ParteGasto, type PersonaGasto } from '../api/gastos';
import { formatearMonto } from '../comun/formato';
import { nombrePersona } from '../comun/gastos';
import { colores, fuentes, sombraSuave } from '../comun/tema';
import { useGastos } from '../hooks/useGastos';
import { Boton } from './Boton';
import { FormularioGasto } from './FormularioGasto';
import { TituloConVolver } from './TituloConVolver';

/** CU23–CU25: pantalla independiente accesible debajo del mapa, con una sola lista virtualizada. */
export function GastosDeActividad({ actividadId }: { actividadId: string }) {
  const vista = useVistaDeGastos(actividadId, true);
  return (
    <SafeAreaView style={s.hoja}>
      <FlatList
        data={vista.filas}
        keyExtractor={(fila) => fila.clave}
        contentContainerStyle={s.contenidoHoja}
        ListHeaderComponent={
          <>
            <TituloConVolver
              titulo="Gastos de la actividad"
              etiqueta="Volver a la actividad"
              deshabilitado={vista.bloqueado}
              alVolver={() => router.back()}
            />
            <EncabezadoDeGastos vista={vista} />
          </>
        }
        renderItem={({ item }) => <FilaDeGastosItem fila={item} vista={vista} />}
      />
      <HojasDeGastos vista={vista} />
    </SafeAreaView>
  );
}

/** Una fila de la pestaña Gastos. La clave va en la fila para que la FlatList del detalle use un único keyExtractor. */
export type FilaDeGastos =
  | { tipo: 'gasto'; clave: string; gasto: Gasto }
  | { tipo: 'tituloBalances'; clave: string }
  | { tipo: 'balance'; clave: string; balance: Balance };

export type VistaDeGastos = ReturnType<typeof useVistaDeGastos>;

const CANTIDAD_DE_ESQUELETOS = 3;

/**
 * Estado de la pantalla de gastos. Con habilitado = false no pide nada: los gastos se cargan la primera vez que se abre
 * la pestaña y se conservan al cambiar a otra.
 */
export function useVistaDeGastos(actividadId: string, habilitado: boolean) {
  const modelo = useGastos(actividadId, habilitado);
  const [seleccionado, setSeleccionado] = useState<Gasto | null>(modelo.pendiente?.gasto ?? null);
  // Una intención pendiente de registrar o editar vuelve a abrir su formulario para verificarla o reenviarla
  const [formularioAbierto, setFormularioAbierto] = useState(!!modelo.pendiente && modelo.pendiente.accion !== 'eliminar');
  const [confirmandoEliminacion, setConfirmandoEliminacion] = useState(false);
  const bloqueado = modelo.ocupado || modelo.pendiente !== null;

  useRecargaAlVolver(modelo.recargar, habilitado);
  useGastoSeleccionadoAlDia(actividadId, seleccionado?.id, setSeleccionado, {
    pausado: formularioAbierto || confirmandoEliminacion || !!modelo.pendiente || modelo.ocupado,
    gastos: modelo.gastos,
  });

  const filas = filasDeGastos(modelo.gastos, modelo.balances, modelo.opciones !== null);

  function abrirDetalle(gasto: Gasto) {
    // Se muestra enseguida lo que ya está en la lista; useGastoSeleccionadoAlDia trae la versión actual (una sola llamada)
    setSeleccionado(gasto);
  }

  function cerrarDetalle() {
    if (bloqueado) return;
    setConfirmandoEliminacion(false);
    setSeleccionado(null);
  }

  /** Al terminar bien una operación se cierra todo y el aviso queda visible en la pestaña. */
  function terminar(ok: boolean) {
    if (!ok) return;
    setFormularioAbierto(false);
    setConfirmandoEliminacion(false);
    setSeleccionado(null);
  }

  async function cargarVersionActual() {
    if (!seleccionado) return;
    const actual = await modelo.revisar(seleccionado.id);
    setSeleccionado(actual);
    if (!actual) setFormularioAbierto(false);
  }

  function eliminarSeleccionado() {
    setConfirmandoEliminacion(false);
    if (seleccionado) void modelo.enviar('eliminar', null, seleccionado).then(terminar);
  }

  const esAutorDelSeleccionado = seleccionado !== null && seleccionado.registradoPorId === modelo.opciones?.participacionActualId;
  const puedeEditarSeleccionado = esAutorDelSeleccionado && (modelo.opciones?.puedeEscribir ?? false);

  return {
    actividadId,
    modelo,
    filas,
    bloqueado,
    seleccionado,
    puedeEditarSeleccionado,
    formularioAbierto,
    confirmandoEliminacion,
    abrirDetalle,
    cerrarDetalle,
    abrirFormulario: () => setFormularioAbierto(true),
    cerrarFormulario: () => setFormularioAbierto(false),
    pedirConfirmacionDeEliminar: () => setConfirmandoEliminacion(true),
    cancelarEliminacion: () => setConfirmandoEliminacion(false),
    eliminarSeleccionado,
    cargarVersionActual,
    terminar,
  };
}

function filasDeGastos(gastos: Gasto[], balances: Balance[], cargado: boolean): FilaDeGastos[] {
  if (!cargado) return [];
  const filasGasto = gastos.map((gasto): FilaDeGastos => ({ tipo: 'gasto', clave: `gasto-${gasto.id}`, gasto }));
  const filasBalance = balances.map((balance): FilaDeGastos => ({
    tipo: 'balance',
    clave: `balance-${balance.deudorId}:${balance.acreedorId}`,
    balance,
  }));
  return [...filasGasto, { tipo: 'tituloBalances', clave: 'titulo-balances' }, ...filasBalance];
}

/** Al volver de Pagos (CU26) los balances pueden haber cambiado: se recargan, salvo la primera vez que se enfoca. */
function useRecargaAlVolver(recargar: () => Promise<void>, habilitado: boolean) {
  const primerFoco = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (primerFoco.current) {
        primerFoco.current = false;
        return;
      }
      if (habilitado) void recargar();
    }, [recargar, habilitado]),
  );
}

/**
 * Mientras el detalle está abierto, sigue los cambios de la lista (otro participante editó o eliminó el gasto).
 * Se pausa con un formulario, una confirmación o una operación en curso: esas conservan su versión para detectar conflictos.
 */
function useGastoSeleccionadoAlDia(
  actividadId: string,
  gastoId: string | undefined,
  setSeleccionado: (gasto: Gasto | null) => void,
  { pausado, gastos }: { pausado: boolean; gastos: Gasto[] },
) {
  useEffect(() => {
    if (!gastoId || pausado) return;
    let vigente = true;
    obtenerGasto(actividadId, gastoId)
      .then((actual) => {
        if (vigente) setSeleccionado(actual);
      })
      .catch((error: unknown) => {
        const yaNoExiste = error instanceof ErrorApi && [404, 410].includes(error.estado);
        if (vigente && yaNoExiste) setSeleccionado(null);
      });
    return () => {
      vigente = false;
    };
  }, [actividadId, gastoId, pausado, gastos, setSeleccionado]);
}

/** Arriba de la lista: avisos, la acción principal (Registrar gasto), el acceso a pagos y los estados de carga y vacío. */
export function EncabezadoDeGastos({ vista }: { vista: VistaDeGastos }) {
  const { modelo, bloqueado, actividadId } = vista;
  // Antes de la primera respuesta (o mientras llega) se muestran esqueletos con la forma de las tarjetas
  const cargandoPorPrimeraVez = !modelo.opciones && !modelo.error;
  const sinGastos = modelo.opciones !== null && modelo.gastos.length === 0;

  return (
    <View style={s.encabezado}>
      {/* Con el detalle abierto, los avisos se muestran en la hoja */}
      {!vista.seleccionado ? <AvisosDeGastos vista={vista} /> : null}
      {!!modelo.opciones?.motivo && <Text style={s.aviso}>{modelo.opciones.motivo}</Text>}

      <View style={s.presentacion}>
        <Text style={s.descripcion}>Cada gasto y su reparto actualizan los balances juntos.</Text>
        {modelo.opciones?.puedeEscribir ? (
          <Boton texto="Registrar gasto" tono="finanzas" deshabilitado={bloqueado} alPresionar={vista.abrirFormulario} />
        ) : null}
      </View>
      {modelo.opciones ? (
        <Boton
          texto="Ver mis pagos"
          tono="balances"
          variante="secundario"
          deshabilitado={bloqueado}
          alPresionar={() => router.push({ pathname: '/(app)/actividades/[id]/pagos', params: { id: actividadId } })}
        />
      ) : null}

      {cargandoPorPrimeraVez ? <EsqueletosDeGastos /> : null}
      {sinGastos ? <Text style={s.suave}>Todavía no hay gastos registrados en esta actividad.</Text> : null}
    </View>
  );
}

function EsqueletosDeGastos() {
  return (
    <View accessibilityLabel="Cargando gastos" style={s.esqueletos}>
      {Array.from({ length: CANTIDAD_DE_ESQUELETOS }, (_, indice) => (
        <View key={indice} style={s.esqueleto} />
      ))}
    </View>
  );
}

/** Resultado de la última operación, errores con su salida y la verificación de una operación sin confirmar (RNF-10). */
function AvisosDeGastos({ vista }: { vista: VistaDeGastos }) {
  const { modelo } = vista;
  return (
    <>
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
          {!modelo.pendiente && !vista.seleccionado ? (
            <Boton
              texto={modelo.opciones ? 'Actualizar gastos y balances' : 'Reintentar'}
              variante="secundario"
              cargando={modelo.cargando}
              deshabilitado={modelo.ocupado}
              alPresionar={() => void modelo.recargar()}
            />
          ) : null}
        </View>
      )}
      {modelo.pendiente && (
        <View style={s.panel}>
          <Text style={s.texto}>Operación pendiente de verificación.</Text>
          <Boton
            texto="Verificar resultado"
            variante="secundario"
            deshabilitado={modelo.ocupado}
            alPresionar={() => void modelo.verificar().then(vista.terminar)}
          />
          {modelo.puedeReintentar && (
            <Boton
              texto="Reenviar mismo intento"
              variante="secundario"
              deshabilitado={modelo.ocupado}
              alPresionar={() => void modelo.reintentar().then(vista.terminar)}
            />
          )}
        </View>
      )}
    </>
  );
}

/** Una fila de la pestaña: un gasto, el título de balances (con "Ver más gastos" antes) o un balance. */
export function FilaDeGastosItem({ fila, vista }: { fila: FilaDeGastos; vista: VistaDeGastos }) {
  if (fila.tipo === 'gasto') return <TarjetaDeGasto gasto={fila.gasto} vista={vista} />;
  if (fila.tipo === 'balance') return <TarjetaDeBalance balance={fila.balance} vista={vista} />;
  return <TituloDeBalances vista={vista} />;
}

function TarjetaDeGasto({ gasto, vista }: { gasto: Gasto; vista: VistaDeGastos }) {
  const personas = vista.modelo.opciones?.personas ?? [];
  const monto = formatearMonto(gasto.montoCentesimos);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${gasto.concepto}, ${monto}, pagó ${nombrePersona(personas, gasto.pagadorId)}. Ver detalle`}
      disabled={vista.bloqueado}
      style={({ pressed }) => [s.tarjeta, s.tarjetaGasto, s.tarjetaFila, pressed ? s.tarjetaPresionada : null]}
      onPress={() => vista.abrirDetalle(gasto)}
    >
      <View style={s.columnaPrincipal}>
        <Text style={s.subtitulo}>{gasto.concepto}</Text>
        <Text style={s.suave}>
          Pagó <NombrePagador personas={personas} id={gasto.pagadorId} />
        </Text>
      </View>
      <Text style={s.montoFila}>{monto}</Text>
      <Text style={s.flecha} accessible={false}>
        ›
      </Text>
    </Pressable>
  );
}

function TituloDeBalances({ vista }: { vista: VistaDeGastos }) {
  const { modelo } = vista;
  return (
    <View style={s.encabezado}>
      {modelo.hayMas && (
        <Boton
          texto="Ver más gastos"
          variante="secundario"
          cargando={modelo.ocupado}
          deshabilitado={vista.bloqueado}
          alPresionar={() => void modelo.verMas()}
        />
      )}
      <Text style={s.tituloSeccion} accessibilityRole="header">
        Balances vigentes
      </Text>
      {!modelo.balances.length && <Text style={s.suave}>No hay deudas pendientes.</Text>}
    </View>
  );
}

function TarjetaDeBalance({ balance, vista }: { balance: Balance; vista: VistaDeGastos }) {
  const { modelo, actividadId } = vista;
  const personas = modelo.opciones?.personas ?? [];
  const participacionActualId = modelo.opciones?.participacionActualId ?? '';
  const meInvolucra = balance.deudorId === participacionActualId || balance.acreedorId === participacionActualId;
  return (
    <View style={[s.tarjeta, s.tarjetaBalance]}>
      <View style={s.tarjetaFila}>
        <Text style={[s.texto, s.columnaPrincipal]}>
          {nombrePersona(personas, `p:${balance.deudorId}`)} debe a {nombrePersona(personas, `p:${balance.acreedorId}`)}
        </Text>
        <Text style={s.montoFila}>{formatearMonto(balance.montoCentesimos)}</Text>
      </View>
      {meInvolucra && (
        <Boton
          tono="balances"
          texto={modelo.opciones?.puedeEscribir ? 'Registrar pago' : 'Ver mis pagos'}
          variante="secundario"
          deshabilitado={vista.bloqueado}
          alPresionar={() =>
            router.push({
              pathname: '/(app)/actividades/[id]/pagos',
              params: { id: actividadId, deudorId: balance.deudorId, acreedorId: balance.acreedorId },
            })
          }
        />
      )}
    </View>
  );
}

/**
 * Hojas de la pestaña: el detalle de un gasto y el formulario para registrar uno nuevo.
 * El formulario de edición y la confirmación de eliminar se abren dentro de la hoja del detalle: en iOS no se puede
 * presentar un Modal hermano mientras otro está abierto.
 */
export function HojasDeGastos({ vista }: { vista: VistaDeGastos }) {
  const registrandoNuevo = vista.formularioAbierto && vista.seleccionado === null;
  return (
    <>
      {vista.seleccionado ? <HojaDeDetalle vista={vista} gasto={vista.seleccionado} /> : null}
      {registrandoNuevo ? <FormularioDeLaVista vista={vista} /> : null}
    </>
  );
}

function FormularioDeLaVista({ vista }: { vista: VistaDeGastos }) {
  const { modelo, seleccionado } = vista;
  if (!modelo.opciones) return null;
  return (
    <FormularioGasto
      key={`${seleccionado?.id ?? 'nuevo'}:${seleccionado?.version ?? 0}`}
      gasto={seleccionado}
      personas={modelo.opciones.personas}
      participacionActualId={modelo.opciones.participacionActualId}
      inicial={modelo.pendiente?.datos}
      campos={modelo.campos}
      bloqueado={vista.bloqueado}
      puedeGuardar={modelo.opciones.puedeEscribir}
      ocupado={modelo.ocupado}
      error={modelo.error}
      aviso={modelo.aviso}
      pendiente={!!modelo.pendiente}
      puedeReintentar={modelo.puedeReintentar}
      conflicto={modelo.codigo === 'GASTO_MODIFICADO'}
      alVerificar={() => void modelo.verificar().then(vista.terminar)}
      alReintentar={() => void modelo.reintentar().then(vista.terminar)}
      alRevisar={() => void vista.cargarVersionActual()}
      alCancelar={vista.cerrarFormulario}
      alGuardar={(datos) => void modelo.enviar(seleccionado ? 'editar' : 'registrar', datos, seleccionado).then(vista.terminar)}
    />
  );
}

/** Detalle de un gasto: monto, quién pagó, reparto y, para quien lo registró, Editar y Eliminar. */
function HojaDeDetalle({ vista, gasto }: { vista: VistaDeGastos; gasto: Gasto }) {
  const { modelo } = vista;
  const personas = modelo.opciones?.personas ?? [];
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={vista.cerrarDetalle}>
      <SafeAreaView style={s.hoja} edges={['left', 'right', 'bottom']}>
        <FlatList
          data={gasto.partes}
          keyExtractor={(parte) => parte.personaId}
          contentContainerStyle={s.contenidoHoja}
          ListHeaderComponent={
            <View style={s.encabezado}>
              <View style={s.barraHoja}>
                <Text style={[s.titulo, s.columnaPrincipal]} accessibilityRole="header">
                  {gasto.concepto}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar detalle del gasto"
                  disabled={vista.bloqueado}
                  hitSlop={8}
                  style={s.enlace}
                  onPress={vista.cerrarDetalle}
                >
                  <Text style={s.textoEnlace}>Cerrar</Text>
                </Pressable>
              </View>
              <Text style={s.monto}>{formatearMonto(gasto.montoCentesimos)}</Text>
              <Text style={s.texto}>
                Pagó <NombrePagador personas={personas} id={gasto.pagadorId} />
              </Text>
              <AvisosDeGastos vista={vista} />
              {modelo.codigo === 'GASTO_MODIFICADO' && (
                <Boton texto="Cargar versión actual" variante="secundario" alPresionar={() => void vista.cargarVersionActual()} />
              )}
              <Text style={s.tituloSeccion} accessibilityRole="header">
                Reparto
              </Text>
            </View>
          }
          renderItem={({ item }) => <FilaDeReparto parte={item} personas={personas} />}
          ListFooterComponent={
            vista.puedeEditarSeleccionado ? (
              <View style={s.acciones}>
                <Boton texto="Editar" variante="secundario" deshabilitado={vista.bloqueado} alPresionar={vista.abrirFormulario} />
                <Boton
                  texto="Eliminar gasto"
                  variante="peligro"
                  deshabilitado={vista.bloqueado}
                  alPresionar={vista.pedirConfirmacionDeEliminar}
                />
              </View>
            ) : undefined
          }
        />
        {vista.confirmandoEliminacion && !vista.bloqueado ? <ConfirmarEliminacion vista={vista} gasto={gasto} /> : null}
      </SafeAreaView>
      {/* Editar: el formulario se presenta encima de esta hoja */}
      {vista.formularioAbierto ? <FormularioDeLaVista vista={vista} /> : null}
    </Modal>
  );
}

function FilaDeReparto({ parte, personas }: { parte: ParteGasto; personas: PersonaGasto[] }) {
  return (
    <View style={[s.tarjeta, s.tarjetaFila]}>
      <Text style={[s.texto, s.columnaPrincipal]}>{nombrePersona(personas, parte.personaId)}</Text>
      <Text style={s.montoFila}>{formatearMonto(parte.montoCentesimos)}</Text>
    </View>
  );
}

/** Acción destructiva: dice qué se pierde, "Cancelar" secundario y el botón de confirmar repite la acción. */
function ConfirmarEliminacion({ vista, gasto }: { vista: VistaDeGastos; gasto: Gasto }) {
  const personas = vista.modelo.opciones?.personas ?? [];
  return (
    <View style={s.velo}>
      <View style={s.dialogo} accessibilityViewIsModal>
        <Text style={s.subtitulo} accessibilityRole="header">
          Eliminar gasto
        </Text>
        <Text style={s.texto}>
          ¿Eliminar “{gasto.concepto}” por {formatearMonto(gasto.montoCentesimos)}, pagado por{' '}
          {nombrePersona(personas, gasto.pagadorId)}? Esto actualizará los balances de la actividad.
        </Text>
        <Boton texto="Cancelar" variante="secundario" alPresionar={vista.cancelarEliminacion} />
        <Pressable accessibilityRole="button" style={s.confirmar} onPress={vista.eliminarSeleccionado}>
          <Text style={s.confirmarTexto}>Eliminar gasto</Text>
        </Pressable>
      </View>
    </View>
  );
}

function NombrePagador({ personas, id }: { personas: PersonaGasto[]; id: string }) {
  const persona = personas.find((p) => p.id === id);
  return (
    <>
      <Text style={s.pagador}>{persona?.nombre ?? 'Participante'}</Text>
      {persona?.invitadoId && ` (invitado de ${persona.responsable})`}
    </>
  );
}

const s = StyleSheet.create({
  presentacion: {
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderTopWidth: 4,
    borderColor: colores.borde,
    borderTopColor: colores.finanzasPrimario,
    borderRadius: 18,
    backgroundColor: colores.finanzasSuave,
  },
  descripcion: { fontFamily: fuentes.texto, fontSize: 14, color: colores.textoSuave },
  pagador: { color: colores.primario },
  tarjetaGasto: { borderLeftWidth: 3, borderLeftColor: colores.acento },
  tarjetaBalance: { borderLeftWidth: 3, borderLeftColor: colores.balancesPrimario },
  encabezado: { gap: 12, paddingVertical: 12 },
  acciones: { gap: 12, paddingTop: 16 },
  hoja: { flex: 1, backgroundColor: colores.fondo },
  contenidoHoja: { padding: 20, gap: 10 },
  barraHoja: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titulo: { fontFamily: fuentes.titulos, fontSize: 24, color: colores.texto },
  tituloSeccion: {
    fontFamily: fuentes.texto,
    fontSize: 17,
    fontWeight: '700',
    color: colores.balancesPrimario,
    borderLeftWidth: 4,
    borderLeftColor: colores.balancesPrimario,
    paddingLeft: 10,
    marginTop: 8,
  },
  subtitulo: { fontFamily: fuentes.texto, fontSize: 16, fontWeight: '700', color: colores.texto },
  texto: { fontFamily: fuentes.texto, fontSize: 15, lineHeight: 21, color: colores.texto },
  suave: { fontFamily: fuentes.texto, fontSize: 14, color: colores.textoSuave },
  monto: { fontFamily: fuentes.texto, fontSize: 28, fontWeight: '700', color: colores.texto },
  montoFila: { fontFamily: fuentes.texto, fontSize: 17, fontWeight: '700', color: colores.texto },
  flecha: { fontFamily: fuentes.texto, fontSize: 22, color: colores.textoSuave },
  enlace: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  textoEnlace: { fontFamily: fuentes.texto, fontSize: 15, fontWeight: '700', color: colores.primario },
  tarjeta: {
    ...sombraSuave,
    padding: 16,
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
    marginBottom: 10,
  },
  tarjetaFila: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  tarjetaPresionada: { backgroundColor: colores.primarioClaro, borderColor: colores.primario },
  columnaPrincipal: { flex: 1, gap: 4 },
  aviso: {
    padding: 14,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colores.primarioClaro,
    color: colores.primarioOscuro,
    fontFamily: fuentes.texto,
  },
  panel: { padding: 14, borderRadius: 12, backgroundColor: colores.primarioClaro, gap: 12 },
  panelError: { padding: 14, borderRadius: 12, backgroundColor: colores.errorFondo, gap: 12 },
  error: { fontFamily: fuentes.texto, color: colores.error, fontSize: 14 },
  esqueletos: { gap: 10 },
  esqueleto: { height: 76, borderRadius: 16, backgroundColor: colores.superficieSutil },
  velo: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colores.velo,
  },
  dialogo: { padding: 22, gap: 16, borderRadius: 20, backgroundColor: colores.superficie },
  confirmar: { minHeight: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.error },
  confirmarTexto: { fontFamily: fuentes.texto, fontSize: 16, fontWeight: '700', color: colores.sobrePrimario },
});
