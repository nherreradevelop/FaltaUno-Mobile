import { Redirect, useLocalSearchParams } from 'expo-router';
import { PantallaPerfil } from '../../../src/componentes/PantallaPerfil';
import { useSesion } from '../../../src/sesion/SesionContexto';

/**
 * M – CU04 A1: perfil público de otro usuario.
 * Pendiente: CU11 (participantes), CU06 (amigos) y CU30 (búsqueda) navegan a esta pantalla con router.push(`/perfil/${id}`).
 */
export default function PantallaPerfilDeUsuario() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sesion } = useSesion();

  // El propio perfil tiene una sola pantalla
  if (id === sesion?.usuario.id) {
    return <Redirect href="/perfil" />;
  }
  // key: al pasar de un perfil a otro, la pantalla arranca de cero
  return <PantallaPerfil key={id} usuarioId={id} />;
}
