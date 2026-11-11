import { router } from 'expo-router';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ActividadEncontrada } from '../api/tipos';
import { formatearCuposLibres, formatearFechaHoraCorta, formatearValoracionDelOrganizador } from '../comun/formato';
import { ETIQUETA_NIVEL } from '../comun/mensajesExplorar';
import { colores, fuentes } from '../comun/tema';
import { Boton } from './Boton';

/**
 * CU08: una actividad de la búsqueda (mockup M02).
 * Muestra nombre, deporte, fecha y hora, departamento, organizador con su valoración, nivel y cupos libres;
 * si el usuario la organiza, lo indica.
 * memo: la lista puede ser larga y al agregar una página no hace falta volver a dibujar las tarjetas que ya estaban.
 */
export const TarjetaActividad = memo(function TarjetaActividad({ actividad }: { actividad: ActividadEncontrada }) {
  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.etiquetas}>
        <Text style={estilos.etiqueta}>{actividad.deporte.nombre}</Text>
        {actividad.esOrganizador ? <Text style={[estilos.etiqueta, estilos.organizador]}>Organizada por ti</Text> : null}
      </View>
      <Text style={estilos.nombre}>{actividad.nombre}</Text>
      <Text style={estilos.textoSuave}>
        {formatearFechaHoraCorta(actividad.fechaHoraInicio)} · {actividad.departamento}
      </Text>
      {actividad.organizador ? (
        <Text style={estilos.lineaOrganizador}>
          Organiza <Text style={estilos.nombreOrganizador}>{actividad.organizador.nombre}</Text>
          <Text style={estilos.textoSuave}>
            {'  '}
            {formatearValoracionDelOrganizador(actividad.organizador.valoracionPromedio)}
          </Text>
        </Text>
      ) : null}
      <View style={estilos.datos}>
        <Text style={estilos.dato}>{ETIQUETA_NIVEL[actividad.nivel]}</Text>
        <Text style={estilos.dato}>{formatearCuposLibres(actividad.cuposLibres)}</Text>
      </View>
      {/* CU09 – Detalle de actividad */}
      <Boton texto="Ver detalle" variante="secundario" alPresionar={() => router.push(`/actividades/${actividad.id}`)} />
    </View>
  );
});

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: colores.blanco,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 18,
    gap: 10,
  },
  etiquetas: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  etiqueta: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colores.primarioClaro,
    color: colores.primarioOscuro,
    fontFamily: fuentes.texto,
    fontWeight: '600',
    fontSize: 14,
  },
  organizador: { backgroundColor: '#FDEBD9', color: '#8A4210' },
  nombre: { fontFamily: fuentes.titulos, fontWeight: '800', fontSize: 22, color: colores.texto },
  textoSuave: { fontFamily: fuentes.texto, fontSize: 15, color: colores.textoSuave },
  lineaOrganizador: { fontFamily: fuentes.texto, fontSize: 15, color: colores.texto },
  nombreOrganizador: { fontWeight: '700' },
  datos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dato: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colores.fondo,
    color: colores.texto,
    fontFamily: fuentes.texto,
    fontWeight: '600',
    fontSize: 14,
  },
});
