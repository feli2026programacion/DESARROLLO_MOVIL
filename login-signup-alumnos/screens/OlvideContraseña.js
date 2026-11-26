import React, { useState } from 'react';
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
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../src/config/firebaseConfig';

const COLORES = {
  blanco: '#FFFFFF',
  negro: '#000000',
  naranja: '#FF6600',
  amarilloDorado: '#FDB813',
  maderaOscura: '#3D2B1F',
  grisMedio: '#BDBFBC',
};

const REGEX_CORREO = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function OlvideContrasena({ navigation }) {
  // Carga de fuentes y estados de envío
  const [fuentesCargadas] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  const [correo, setCorreo] = useState('');
  const [errorCorreo, setErrorCorreo] = useState('');
  const [errorEnvio, setErrorEnvio] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [intentoEnvio, setIntentoEnvio] = useState(false);
  const [cargando, setCargando] = useState(false);

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

  const cambiarCorreo = (texto) => {
    setCorreo(texto);
    setErrorEnvio('');
    setMensajeExito('');
    if (intentoEnvio || errorCorreo) {
      validarCorreo(texto, true);
    }
  };

  const enviarEnlaceRecuperacion = async () => {
    if (cargando) return;

    setIntentoEnvio(true);
    setErrorEnvio('');
    setMensajeExito('');

    const correoLimpio = correo.trim();
    if (!validarCorreo(correoLimpio, true)) {
      return;
    }

    if (!isFirebaseConfigured) {
      setErrorEnvio('La configuración de Firebase no está disponible');
      return;
    }

    setCargando(true);
    try {
      await sendPasswordResetEmail(auth, correoLimpio);
      setMensajeExito(
        `Enviamos un enlace de recuperación a ${correoLimpio}. Revisá tu bandeja de entrada o la carpeta de spam.`
      );
    } catch (err) {
      const codigo = err?.code || '';
      if (codigo === 'auth/network-request-failed') {
        setErrorEnvio(
          'No pudimos conectarnos. Verifique su conexión a internet e inténtelo nuevamente'
        );
      } else if (codigo === 'auth/too-many-requests') {
        setErrorEnvio(
          'Se realizaron demasiados intentos. Espere unos minutos antes de volver a intentarlo'
        );
      } else if (
        codigo === 'auth/user-not-found' ||
        codigo === 'auth/invalid-email'
      ) {
        setErrorEnvio('No encontramos una cuenta asociada a ese correo electrónico');
      } else {
        setErrorEnvio(
          'El servicio no está disponible en este momento. Inténtelo nuevamente más tarde'
        );
      }
    } finally {
      setCargando(false);
    }
  };

  const volverALogin = () => {
    if (cargando) return;
    if (navigation?.goBack) {
      navigation.goBack();
    } else if (navigation?.navigate) {
      navigation.navigate('Login');
    }
  };

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
                RECUPERAR CONTRASEÑA
              </Text>
              <Text style={estilos.subtitulo}>
                Ingrese su correo electrónico para recibir un enlace y restablecer su contraseña
              </Text>

              {mensajeExito ? (
                <View style={estilos.cajaExito} accessibilityLiveRegion="polite">
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color={COLORES.blanco}
                    style={estilos.iconoEstado}
                  />
                  <Text style={estilos.textoEstado}>{mensajeExito}</Text>
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
                    size={20}
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
                    returnKeyType="done"
                    onSubmitEditing={enviarEnlaceRecuperacion}
                    editable={!cargando}
                    accessibilityLabel="Correo electrónico"
                  />
                </View>
                {errorCorreo ? (
                  <Text style={estilos.textoError} accessibilityLiveRegion="polite">
                    {errorCorreo}
                  </Text>
                ) : null}
              </View>

              {/* Error general de envío / conexión */}
              {errorEnvio ? (
                <View style={estilos.cajaError} accessibilityLiveRegion="polite">
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color={COLORES.blanco}
                    style={estilos.iconoEstado}
                  />
                  <Text style={estilos.textoEstado}>{errorEnvio}</Text>
                </View>
              ) : null}

              {/* Botón principal Enviar enlace */}
              <Pressable
                style={({ pressed }) => [
                  estilos.botonPrincipal,
                  pressed && !cargando && estilos.botonPrincipalPresionado,
                  cargando && estilos.botonDeshabilitado,
                ]}
                onPress={enviarEnlaceRecuperacion}
                disabled={cargando}
                android_ripple={{ color: 'rgba(255, 255, 255, 0.25)' }}
                accessibilityRole="button"
                accessibilityLabel="Enviar enlace de recuperación"
              >
                {cargando ? (
                  <View style={estilos.filaCarga}>
                    <ActivityIndicator size="small" color={COLORES.blanco} />
                    <Text style={estilos.textoBotonPrincipal}>ENVIANDO...</Text>
                  </View>
                ) : (
                  <Text style={estilos.textoBotonPrincipal}>ENVIAR ENLACE</Text>
                )}
              </Pressable>

              <View style={estilos.separador} />

              {/* Botón secundario Volver a Iniciar sesión */}
              <Pressable
                style={({ pressed }) => [
                  estilos.botonSecundario,
                  pressed && !cargando && estilos.botonSecundarioPresionado,
                  cargando && estilos.botonDeshabilitado,
                ]}
                onPress={volverALogin}
                disabled={cargando}
                android_ripple={{ color: 'rgba(253, 184, 19, 0.2)' }}
                accessibilityRole="button"
                accessibilityLabel="Volver a iniciar sesión"
              >
                <Text style={estilos.textoBotonSecundario}>
                  VOLVER A INICIAR SESIÓN
                </Text>
              </Pressable>
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
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  contenedorTeclado: {
    flex: 1,
  },
  contenidoScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 32,
  },
  tarjeta: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 26,
    borderWidth: 2,
    borderColor: COLORES.grisMedio,
    paddingHorizontal: 22,
    paddingVertical: 26,
  },
  contenedorLogo: {
    alignSelf: 'center',
    width: 114,
    height: 114,
    borderRadius: 57,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: COLORES.amarilloDorado,
    backgroundColor: COLORES.negro,
    marginBottom: 14,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  tituloMarca: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 21,
    color: COLORES.negro,
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  subtitulo: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
    color: COLORES.maderaOscura,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
    lineHeight: 18,
  },
  cajaExito: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORES.maderaOscura,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  cajaError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#991B1B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  iconoEstado: {
    marginRight: 8,
  },
  textoEstado: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 12.5,
    color: COLORES.blanco,
  },
  grupoCampo: {
    marginBottom: 14,
  },
  etiqueta: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13,
    color: COLORES.negro,
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  contenedorInput: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    backgroundColor: COLORES.blanco,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORES.grisMedio,
    paddingHorizontal: 12,
  },
  bordeErrorInput: {
    borderColor: '#991B1B',
    backgroundColor: '#FEF2F2',
  },
  iconoIzquierdo: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: COLORES.negro,
    paddingVertical: 10,
  },
  textoError: {
    marginTop: 5,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12.5,
    color: '#991B1B',
  },
  botonPrincipal: {
    minHeight: 52,
    backgroundColor: COLORES.naranja,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
  },
  botonPrincipalPresionado: {
    opacity: 0.85,
  },
  textoBotonPrincipal: {
    fontFamily: 'Montserrat_800ExtraBold',
    color: COLORES.blanco,
    fontSize: 15,
    letterSpacing: 0.6,
  },
  filaCarga: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  separador: {
    height: 1.5,
    backgroundColor: COLORES.grisMedio,
    marginVertical: 16,
  },
  botonSecundario: {
    width: '100%',
    minHeight: 50,
    backgroundColor: COLORES.maderaOscura,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  botonSecundarioPresionado: {
    opacity: 0.85,
  },
  textoBotonSecundario: {
    fontFamily: 'Montserrat_800ExtraBold',
    color: COLORES.blanco,
    fontSize: 14.5,
    letterSpacing: 0.6,
  },
  botonDeshabilitado: {
    opacity: 0.65,
  },
});