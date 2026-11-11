import { useLocalSearchParams } from 'expo-router';
import { PantallaDetalleActividad } from '../../../../src/componentes/PantallaDetalleActividad';

/**
 * M – CU09 Detalle de actividad. También se abre con el enlace faltauno://actividades/<id> (A3).
 * Pendiente: CU08 (búsqueda), CU14 (mis actividades) y CU18 (invitaciones) navegan acá con router.push(`/actividades/${id}`).
 */
export default function PantallaActividad() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // key: al pasar de una actividad a otra, la pantalla arranca de cero
  return <PantallaDetalleActividad key={id} actividadId={id} />;
}
