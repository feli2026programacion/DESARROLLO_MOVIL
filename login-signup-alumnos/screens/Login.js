import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
} from '@expo-google-fonts/montserrat';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
} from '@expo-google-fonts/poppins';
import {
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../src/config/firebaseConfig';

const COLORES = {
  blanco: '#FFFFFF',
  negro: '#000000',
  naranja: '#FF6600',
  amarilloDorado: '#FDB813',
  maderaOscura: '#3D2B1F',
  grisMedio: '#BDBFBC',
  celesteTransparente: 'rgba(219, 234, 254, 0.78)',
  bordeCeleste: 'rgba(125, 211, 252, 0.9)',
};

const REGEX_CORREO = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function Login({ navigation, route }) {
  const [fuentesCargadas] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  const refContrasena = useRef(null);

  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  const [errorCorreo, setErrorCorreo] = useState('');
  const [errorContrasena, setErrorContrasena] = useState('');
  const [errorAcceso, setErrorAcceso] = useState('');
  const [mensajeAviso, setMensajeAviso] = useState('');
  const [intentoEnvio, setIntentoEnvio] = useState(false);
  const [cargando, setCargando] = useState(false);

  const [mostrarReenviar, setMostrarReenviar] = useState(false);
  const [reenviandoCorreo, setReenviandoCorreo] = useState(false);
  const [segundosCooldown, setSegundosCooldown] = useState(0);

  useEffect(() => {
    if (route?.params?.pendingVerification) {
      if (route?.params?.email) {
        setCorreo(String(route.params.email));
      }
      setMensajeAviso(
        'Cuenta creada. Te enviamos un enlace de verificación a tu correo (revisá también Spam). Verificalo antes de iniciar sesión.'
      );
      setMostrarReenviar(true);
      navigation?.setParams?.({
        pendingVerification: false,
      });
    } else if (route?.params?.accountCreated) {
      if (route?.params?.email) {
        setCorreo(String(route.params.email));
      }
      setMensajeAviso(
        'Cuenta creada. Ingresá tu correo y contraseña para iniciar sesión.'
      );
      navigation?.setParams?.({
        accountCreated: false,
      });
    }
  }, [
    route?.params?.pendingVerification,
    route?.params?.accountCreated,
    route?.params?.email,
    navigation,
  ]);

  useEffect(() => {
    if (segundosCooldown <= 0) return;
    const timer = setInterval(() => {
      setSegundosCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [segundosCooldown]);

  if (!fuentesCargadas) {
    return (
      <View style={estilos.pantallaCarga}>
        <ActivityIndicator size="large" color={COLORES.naranja} />
      </View>
    );
  }

  const validarCorreo = (valor, forzarError = false) => {
    const correoLimpio = valor.trim();
    if (!correoLimpio) {
      if (forzarError || intentoEnvio) {
        setErrorCorreo('Ingrese su correo electrónico');
      }
      return false;
    }
    if (!REGEX_CORREO.test(correoLimpio)) {
      if (forzarError || intentoEnvio) {
        setErrorCorreo('Ingrese un correo electrónico válido');
      }
      return false;
    }
    setErrorCorreo('');
    return true;
  };

  const validarContrasena = (valor, forzarError = false) => {
    if (!valor) {
      if (forzarError || intentoEnvio) {
        setErrorContrasena('Ingrese su contraseña');
      }
      return false;
    }
    setErrorContrasena('');
    return true;
  };

  const cambiarCorreo = (texto) => {
    setCorreo(texto);
    setErrorAcceso('');
    setMensajeAviso('');
    if (intentoEnvio || errorCorreo) {
      validarCorreo(texto, true);
    }
  };

  const cambiarContrasena = (texto) => {
    setContrasena(texto);
    setErrorAcceso('');
    setMensajeAviso('');
    if (intentoEnvio || errorContrasena) {
      validarContrasena(texto, true);
    }
  };

  const reenviarVerificacion = async () => {
    if (reenviandoCorreo || segundosCooldown > 0) return;

    const correoLimpio = correo.trim().toLowerCase();
    const correoValido = validarCorreo(correoLimpio, true);
    const contrasenaValida = validarContrasena(contrasena, true);

    if (!correoValido || !contrasenaValida) {
      setErrorAcceso(
        'Completá tu correo y contraseña para poder reenviar el enlace de verificación.'
      );
      return;
    }

    if (!isFirebaseConfigured) {
      setErrorAcceso('La configuración de Firebase no está disponible');
      return;
    }

    setReenviandoCorreo(true);
    setErrorAcceso('');
    setMensajeAviso('');

    try {
      auth.languageCode = 'es';
      const credencial = await signInWithEmailAndPassword(
        auth,
        correoLimpio,
        contrasena
      );
      const usuarioActual = credencial.user;
      await usuarioActual.reload();

      if (usuarioActual.emailVerified) {
        await setDoc(
          doc(db, 'usuarios', usuarioActual.uid),
          {
            emailVerificado: true,
            ultimoAcceso: new Date().toISOString(),
          },
          { merge: true }
        );
        setMostrarReenviar(false);
        if (navigation?.replace) {
          navigation.replace('Home');
        }
        return;
      }

      await sendEmailVerification(usuarioActual);
      await signOut(auth);
      setSegundosCooldown(60);
      setMensajeAviso(
        `Se reenvió el correo de verificación a ${correoLimpio}. Revisá tu bandeja de entrada y Spam.`
      );
    } catch (err) {
      const codigo = err?.code || '';
      if (codigo === 'auth/too-many-requests') {
        setErrorAcceso(
          'Se enviaron demasiados correos recientemente. Esperá unos minutos antes de reintentar.'
        );
      } else if (
        codigo === 'auth/invalid-credential' ||
        codigo === 'auth/user-not-found' ||
        codigo === 'auth/wrong-password' ||
        codigo === 'auth/invalid-email'
      ) {
        setErrorAcceso(
          'Correo o contraseña incorrectos. Verificalos antes de reenviar el enlace.'
        );
      } else {
        setErrorAcceso(
          'No se pudo reenviar el correo de verificación. Intentá nuevamente.'
        );
      }
    } finally {
      setReenviandoCorreo(false);
    }
  };

  const iniciarSesion = async () => {
    if (cargando || reenviandoCorreo) return;

    setIntentoEnvio(true);
    setErrorAcceso('');
    setMensajeAviso('');

    const correoLimpio = correo.trim().toLowerCase();
    const correoValido = validarCorreo(correoLimpio, true);
    const contrasenaValida = validarContrasena(contrasena, true);

    if (!correoValido || !contrasenaValida) {
      return;
    }

    if (!isFirebaseConfigured) {
      setErrorAcceso('La configuración de Firebase no está disponible');
      return;
    }

    setCargando(true);
    try {
      const credencial = await signInWithEmailAndPassword(
        auth,
        correoLimpio,
        contrasena
      );
      const usuarioActual = credencial.user;
      await usuarioActual.reload();

      if (!usuarioActual.emailVerified) {
        await signOut(auth);
        setMostrarReenviar(true);
        setErrorAcceso(
          'Tu correo electrónico aún no está verificado. Tocá el enlace del correo enviado por Firebase y volvé a intentarlo.'
        );
        return;
      }

      setMostrarReenviar(false);

      await setDoc(
        doc(db, 'usuarios', usuarioActual.uid),
        {
          emailVerificado: true,
          ultimoAcceso: new Date().toISOString(),
        },
        { merge: true }
      );

      if (navigation?.replace) {
        navigation.replace('Home');
      }
    } catch (err) {
      const codigo = err?.code || '';
      if (codigo === 'auth/network-request-failed') {
        setErrorAcceso(
          'No pudimos conectarnos. Verifique su conexión a internet e inténtelo nuevamente'
        );
      } else if (codigo === 'auth/too-many-requests') {
        setErrorAcceso(
          'Se realizaron demasiados intentos. Espere unos minutos antes de volver a intentarlo'
        );
      } else if (
        codigo === 'auth/invalid-credential' ||
        codigo === 'auth/user-not-found' ||
        codigo === 'auth/wrong-password' ||
        codigo === 'auth/invalid-email'
      ) {
        setErrorAcceso('No pudimos iniciar sesión. Verifique su correo electrónico y contraseña');
      } else {
        setErrorAcceso(
          'El servicio no está disponible en este momento. Inténtelo nuevamente más tarde'
        );
      }
    } finally {
      setCargando(false);
    }
  };

  const irARecuperarContrasena = () => {
    if (cargando || reenviandoCorreo) return;
    if (navigation?.navigate) {
      navigation.navigate('OlvideContraseña');
    }
  };

  const irACrearCuenta = () => {
    if (cargando || reenviandoCorreo) return;
    if (navigation?.navigate) {
      navigation.navigate('SignUp');
    }
  };

  const bloqueado = cargando || reenviandoCorreo;

  return (
    <ImageBackground
      source={require('../assets/Fondologin.png')}
      style={estilos.imagenFondo}
      resizeMode="cover"
    >
      <View style={estilos.capaClara}>
        <KeyboardAvoidingView
          style={estilos.contenedorTeclado}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={estilos.contenidoScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={estilos.tarjeta}>
              <View style={estilos.contenedorLogo}>
                <Image
                  source={require('../assets/logo.png')}
                  style={estilos.logo}
                  resizeMode="cover"
                  accessibilityLabel="Logo de RT Burpers Gym"
                />
              </View>

              <Text style={estilos.tituloMarca} accessibilityRole="header">
                RT BURPERS GYM
              </Text>

              {mensajeAviso ? (
                <View style={estilos.cajaAviso} accessibilityLiveRegion="polite">
                  <Ionicons
                    name="mail-unread-outline"
                    size={18}
                    color={COLORES.blanco}
                    style={estilos.iconoEstado}
                  />
                  <Text style={estilos.textoAviso}>{mensajeAviso}</Text>
                </View>
              ) : null}

              {/* Campo Correo electrónico */}
              <View style={estilos.grupoCampo}>
                <Text style={estilos.etiqueta}>CORREO ELECTRÓNICO</Text>
                <View
                  style={[
                    estilos.contenedorInput,
                    errorCorreo ? estilos.bordeErrorInput : null,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={19}
                    color={COLORES.maderaOscura}
                    style={estilos.iconoIzquierdo}
                  />
                  <TextInput
                    style={estilos.input}
                    placeholder="usuario@correo.com"
                    placeholderTextColor="#6E706D"
                    value={correo}
                    onChangeText={cambiarCorreo}
                    onBlur={() => validarCorreo(correo, true)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    returnKeyType="next"
                    onSubmitEditing={() => refContrasena.current?.focus()}
                    editable={!bloqueado}
                    accessibilityLabel="Correo electrónico"
                  />
                </View>
                {errorCorreo ? (
                  <Text style={estilos.textoError} accessibilityLiveRegion="polite">
                    {errorCorreo}
                  </Text>
                ) : null}
              </View>

              {/* Campo Contraseña */}
              <View style={estilos.grupoCampo}>
                <Text style={estilos.etiqueta}>CONTRASEÑA</Text>
                <View
                  style={[
                    estilos.contenedorInput,
                    errorContrasena ? estilos.bordeErrorInput : null,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={19}
                    color={COLORES.maderaOscura}
                    style={estilos.iconoIzquierdo}
                  />
                  <TextInput
                    ref={refContrasena}
                    style={estilos.input}
                    placeholder="Ingresá tu contraseña"
                    placeholderTextColor="#6E706D"
                    value={contrasena}
                    onChangeText={cambiarContrasena}
                    onBlur={() => validarContrasena(contrasena, true)}
                    secureTextEntry={!mostrarContrasena}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="current-password"
                    returnKeyType="done"
                    onSubmitEditing={iniciarSesion}
                    editable={!bloqueado}
                    accessibilityLabel="Contraseña"
                  />
                  <Pressable
                    onPress={() => setMostrarContrasena((prev) => !prev)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={estilos.botonOjo}
                    accessibilityRole="button"
                    accessibilityLabel={
                      mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'
                    }
                  >
                    <Ionicons
                      name={mostrarContrasena ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={COLORES.maderaOscura}
                    />
                  </Pressable>
                </View>
                {errorContrasena ? (
                  <Text style={estilos.textoError} accessibilityLiveRegion="polite">
                    {errorContrasena}
                  </Text>
                ) : null}
              </View>

              {/* Error general de autenticación / conexión / verificación */}
              {errorAcceso ? (
                <View style={estilos.cajaErrorAcceso} accessibilityLiveRegion="polite">
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color={COLORES.blanco}
                    style={estilos.iconoEstado}
                  />
                  <Text style={estilos.textoErrorAcceso}>{errorAcceso}</Text>
                </View>
              ) : null}

              {mostrarReenviar ? (
                <Pressable
                  onPress={reenviarVerificacion}
                  disabled={bloqueado || segundosCooldown > 0}
                  style={({ pressed }) => [
                    estilos.botonReenviar,
                    pressed && !bloqueado && estilos.botonPresionado,
                    (bloqueado || segundosCooldown > 0) && estilos.botonDeshabilitado,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Reenviar correo de verificación"
                >
                  {reenviandoCorreo ? (
                    <ActivityIndicator size="small" color={COLORES.maderaOscura} />
                  ) : (
                    <Text style={estilos.textoBotonReenviar}>
                      {segundosCooldown > 0
                        ? `Reenviar verificación (${segundosCooldown}s)`
                        : 'Reenviar correo de verificación'}
                    </Text>
                  )}
                </Pressable>
              ) : null}

              {/* Botón principal Iniciar sesión */}
              <Pressable
                style={({ pressed }) => [
                  estilos.botonPrincipal,
                  pressed && !bloqueado && estilos.botonPrincipalPresionado,
                  bloqueado && estilos.botonDeshabilitado,
                ]}
                onPress={iniciarSesion}
                disabled={bloqueado}
                android_ripple={{ color: 'rgba(255, 255, 255, 0.25)' }}
                accessibilityRole="button"
                accessibilityLabel="Iniciar sesión"
              >
                {cargando ? (
                  <View style={estilos.filaCarga}>
                    <ActivityIndicator size="small" color={COLORES.blanco} />
                    <Text style={estilos.textoBotonPrincipal}>INICIANDO SESIÓN...</Text>
                  </View>
                ) : (
                  <Text style={estilos.textoBotonPrincipal}>INICIAR SESIÓN</Text>
                )}
              </Pressable>

              {/* Enlace recuperar contraseña */}
              <Pressable
                onPress={irARecuperarContrasena}
                disabled={bloqueado}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={estilos.botonRecuperarContrasena}
                accessibilityRole="link"
              >
                <Text style={estilos.textoRecuperarContrasena}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </Pressable>

              <View style={estilos.separador} />

              {/* Registro de nuevos usuarios */}
              <View style={estilos.seccionRegistro}>
                <Text style={estilos.textoSinCuenta}>¿No tenés cuenta?</Text>
                <Pressable
                  style={({ pressed }) => [
                    estilos.botonSecundario,
                    pressed && !bloqueado && estilos.botonSecundarioPresionado,
                    bloqueado && estilos.botonDeshabilitado,
                  ]}
                  onPress={irACrearCuenta}
                  disabled={bloqueado}
                  android_ripple={{ color: 'rgba(253, 184, 19, 0.2)' }}
                  accessibilityRole="button"
                  accessibilityLabel="Registrate"
                >
                  <Text style={estilos.textoBotonSecundario}>CREAR CUENTA</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

const estilos = StyleSheet.create({
  pantallaCarga: {
    flex: 1,
    backgroundColor: COLORES.blanco,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagenFondo: {
    flex: 1,
    backgroundColor: COLORES.blanco,
  },
  capaClara: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  contenedorTeclado: {
    flex: 1,
  },
  contenidoScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  tarjeta: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORES.celesteTransparente,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: COLORES.bordeCeleste,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  contenedorLogo: {
    alignSelf: 'center',
    width: 122,
    height: 122,
    borderRadius: 61,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  tituloMarca: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 20,
    color: COLORES.negro,
    textAlign: 'center',
    letterSpacing: 0.6,
    marginBottom: 14,
  },
  cajaAviso: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORES.maderaOscura,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 9,
    marginBottom: 12,
  },
  textoAviso: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: COLORES.blanco,
  },
  grupoCampo: {
    marginBottom: 12,
  },
  etiqueta: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12,
    color: COLORES.negro,
    marginBottom: 5,
    letterSpacing: 0.4,
  },
  contenedorInput: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORES.grisMedio,
    paddingHorizontal: 10,
  },
  bordeErrorInput: {
    borderColor: '#991B1B',
    backgroundColor: '#FEF2F2',
  },
  iconoIzquierdo: {
    marginRight: 7,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: COLORES.negro,
    paddingVertical: 8,
  },
  botonOjo: {
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  textoError: {
    marginTop: 4,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#991B1B',
  },
  cajaErrorAcceso: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#991B1B',
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 9,
    marginBottom: 10,
  },
  iconoEstado: {
    marginRight: 8,
  },
  textoErrorAcceso: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    color: COLORES.blanco,
    fontSize: 12.5,
  },
  botonReenviar: {
    minHeight: 38,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: COLORES.naranja,
    backgroundColor: 'rgba(255, 247, 237, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  textoBotonReenviar: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12,
    color: COLORES.maderaOscura,
  },
  botonPresionado: {
    opacity: 0.85,
  },
  botonPrincipal: {
    minHeight: 44,
    backgroundColor: COLORES.naranja,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 14,
  },
  botonPrincipalPresionado: {
    opacity: 0.85,
  },
  textoBotonPrincipal: {
    fontFamily: 'Montserrat_800ExtraBold',
    color: COLORES.blanco,
    fontSize: 13.5,
    letterSpacing: 0.5,
  },
  filaCarga: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  botonRecuperarContrasena: {
    alignSelf: 'center',
    marginTop: 12,
    minHeight: 36,
    justifyContent: 'center',
  },
  textoRecuperarContrasena: {
    fontFamily: 'Poppins_600SemiBold',
    color: COLORES.maderaOscura,
    fontSize: 17,
    textDecorationLine: 'underline',
  },
  separador: {
    height: 1.5,
    backgroundColor: COLORES.bordeCeleste,
    marginVertical: 13,
  },
  seccionRegistro: {
    alignItems: 'center',
  },
  textoSinCuenta: {
    fontFamily: 'Poppins_600SemiBold',
    color: COLORES.negro,
    fontSize: 17,
    marginBottom: 8,
  },
  botonSecundario: {
    width: '100%',
    minHeight: 42,
    backgroundColor: COLORES.maderaOscura,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  botonSecundarioPresionado: {
    opacity: 0.85,
  },
  textoBotonSecundario: {
    fontFamily: 'Montserrat_800ExtraBold',
    color: COLORES.blanco,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  botonDeshabilitado: {
    opacity: 0.65,
  },
});
