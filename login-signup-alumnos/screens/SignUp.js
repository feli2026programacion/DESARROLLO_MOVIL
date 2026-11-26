import React, { useRef, useState } from 'react';
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
  createUserWithEmailAndPassword,
  sendEmailVerification,
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
};

const REGEX_SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s]+$/;
const REGEX_CORREO = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const REGEX_MAYUSCULA = /[A-Z]/;
const REGEX_NUMERO = /[0-9]/;
const REGEX_ESPECIAL = /[^A-Za-z0-9]/;

export default function SignUp({ navigation }) {
  const [fuentesCargadas] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  const refScroll = useRef(null);
  const refApellido = useRef(null);
  const refCorreo = useRef(null);
  const refContrasena = useRef(null);
  const refConfirmarContrasena = useRef(null);
  const posicionesCampos = useRef({});

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  const [errorNombre, setErrorNombre] = useState('');
  const [errorApellido, setErrorApellido] = useState('');
  const [errorCorreo, setErrorCorreo] = useState('');
  const [errorContrasena, setErrorContrasena] = useState('');
  const [errorConfirmar, setErrorConfirmar] = useState('');
  const [errorTerminos, setErrorTerminos] = useState('');
  const [errorGeneral, setErrorGeneral] = useState('');

  const [intentoEnvio, setIntentoEnvio] = useState(false);
  const [cargando, setCargando] = useState(false);

  if (!fuentesCargadas) {
    return (
      <View style={estilos.pantallaCarga}>
        <ActivityIndicator size="large" color={COLORES.naranja} />
      </View>
    );
  }

  const irAlCampo = (clave) => {
    const posicionY = posicionesCampos.current[clave];
    if (typeof posicionY === 'number') {
      setTimeout(() => {
        refScroll.current?.scrollTo({
          y: Math.max(0, posicionY - 24),
          animated: true,
        });
      }, 120);
    }
  };

  const cumpleLongitud = contrasena.length >= 8;
  const cumpleMayuscula = REGEX_MAYUSCULA.test(contrasena);
  const cumpleNumero = REGEX_NUMERO.test(contrasena);
  const cumpleEspecial = REGEX_ESPECIAL.test(contrasena);

  const validarNombre = (valor, mostrar = false) => {
    const limpio = valor.trim();
    if (!limpio) {
      if (mostrar || intentoEnvio) setErrorNombre('Ingrese su nombre');
      return false;
    }
    if (!REGEX_SOLO_LETRAS.test(limpio)) {
      if (mostrar || intentoEnvio) {
        setErrorNombre('El nombre solo puede contener letras y espacios');
      }
      return false;
    }
    setErrorNombre('');
    return true;
  };

  const validarApellido = (valor, mostrar = false) => {
    const limpio = valor.trim();
    if (!limpio) {
      if (mostrar || intentoEnvio) setErrorApellido('Ingrese su apellido');
      return false;
    }
    if (!REGEX_SOLO_LETRAS.test(limpio)) {
      if (mostrar || intentoEnvio) {
        setErrorApellido('El apellido solo puede contener letras y espacios');
      }
      return false;
    }
    setErrorApellido('');
    return true;
  };

  const validarCorreo = (valor, mostrar = false) => {
    const limpio = valor.trim();
    if (!limpio) {
      if (mostrar || intentoEnvio) setErrorCorreo('Ingrese su correo electrónico');
      return false;
    }
    if (!REGEX_CORREO.test(limpio)) {
      if (mostrar || intentoEnvio) setErrorCorreo('Ingrese un correo electrónico válido');
      return false;
    }
    setErrorCorreo('');
    return true;
  };

  const validarContrasena = (valor, mostrar = false) => {
    if (!valor) {
      if (mostrar || intentoEnvio) setErrorContrasena('Ingrese una contraseña');
      return false;
    }
    if (valor.length < 8) {
      if (mostrar || intentoEnvio) {
        setErrorContrasena('La contraseña debe tener al menos 8 caracteres');
      }
      return false;
    }
    if (!REGEX_MAYUSCULA.test(valor)) {
      if (mostrar || intentoEnvio) {
        setErrorContrasena('La contraseña debe incluir al menos una letra mayúscula');
      }
      return false;
    }
    if (!REGEX_NUMERO.test(valor)) {
      if (mostrar || intentoEnvio) {
        setErrorContrasena('La contraseña debe incluir al menos un número');
      }
      return false;
    }
    if (!REGEX_ESPECIAL.test(valor)) {
      if (mostrar || intentoEnvio) {
        setErrorContrasena(
          'La contraseña debe incluir al menos un carácter especial (ej. @, #, $, !, *)'
        );
      }
      return false;
    }
    setErrorContrasena('');
    return true;
  };

  const validarConfirmarContrasena = (valorConfirmar, valorPass, mostrar = false) => {
    if (!valorConfirmar) {
      if (mostrar || intentoEnvio) setErrorConfirmar('Confirme su contraseña');
      return false;
    }
    if (valorConfirmar !== valorPass) {
      if (mostrar || intentoEnvio) {
        setErrorConfirmar('Las contraseñas no coinciden');
      }
      return false;
    }
    setErrorConfirmar('');
    return true;
  };

  const validarTerminos = (marcado, mostrar = false) => {
    if (!marcado) {
      if (mostrar || intentoEnvio) {
        setErrorTerminos('Debe aceptar los términos y condiciones para crear su cuenta');
      }
      return false;
    }
    setErrorTerminos('');
    return true;
  };

  const alternarTerminos = () => {
    if (cargando) return;
    const siguienteEstado = !aceptaTerminos;
    setAceptaTerminos(siguienteEstado);
    setErrorGeneral('');
    if (intentoEnvio || errorTerminos) {
      validarTerminos(siguienteEstado, true);
    }
  };

  const registrarUsuario = async () => {
    if (cargando) return;

    setIntentoEnvio(true);
    setErrorGeneral('');

    const nombreLimpio = nombre.trim();
    const apellidoLimpio = apellido.trim();
    const correoLimpio = correo.trim().toLowerCase();

    const nombreValido = validarNombre(nombreLimpio, true);
    const apellidoValido = validarApellido(apellidoLimpio, true);
    const correoValido = validarCorreo(correoLimpio, true);
    const contrasenaValida = validarContrasena(contrasena, true);
    const confirmarValido = validarConfirmarContrasena(confirmarContrasena, contrasena, true);
    const terminosValidos = validarTerminos(aceptaTerminos, true);

    if (
      !nombreValido ||
      !apellidoValido ||
      !correoValido ||
      !contrasenaValida ||
      !confirmarValido ||
      !terminosValidos
    ) {
      setErrorGeneral(
        'Complete los campos obligatorios correctamente y acepte los términos y condiciones'
      );
      return;
    }

    if (!isFirebaseConfigured) {
      setErrorGeneral('La configuración de Firebase no está disponible');
      return;
    }

    setCargando(true);
    try {
      auth.languageCode = 'es';

      const credencialUsuario = await createUserWithEmailAndPassword(
        auth,
        correoLimpio,
        contrasena
      );
      const usuarioCreado = credencialUsuario.user;

      await setDoc(doc(db, 'usuarios', usuarioCreado.uid), {
        uid: usuarioCreado.uid,
        nombre: nombreLimpio,
        apellido: apellidoLimpio,
        correo: correoLimpio,
        rol: 'Administrador',
        emailVerificado: false,
        fechaCreacion: new Date().toISOString(),
      });

      await sendEmailVerification(usuarioCreado);
      await signOut(auth);

      if (navigation?.replace) {
        navigation.replace('Login', {
          pendingVerification: true,
          email: correoLimpio,
        });
      }
    } catch (err) {
      const codigoError = err?.code || '';
      if (codigoError === 'auth/email-already-in-use') {
        setErrorCorreo('Ya existe una cuenta registrada con este correo electrónico');
        setErrorGeneral('Verifique los datos ingresados');
      } else if (codigoError === 'auth/network-request-failed') {
        setErrorGeneral(
          'Sin conexión a internet. Verifique su conexión e intente nuevamente'
        );
      } else {
        setErrorGeneral(
          err?.message || 'No se pudo crear la cuenta. Intente nuevamente'
        );
      }
    } finally {
      setCargando(false);
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            ref={refScroll}
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
                CREAR CUENTA
              </Text>
              <Text style={estilos.subtitulo}>
                Complete sus datos para registrarse y verificar su correo
              </Text>

              {/* Nombre */}
              <View
                style={estilos.grupoCampo}
                onLayout={(e) => {
                  posicionesCampos.current.nombre = e.nativeEvent.layout.y;
                }}
              >
                <Text style={estilos.etiqueta}>NOMBRE</Text>
                <View
                  style={[
                    estilos.contenedorInput,
                    errorNombre ? estilos.bordeErrorInput : null,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={COLORES.maderaOscura}
                    style={estilos.iconoIzquierdo}
                  />
                  <TextInput
                    style={estilos.input}
                    placeholder="Ingrese su nombre"
                    placeholderTextColor="#6E706D"
                    value={nombre}
                    onFocus={() => irAlCampo('nombre')}
                    onChangeText={(texto) => {
                      setNombre(texto);
                      setErrorGeneral('');
                      if (intentoEnvio || errorNombre) validarNombre(texto, true);
                    }}
                    onBlur={() => validarNombre(nombre, true)}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => refApellido.current?.focus()}
                    editable={!cargando}
                    accessibilityLabel="Nombre"
                  />
                </View>
                {errorNombre ? (
                  <Text style={estilos.textoError} accessibilityLiveRegion="polite">
                    {errorNombre}
                  </Text>
                ) : null}
              </View>

              {/* Apellido */}
              <View
                style={estilos.grupoCampo}
                onLayout={(e) => {
                  posicionesCampos.current.apellido = e.nativeEvent.layout.y;
                }}
              >
                <Text style={estilos.etiqueta}>APELLIDO</Text>
                <View
                  style={[
                    estilos.contenedorInput,
                    errorApellido ? estilos.bordeErrorInput : null,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={COLORES.maderaOscura}
                    style={estilos.iconoIzquierdo}
                  />
                  <TextInput
                    ref={refApellido}
                    style={estilos.input}
                    placeholder="Ingrese su apellido"
                    placeholderTextColor="#6E706D"
                    value={apellido}
                    onFocus={() => irAlCampo('apellido')}
                    onChangeText={(texto) => {
                      setApellido(texto);
                      setErrorGeneral('');
                      if (intentoEnvio || errorApellido) validarApellido(texto, true);
                    }}
                    onBlur={() => validarApellido(apellido, true)}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => refCorreo.current?.focus()}
                    editable={!cargando}
                    accessibilityLabel="Apellido"
                  />
                </View>
                {errorApellido ? (
                  <Text style={estilos.textoError} accessibilityLiveRegion="polite">
                    {errorApellido}
                  </Text>
                ) : null}
              </View>

              {/* Correo electrónico */}
              <View
                style={estilos.grupoCampo}
                onLayout={(e) => {
                  posicionesCampos.current.correo = e.nativeEvent.layout.y;
                }}
              >
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
                    ref={refCorreo}
                    style={estilos.input}
                    placeholder="usuario@correo.com"
                    placeholderTextColor="#6E706D"
                    value={correo}
                    onFocus={() => irAlCampo('correo')}
                    onChangeText={(texto) => {
                      setCorreo(texto);
                      setErrorGeneral('');
                      if (intentoEnvio || errorCorreo) validarCorreo(texto, true);
                    }}
                    onBlur={() => validarCorreo(correo, true)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    returnKeyType="next"
                    onSubmitEditing={() => refContrasena.current?.focus()}
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

              {/* Contraseña */}
              <View
                style={estilos.grupoCampo}
                onLayout={(e) => {
                  posicionesCampos.current.contrasena = e.nativeEvent.layout.y;
                }}
              >
                <Text style={estilos.etiqueta}>CONTRASEÑA</Text>
                <View
                  style={[
                    estilos.contenedorInput,
                    errorContrasena ? estilos.bordeErrorInput : null,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={COLORES.maderaOscura}
                    style={estilos.iconoIzquierdo}
                  />
                  <TextInput
                    ref={refContrasena}
                    style={estilos.input}
                    placeholder="Mín. 8 car., mayúscula, número y símbolo"
                    placeholderTextColor="#6E706D"
                    value={contrasena}
                    onFocus={() => irAlCampo('contrasena')}
                    onChangeText={(texto) => {
                      setContrasena(texto);
                      setErrorGeneral('');
                      if (intentoEnvio || errorContrasena) validarContrasena(texto, true);
                      if (intentoEnvio || errorConfirmar) {
                        validarConfirmarContrasena(confirmarContrasena, texto, true);
                      }
                    }}
                    onBlur={() => validarContrasena(contrasena, true)}
                    secureTextEntry={!mostrarContrasena}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    returnKeyType="next"
                    onSubmitEditing={() => refConfirmarContrasena.current?.focus()}
                    editable={!cargando}
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
                      size={22}
                      color={COLORES.maderaOscura}
                    />
                  </Pressable>
                </View>

                <View style={estilos.contenedorRequisitos}>
                  <View style={estilos.filaRequisito}>
                    <Ionicons
                      name={cumpleLongitud ? 'checkmark-circle' : 'ellipse-outline'}
                      size={15}
                      color={cumpleLongitud ? '#15803D' : COLORES.maderaOscura}
                    />
                    <Text
                      style={[
                        estilos.textoRequisito,
                        cumpleLongitud && estilos.textoRequisitoValido,
                      ]}
                    >
                      Mínimo 8 caracteres
                    </Text>
                  </View>

                  <View style={estilos.filaRequisito}>
                    <Ionicons
                      name={cumpleMayuscula ? 'checkmark-circle' : 'ellipse-outline'}
                      size={15}
                      color={cumpleMayuscula ? '#15803D' : COLORES.maderaOscura}
                    />
                    <Text
                      style={[
                        estilos.textoRequisito,
                        cumpleMayuscula && estilos.textoRequisitoValido,
                      ]}
                    >
                      Al menos una letra mayúscula (A-Z)
                    </Text>
                  </View>

                  <View style={estilos.filaRequisito}>
                    <Ionicons
                      name={cumpleNumero ? 'checkmark-circle' : 'ellipse-outline'}
                      size={15}
                      color={cumpleNumero ? '#15803D' : COLORES.maderaOscura}
                    />
                    <Text
                      style={[
                        estilos.textoRequisito,
                        cumpleNumero && estilos.textoRequisitoValido,
                      ]}
                    >
                      Al menos un número (0-9)
                    </Text>
                  </View>

                  <View style={estilos.filaRequisito}>
                    <Ionicons
                      name={cumpleEspecial ? 'checkmark-circle' : 'ellipse-outline'}
                      size={15}
                      color={cumpleEspecial ? '#15803D' : COLORES.maderaOscura}
                    />
                    <Text
                      style={[
                        estilos.textoRequisito,
                        cumpleEspecial && estilos.textoRequisitoValido,
                      ]}
                    >
                      Al menos un carácter especial (@, #, $, !, *, etc.)
                    </Text>
                  </View>
                </View>

                {errorContrasena ? (
                  <Text style={estilos.textoError} accessibilityLiveRegion="polite">
                    {errorContrasena}
                  </Text>
                ) : null}
              </View>

              {/* Confirmar contraseña */}
              <View
                style={estilos.grupoCampo}
                onLayout={(e) => {
                  posicionesCampos.current.confirmarContrasena = e.nativeEvent.layout.y;
                }}
              >
                <Text style={estilos.etiqueta}>CONFIRMAR CONTRASEÑA</Text>
                <View
                  style={[
                    estilos.contenedorInput,
                    errorConfirmar ? estilos.bordeErrorInput : null,
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color={COLORES.maderaOscura}
                    style={estilos.iconoIzquierdo}
                  />
                  <TextInput
                    ref={refConfirmarContrasena}
                    style={estilos.input}
                    placeholder="Repita su contraseña"
                    placeholderTextColor="#6E706D"
                    value={confirmarContrasena}
                    onFocus={() => irAlCampo('confirmarContrasena')}
                    onChangeText={(texto) => {
                      setConfirmarContrasena(texto);
                      setErrorGeneral('');
                      if (intentoEnvio || errorConfirmar) {
                        validarConfirmarContrasena(texto, contrasena, true);
                      }
                    }}
                    onBlur={() =>
                      validarConfirmarContrasena(confirmarContrasena, contrasena, true)
                    }
                    secureTextEntry={!mostrarConfirmar}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    returnKeyType="done"
                    onSubmitEditing={registrarUsuario}
                    editable={!cargando}
                    accessibilityLabel="Confirmar contraseña"
                  />
                  <Pressable
                    onPress={() => setMostrarConfirmar((prev) => !prev)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={estilos.botonOjo}
                    accessibilityRole="button"
                    accessibilityLabel={
                      mostrarConfirmar
                        ? 'Ocultar confirmación de contraseña'
                        : 'Mostrar confirmación de contraseña'
                    }
                  >
                    <Ionicons
                      name={mostrarConfirmar ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color={COLORES.maderaOscura}
                    />
                  </Pressable>
                </View>
                {errorConfirmar ? (
                  <Text style={estilos.textoError} accessibilityLiveRegion="polite">
                    {errorConfirmar}
                  </Text>
                ) : null}
              </View>

              {/* Términos y condiciones */}
              <View style={estilos.seccionTerminos}>
                <View style={estilos.filaTerminos}>
                  <Pressable
                    onPress={alternarTerminos}
                    disabled={cargando}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={[
                      estilos.cajaCheckbox,
                      aceptaTerminos && estilos.checkboxMarcado,
                      errorTerminos && !aceptaTerminos ? estilos.checkboxError : null,
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: aceptaTerminos }}
                    accessibilityLabel="Aceptar términos y condiciones"
                  >
                    {aceptaTerminos ? (
                      <Ionicons name="checkmark" size={18} color={COLORES.blanco} />
                    ) : null}
                  </Pressable>

                  <View style={estilos.contenedorTextoTerminos}>
                    <Pressable onPress={alternarTerminos} disabled={cargando}>
                      <Text style={estilos.textoTerminos}>Acepto los </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        if (!cargando && navigation?.navigate) {
                          navigation.navigate('TerminosCodicones');
                        }
                      }}
                      disabled={cargando}
                      accessibilityRole="link"
                    >
                      <Text style={estilos.enlaceTerminos}>términos y condiciones</Text>
                    </Pressable>
                  </View>
                </View>

                {errorTerminos ? (
                  <Text style={estilos.textoError} accessibilityLiveRegion="polite">
                    {errorTerminos}
                  </Text>
                ) : null}
              </View>

              {/* Aviso general */}
              {errorGeneral ? (
                <View style={estilos.cajaErrorGeneral} accessibilityLiveRegion="polite">
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color={COLORES.blanco}
                    style={estilos.iconoError}
                  />
                  <Text style={estilos.textoErrorGeneral}>{errorGeneral}</Text>
                </View>
              ) : null}

              {/* Botón principal */}
              <Pressable
                style={({ pressed }) => [
                  estilos.botonPrincipal,
                  pressed && !cargando && estilos.botonPrincipalPresionado,
                  cargando && estilos.botonDeshabilitado,
                ]}
                onPress={registrarUsuario}
                disabled={cargando}
                android_ripple={{ color: 'rgba(255, 255, 255, 0.25)' }}
                accessibilityRole="button"
                accessibilityLabel="Crear cuenta"
              >
                {cargando ? (
                  <View style={estilos.filaCarga}>
                    <ActivityIndicator size="small" color={COLORES.blanco} />
                    <Text style={estilos.textoBotonPrincipal}>CREANDO CUENTA...</Text>
                  </View>
                ) : (
                  <Text style={estilos.textoBotonPrincipal}>CREAR CUENTA</Text>
                )}
              </Pressable>

              <View style={estilos.separador} />

              {/* Volver a Iniciar sesión */}
              <View style={estilos.filaPie}>
                <Text style={estilos.textoPie}>¿Ya tenés cuenta? </Text>
                <Pressable
                  onPress={() => {
                    if (!cargando && navigation?.navigate) {
                      navigation.navigate('Login');
                    }
                  }}
                  disabled={cargando}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  accessibilityRole="link"
                >
                  <Text style={estilos.enlacePie}>Iniciar sesión</Text>
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
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  contenedorTeclado: {
    flex: 1,
  },
  contenidoScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingTop: 30,
    paddingBottom: 180,
  },
  tarjeta: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 26,
    borderWidth: 2,
    borderColor: COLORES.grisMedio,
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  contenedorLogo: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: COLORES.amarilloDorado,
    backgroundColor: COLORES.negro,
    marginBottom: 12,
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
  grupoCampo: {
    marginBottom: 13,
  },
  etiqueta: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12.5,
    color: COLORES.negro,
    marginBottom: 5,
    letterSpacing: 0.4,
  },
  contenedorInput: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
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
    fontSize: 14.5,
    color: COLORES.negro,
    paddingVertical: 9,
  },
  botonOjo: {
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  contenedorRequisitos: {
    marginTop: 7,
    gap: 3,
    paddingHorizontal: 2,
  },
  filaRequisito: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  textoRequisito: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: COLORES.maderaOscura,
  },
  textoRequisitoValido: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#15803D',
  },
  textoError: {
    marginTop: 5,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#991B1B',
  },
  seccionTerminos: {
    marginTop: 4,
    marginBottom: 10,
  },
  filaTerminos: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cajaCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORES.maderaOscura,
    backgroundColor: COLORES.blanco,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxMarcado: {
    backgroundColor: COLORES.naranja,
    borderColor: COLORES.naranja,
  },
  checkboxError: {
    borderColor: '#991B1B',
    backgroundColor: '#FEF2F2',
  },
  contenedorTextoTerminos: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  textoTerminos: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13.5,
    color: COLORES.negro,
  },
  enlaceTerminos: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13.5,
    color: COLORES.naranja,
    textDecorationLine: 'underline',
  },
  cajaErrorGeneral: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#991B1B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  iconoError: {
    marginRight: 8,
  },
  textoErrorGeneral: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 12.5,
    color: COLORES.blanco,
  },
  botonPrincipal: {
    minHeight: 50,
    backgroundColor: COLORES.naranja,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
  },
  botonPrincipalPresionado: {
    opacity: 0.85,
  },
  textoBotonPrincipal: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 14.5,
    color: COLORES.blanco,
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
    marginVertical: 14,
  },
  filaPie: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  textoPie: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: COLORES.negro,
  },
  enlacePie: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    color: COLORES.maderaOscura,
    textDecorationLine: 'underline',
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
});