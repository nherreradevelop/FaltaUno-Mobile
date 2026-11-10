import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Deporte, FranjaHoraria, NivelActividad } from '../api/tipos';
import { alternar, FILTROS_VACIOS, hayErrores, validarFiltros, type FiltrosEnEdicion } from '../comun/filtrosDeBusqueda';
import { ETIQUETA_FRANJA, ETIQUETA_NIVEL } from '../comun/mensajesExplorar';
import { colores, fuentes } from '../comun/tema';
import { Boton } from './Boton';
import { Campo } from './Campo';
import { SelectorDeFecha } from './SelectorDeFecha';

const NIVELES: NivelActividad[] = ['principiante', 'intermedio', 'avanzado'];
const FRANJAS: FranjaHoraria[] = ['manana', 'tarde', 'noche'];

interface PropsPanel {
  visible: boolean;
  /** Filtros aplicados hoy: el panel arranca con ellos cada vez que se abre. */
  filtrosAplicados: FiltrosEnEdicion;
  /** null: las opciones no se pudieron cargar (CU08 ER2) o todavía se están cargando. */
  deportes: Deporte[] | null;
  departamentos: string[] | null;
  alAplicar: (filtros: FiltrosEnEdicion) => void;
  alCerrar: () => void;
}

/** CU08 A1 a A6: sección de filtros. Los cambios se aplican al tocar "Ver actividades"; "Cerrar" los descarta. */
export function PanelDeFiltros({ visible, filtrosAplicados, deportes, departamentos, alAplicar, alCerrar }: PropsPanel) {
  const [filtros, setFiltros] = useState<FiltrosEnEdicion>(filtrosAplicados);
  const [mostrarErrores, setMostrarErrores] = useState(false);

  // Cada vez que se abre, arranca desde lo aplicado (lo que se tocó y se cerró sin aplicar se descarta)
  useEffect(() => {
    if (visible) {
      setFiltros(filtrosAplicados);
      setMostrarErrores(false);
    }
  }, [visible, filtrosAplicados]);

  const errores = validarFiltros(filtros);

  function cambiar(cambios: Partial<FiltrosEnEdicion>) {
    setFiltros((anteriores) => ({ ...anteriores, ...cambios }));
  }

  function aplicar() {
    if (hayErrores(errores)) {
      setMostrarErrores(true);
      return;
    }
    alAplicar(filtros);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={alCerrar}>
      <SafeAreaView style={estilos.pantalla}>
        <View style={estilos.barra}>
          <Pressable accessibilityRole="button" onPress={alCerrar} hitSlop={12}>
            <Text style={estilos.enlace}>Cerrar</Text>
          </Pressable>
          <Text style={estilos.titulo}>Filtros</Text>
          <Pressable accessibilityRole="button" onPress={() => setFiltros(FILTROS_VACIOS)} hitSlop={12}>
            <Text style={estilos.enlace}>Restablecer</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
          {/* A1 */}
          {deportes ? (
            <Grupo titulo="Deporte">
              {deportes.map((deporte) => (
                <Chip
                  key={deporte.id}
                  texto={deporte.nombre}
                  elegido={filtros.deportes.includes(deporte.id)}
                  alPresionar={() => cambiar({ deportes: alternar(filtros.deportes, deporte.id) })}
                />
              ))}
            </Grupo>
          ) : null}

          {/* A2 */}
          <View style={estilos.fechas}>
            <View style={estilos.fecha}>
              <SelectorDeFecha etiqueta="Desde" valor={filtros.desde} alCambiar={(desde) => cambiar({ desde })} />
            </View>
            <View style={estilos.fecha}>
              <SelectorDeFecha
                etiqueta="Hasta"
                valor={filtros.hasta}
                minimo={filtros.desde || undefined}
                alCambiar={(hasta) => cambiar({ hasta })}
                error={mostrarErrores ? errores.hasta : undefined}
              />
            </View>
          </View>

          {/* A4 */}
          <Grupo titulo="Franja horaria">
            {FRANJAS.map((franja) => (
              <Chip
                key={franja}
                texto={ETIQUETA_FRANJA[franja]}
                elegido={filtros.franjas.includes(franja)}
                alPresionar={() => cambiar({ franjas: alternar(filtros.franjas, franja) })}
              />
            ))}
          </Grupo>

          {/* A5 */}
          {departamentos ? (
            <Grupo titulo="Departamento">
              {departamentos.map((departamento) => (
                <Chip
                  key={departamento}
                  texto={departamento}
                  elegido={filtros.departamentos.includes(departamento)}
                  alPresionar={() => cambiar({ departamentos: alternar(filtros.departamentos, departamento) })}
                />
              ))}
            </Grupo>
          ) : null}

          {/* A6 */}
          <Grupo titulo="Nivel">
            {NIVELES.map((nivel) => (
              <Chip
                key={nivel}
                texto={ETIQUETA_NIVEL[nivel]}
                elegido={filtros.niveles.includes(nivel)}
                alPresionar={() => cambiar({ niveles: alternar(filtros.niveles, nivel) })}
              />
            ))}
          </Grupo>

          {/* A3 */}
          <Campo
            etiqueta="Máximo de personas"
            placeholder="Sin límite"
            keyboardType="number-pad"
            maxLength={3}
            value={filtros.cupoMaximo}
            onChangeText={(cupoMaximo) => cambiar({ cupoMaximo })}
            error={mostrarErrores ? errores.cupoMaximo : undefined}
          />
        </ScrollView>

        <View style={estilos.pie}>
          <Boton texto="Ver actividades" alPresionar={aplicar} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={estilos.grupo}>
      <Text style={estilos.tituloGrupo}>{titulo}</Text>
      <View style={estilos.chips}>{children}</View>
    </View>
  );
}

function Chip({ texto, elegido, alPresionar }: { texto: string; elegido: boolean; alPresionar: () => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: elegido }}
      onPress={alPresionar}
      style={[estilos.chip, elegido ? estilos.chipElegido : null]}
    >
      <Text style={[estilos.textoChip, elegido ? estilos.textoChipElegido : null]}>{texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
    backgroundColor: colores.blanco,
  },
  titulo: { fontFamily: fuentes.titulos, fontWeight: '800', fontSize: 20, color: colores.texto },
  enlace: { fontFamily: fuentes.texto, fontSize: 16, fontWeight: '600', color: colores.primario },
  contenido: { padding: 20, gap: 22 },
  grupo: { gap: 10 },
  tituloGrupo: { fontFamily: fuentes.texto, fontSize: 14, fontWeight: '700', color: colores.texto },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.blanco,
  },
  chipElegido: { borderColor: colores.primario, backgroundColor: colores.primarioClaro },
  textoChip: { fontFamily: fuentes.texto, fontSize: 15, color: colores.texto },
  textoChipElegido: { color: colores.primarioOscuro, fontWeight: '700' },
  fechas: { gap: 12 },
  fecha: { flex: 1 },
  pie: { padding: 20, borderTopWidth: 1, borderTopColor: colores.borde, backgroundColor: colores.blanco },
});
