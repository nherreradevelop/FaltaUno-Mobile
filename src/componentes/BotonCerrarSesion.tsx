import { useState } from 'react';
import { Alert } from 'react-native';
import { useSesion } from '../sesion/SesionContexto';
import { Boton } from './Boton';

/**
 * CU37 – Cierre de sesión, desde el perfil propio (FP pasos 1 a 3).
 * Al cerrar no se navega a mano: Stack.Protected del layout raíz quita las pantallas privadas
 * y muestra el login, así que volver atrás no las recupera (FP paso 8, RN4).
 */
export function BotonCerrarSesion() {
  const { cerrarSesion } = useSesion();
  const [cerrando, setCerrando] = useState(false);

  async function alConfirmar() {
    setCerrando(true);
    await cerrarSesion(); // no lanza: ER1 y ER2 se avisan en el login
  }

  function pedirConfirmacion() {
    // CU37 A2: "Cancelar" cierra el diálogo y la sesión sigue activa
    Alert.alert('¿Seguro que querés cerrar sesión?', undefined, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: alConfirmar },
    ]);
  }

  return <Boton texto="Cerrar sesión" variante="peligro" alPresionar={pedirConfirmacion} cargando={cerrando} />;
}
