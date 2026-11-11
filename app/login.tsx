import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import logoFaltaUno from '../assets/logo-faltauno.png';
import { iniciarSesion, iniciarSesionConGoogle } from '../src/api/auth';
import { ErrorApi } from '../src/api/cliente';
import { Boton } from '../src/componentes/Boton';
import { Campo } from '../src/componentes/Campo';
import { colores, fuentes } from '../src/comun/tema';
import { googleDisponible, obtenerIdTokenDeGoogle } from '../src/sesion/google';
import { almacenSesion } from '../src/sesion/almacenSesion';
import {
  MENSAJE_FALLA_GOOGLE,
  MENSAJE_SESION_VENCIDA,
  mensajeDeErrorDeGoogle,
  mensajeDeErrorDeLogin,
} from '../src/sesion/mensajesLogin';
import { useSesion } from '../src/sesion/SesionContexto';

interface ErroresDeCampos {
  email?: string;
  password?: string;
}

/** Validación solo de forma, para no llamar a la API con campos vacíos. La regla real la valida la API. */
function validarCamposVacios(email: string, password: string): ErroresDeCampos {
  const errores: ErroresDeCampos = {};
  if (!email.trim()) errores.email = 'Ingresá tu correo electrónico.';
  if (!password) errores.password = 'Ingresá tu contraseña.';
  return errores;
}

const MOSTRAR_GOOGLE = googleDisponible();

/**
 * M01 – CU01 Inicio de sesión.
 * Al abrir la sesión no se navega a mano: el layout raíz detecta la sesión nueva y muestra la pantalla principal.
 */
export default function PantallaLogin() {
  const { abrirSesion } = useSesion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erroresDeCampos, setErroresDeCampos] = useState<ErroresDeCampos>({});
  // CU08 ER3: si se llegó acá porque la sesión venció, se avisa
  const [mensajeError, setMensajeError] = useState<string | null>(() =>
    almacenSesion.sesionVencio() ? MENSAJE_SESION_VENCIDA : null,
  );
  const [enviando, setEnviando] = useState(false);

  async function alIniciarSesion() {
    setMensajeError(null);

    const erroresLocales = validarCamposVacios(email, password);
    setErroresDeCampos(erroresLocales);
    if (Object.keys(erroresLocales).length > 0) {
      return;
    }

    setEnviando(true);
    try {
      await abrirSesion(await iniciarSesion(email, password));
    } catch (error) {
      if (error instanceof ErrorApi && error.campos) {
        setErroresDeCampos(error.campos);
      }
      // CU01 E3: se conserva el correo y se pide reintentar
      setPassword('');
      setMensajeError(mensajeDeErrorDeLogin(error));
      // Pendiente: CU02 – en E1 (CUENTA_NO_VERIFICADA), ofrecer reenviar el correo de verificación
    } finally {
      setEnviando(false);
    }
  }

  async function alIniciarSesionConGoogle() {
    setMensajeError(null);

    let idToken: string;
    try {
      idToken = await obtenerIdTokenDeGoogle();
    } catch (error) {
      if (__DEV__) console.log('[google] falló al obtener el token de Google:', error);
      // CU01 ER2: Google falló o el usuario canceló
      setMensajeError(MENSAJE_FALLA_GOOGLE);
      return;
    }

    setEnviando(true);
    try {
      await abrirSesion(await iniciarSesionConGoogle(idToken));
    } catch (error) {
      if (__DEV__) console.log('[google] la API rechazó el login con Google:', error);
      // Pendiente: CU02 A3 – en E2 (CUENTA_NO_ENCONTRADA), ofrecer registrarse con la misma cuenta de Google
      setMensajeError(mensajeDeErrorDeGoogle(error));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={estilos.pantalla}>
      <KeyboardAvoidingView style={estilos.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
          <View style={estilos.encabezado}>
            <Image source={logoFaltaUno} style={estilos.logo} accessibilityLabel="Logo de FaltaUno" />
            <Text style={estilos.marca}>
              Falta<Text style={estilos.marcaAcento}>Uno</Text>
            </Text>
            <Text style={estilos.lema}>Organizá actividades deportivas y encontrá compañeros al aire libre</Text>
          </View>

          <View style={estilos.formulario}>
            <Campo
              etiqueta="Correo electrónico"
              placeholder="tu@correo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
              error={erroresDeCampos.email}
            />
            <View style={estilos.campoConEnlace}>
              <Campo
                etiqueta="Contraseña"
                placeholder="••••••••"
                secureTextEntry
                autoComplete="current-password"
                textContentType="password"
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={alIniciarSesion}
                error={erroresDeCampos.password}
              />
              {/* Pendiente: CU03 – Recuperar contraseña */}
              <Text style={estilos.enlacePendiente}>¿Olvidaste tu contraseña?</Text>
            </View>

            {mensajeError ? (
              <Text style={estilos.avisoError} accessibilityRole="alert">
                {mensajeError}
              </Text>
            ) : null}

            <Boton texto="Iniciar sesión" alPresionar={alIniciarSesion} cargando={enviando} />

            {MOSTRAR_GOOGLE ? (
              <>
                <View style={estilos.separador}>
                  <View style={estilos.linea} />
                  <Text style={estilos.textoSeparador}>o</Text>
                  <View style={estilos.linea} />
                </View>
                <Boton
                  texto="Continuar con Google"
                  variante="secundario"
                  alPresionar={alIniciarSesionConGoogle}
                  cargando={enviando}
                />
                {/* Pendiente: CU01 A1 con Apple (fuera del alcance de este sprint) */}
              </>
            ) : null}

            {/* Pendiente: CU02 – Registro de usuario */}
            <Text style={estilos.registro}>
              ¿No tenés cuenta? <Text style={estilos.registroEnlace}>Registrate</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  contenido: { flexGrow: 1, paddingBottom: 32 },
  encabezado: { alignItems: 'center', gap: 6, paddingTop: 40, paddingHorizontal: 32 },
  logo: { width: 96, height: 93, resizeMode: 'contain' },
  marca: {
    marginTop: 8,
    fontFamily: fuentes.titulos,
    fontWeight: '800',
    fontSize: 34,
    letterSpacing: -0.5,
    color: colores.primarioOscuro,
  },
  marcaAcento: { color: colores.acentoOscuro },
  lema: { textAlign: 'center', fontFamily: fuentes.texto, fontSize: 15, lineHeight: 21, color: colores.textoSuave },
  formulario: { gap: 14, paddingTop: 32, paddingHorizontal: 28 },
  campoConEnlace: { gap: 6 },
  enlacePendiente: { alignSelf: 'flex-end', fontFamily: fuentes.texto, fontSize: 14, fontWeight: '600', color: colores.primario },
  avisoError: {
    padding: 12,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colores.errorFondo,
    color: colores.error,
    fontFamily: fuentes.texto,
    fontSize: 14,
    lineHeight: 20,
  },
  separador: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  linea: { flex: 1, height: 1, backgroundColor: colores.borde },
  textoSeparador: { fontFamily: fuentes.texto, fontSize: 13, color: colores.textoSuave },
  registro: { marginTop: 6, textAlign: 'center', fontFamily: fuentes.texto, fontSize: 15, color: colores.textoSuave },
  registroEnlace: { fontWeight: '700', color: colores.primario },
});
