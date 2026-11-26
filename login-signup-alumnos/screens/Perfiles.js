import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import * as ImagePicker from 'expo-image-picker';
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
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../src/config/firebaseConfig';

const COLORES = {
  blanco: '#FFFFFF',
  negro: '#000000',
  naranja: '#FF6600',
  amarilloDorado: '#FDB813',
  maderaOscura: '#3D2B1F',
  grisMedio: '#BDBFBC',
};

const MIN_NOMBRE_APELLIDO = 3;
const MAX_NOMBRE_APELLIDO = 30;

const REGEX_SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s]+$/;

export default function Perfiles({ navigation }) {
  const [fuentesCargadas] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [correo, setCorreo] = useState('');
  const [rol, setRol] = useState('Administrador');
  const [imagen, setImagen] = useState('');

  const [errorNombre, setErrorNombre] = useState('');
  const [errorApellido, setErrorApellido] = useState('');
  const [errorGeneral, setErrorGeneral] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  useEffect(() => {
    let activo = true;

    const cargarPerfil = async () => {
      const usuarioActual = auth.currentUser;
      if (!usuarioActual) {
        if (activo) {
          setErrorGeneral('No hay una sesión activa.');
          setCargandoDatos(false);
        }
        return;
      }

      const correoInicial = (usuarioActual.email || '').trim().toLowerCase();

      try {
        const refDoc = doc(db, 'usuarios', usuarioActual.uid);
        const snap = await getDoc(refDoc);

        if (!activo) return;

        if (snap.exists()) {
          const datos = snap.data();
          const correoDoc = (datos?.correo || correoInicial).trim().toLowerCase();
          setNombre(datos?.nombre || '');
          setApellido(datos?.apellido || '');
          setCorreo(correoDoc);
          setRol(datos?.rol || 'Administrador');
          setImagen(datos?.imagen || '');
        } else {
          setCorreo(correoInicial);
        }
      } catch (_error) {
        if (activo) {
          setCorreo(correoInicial);
          setErrorGeneral('No se pudieron cargar todos los datos del perfil.');
        }
      } finally {
        if (activo) {
          setCargandoDatos(false);
        }
      }
    };

    cargarPerfil();

    return () => {
      activo = false;
    };
  }, []);

  if (!fuentesCargadas) {
    return (
      <View style={estilos.pantallaCarga}>
        <ActivityIndicator size="large" color={COLORES.naranja} />
      </View>
    );
  }

  const validarNombre = (valor, mostrar = false) => {
    const limpio = valor.trim();
    if (!limpio) {
      if (mostrar) setErrorNombre('Ingrese su nombre');
      return false;
    }
    if (!REGEX_SOLO_LETRAS.test(limpio)) {
      if (mostrar) {
        setErrorNombre(
          'El nombre solo puede contener letras y espacios (sin números ni símbolos)'
        );
      }
      return false;
    }
    if (limpio.length < MIN_NOMBRE_APELLIDO) {
      if (mostrar) {
        setErrorNombre(
          `El nombre debe tener al menos ${MIN_NOMBRE_APELLIDO} caracteres`
        );
      }
      return false;
    }
    if (limpio.length > MAX_NOMBRE_APELLIDO) {
      if (mostrar) {
        setErrorNombre(
          `El nombre no puede superar los ${MAX_NOMBRE_APELLIDO} caracteres`
        );
      }
      return false;
    }
    setErrorNombre('');
    return true;
  };

  const validarApellido = (valor, mostrar = false) => {
    const limpio = valor.trim();
    if (!limpio) {
      if (mostrar) setErrorApellido('Ingrese su apellido');
      return false;
    }
    if (!REGEX_SOLO_LETRAS.test(limpio)) {
      if (mostrar) {
        setErrorApellido(
          'El apellido solo puede contener letras y espacios (sin números ni símbolos)'
        );
      }
      return false;
    }
    if (limpio.length < MIN_NOMBRE_APELLIDO) {
      if (mostrar) {
        setErrorApellido(
          `El apellido debe tener al menos ${MIN_NOMBRE_APELLIDO} caracteres`
        );
      }
      return false;
    }
    if (limpio.length > MAX_NOMBRE_APELLIDO) {
      if (mostrar) {
        setErrorApellido(
          `El apellido no puede superar los ${MAX_NOMBRE_APELLIDO} caracteres`
        );
      }
      return false;
    }
    setErrorApellido('');
    return true;
  };

  const tomarFotoPerfil = async () => {
    if (guardando) return;
    setErrorGeneral('');
    setMensajeExito('');

    try {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (!permiso.granted) {
        setErrorGeneral(
          'Necesitamos permiso para acceder a la cámara del dispositivo y tomar su foto de perfil.'
        );
        return;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.25,
        base64: true,
      });

      if (resultado.canceled) {
        return;
      }

      const asset = resultado.assets?.[0];
      if (asset?.base64) {
        const mime = asset.mimeType || 'image/jpeg';
        const fotoBase64 = `data:${mime};base64,${asset.base64}`;
        setImagen(fotoBase64);
      } else if (asset?.uri) {
        setImagen(asset.uri);
      }
    } catch (_error) {
      setErrorGeneral('No se pudo abrir la cámara del dispositivo.');
    }
  };

  const guardarCambios = async () => {
    if (guardando) return;

    setErrorGeneral('');
    setMensajeExito('');

    const usuarioActual = auth.currentUser;
    if (!usuarioActual || !isFirebaseConfigured) {
      setErrorGeneral(
        'No se pudo verificar la sesión o la configuración de Firebase.'
      );
      return;
    }

    const nombreLimpio = nombre.trim();
    const apellidoLimpio = apellido.trim();
    const correoFijo = (usuarioActual.email || correo || '').trim().toLowerCase();

    const nombreOk = validarNombre(nombreLimpio, true);
    const apellidoOk = validarApellido(apellidoLimpio, true);

    if (!nombreOk || !apellidoOk) {
      setErrorGeneral('Revise los campos marcados antes de guardar.');
      return;
    }

    setGuardando(true);
    try {
      const refDoc = doc(db, 'usuarios', usuarioActual.uid);
      await setDoc(
        refDoc,
        {
          uid: usuarioActual.uid,
          nombre: nombreLimpio,
          apellido: apellidoLimpio,
          correo: correoFijo,
          rol: rol || 'Administrador',
          imagen: imagen || '',
          fechaActualizacion: new Date().toISOString(),
        },
        { merge: true }
      );

      setNombre(nombreLimpio);
      setApellido(apellidoLimpio);
      setCorreo(correoFijo);
      setModoEdicion(false);
      setMensajeExito('Perfil actualizado correctamente.');
    } catch (_error) {
      setErrorGeneral(
        'No se pudieron guardar los cambios en este momento. Inténtelo nuevamente.'
      );
    } finally {
      setGuardando(false);
    }
  };

  const cancelarEdicion = () => {
    setModoEdicion(false);
    setErrorNombre('');
    setErrorApellido('');
    setErrorGeneral('');
  };

  return (
    <View style={estilos.contenedorPrincipal}>
      <View style={estilos.barraSuperior}>
        <Pressable
          onPress={() => navigation.goBack()}
          disabled={guardando}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={({ pressed }) => [
            estilos.botonVolver,
            pressed && estilos.botonPresionado,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name="arrow-back" size={24} color={COLORES.negro} />
        </Pressable>

        <Text style={estilos.tituloEncabezado}>MI PERFIL</Text>

        <View style={estilos.espaciadorDerecha} />
      </View>

      <KeyboardAvoidingView
        style={estilos.contenedorTeclado}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={estilos.contenidoScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {cargandoDatos ? (
            <View style={estilos.cajaCargando}>
              <ActivityIndicator size="large" color={COLORES.naranja} />
              <Text style={estilos.textoCargando}>Cargando datos del perfil...</Text>
            </View>
          ) : (
            <View style={estilos.tarjeta}>
              {/* Avatar del usuario (más grande al editar + ícono de cámara abajo) */}
              <View style={estilos.seccionAvatar}>
                <View
                  style={[
                    estilos.contenedorAvatar,
                    modoEdicion && estilos.contenedorAvatarEdicion,
                  ]}
                >
                  {imagen ? (
                    <Image
                      source={{ uri: imagen }}
                      style={estilos.imagenAvatar}
                      resizeMode="cover"
                      accessibilityLabel="Foto de perfil del usuario"
                    />
                  ) : (
                    <View style={estilos.personitaNaranja}>
                      <Ionicons
                        name="person"
                        size={modoEdicion ? 68 : 54}
                        color={COLORES.blanco}
                      />
                    </View>
                  )}
                </View>

                {modoEdicion ? (
                  <Pressable
                    onPress={tomarFotoPerfil}
                    disabled={guardando}
                    style={({ pressed }) => [
                      estilos.botonCamaraAbajo,
                      pressed && estilos.botonPresionado,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Abrir cámara para tomar foto de perfil"
                  >
                    <Ionicons name="camera" size={22} color={COLORES.blanco} />
                  </Pressable>
                ) : null}
              </View>

              {mensajeExito ? (
                <View style={estilos.cajaExito}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color={COLORES.blanco}
                  />
                  <Text style={estilos.textoExito}>{mensajeExito}</Text>
                </View>
              ) : null}

              {errorGeneral ? (
                <View style={estilos.cajaErrorGeneral}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color={COLORES.blanco}
                  />
                  <Text style={estilos.textoErrorGeneral}>{errorGeneral}</Text>
                </View>
              ) : null}

              {/* Campo Nombre */}
              <View style={estilos.grupoCampo}>
                <Text style={estilos.etiqueta}>NOMBRE</Text>
                {modoEdicion ? (
                  <TextInput
                    style={[
                      estilos.input,
                      errorNombre ? estilos.bordeError : null,
                    ]}
                    value={nombre}
                    onChangeText={(texto) => {
                      setNombre(texto);
                      setErrorGeneral('');
                      setMensajeExito('');
                      if (texto.trim().length > MAX_NOMBRE_APELLIDO) {
                        setErrorNombre(
                          `El nombre no puede superar los ${MAX_NOMBRE_APELLIDO} caracteres`
                        );
                      } else if (errorNombre) {
                        validarNombre(texto, true);
                      }
                    }}
                    onBlur={() => validarNombre(nombre, true)}
                    placeholder="Ingrese su nombre"
                    placeholderTextColor="#6E706D"
                    autoCapitalize="words"
                    autoCorrect={false}
                    maxLength={MAX_NOMBRE_APELLIDO}
                    editable={!guardando}
                  />
                ) : (
                  <View style={estilos.cajaDato}>
                    <Text style={estilos.textoDato}>{nombre || '-'}</Text>
                  </View>
                )}
                {errorNombre ? (
                  <Text style={estilos.textoError}>{errorNombre}</Text>
                ) : null}
              </View>

              {/* Campo Apellido */}
              <View style={estilos.grupoCampo}>
                <Text style={estilos.etiqueta}>APELLIDO</Text>
                {modoEdicion ? (
                  <TextInput
                    style={[
                      estilos.input,
                      errorApellido ? estilos.bordeError : null,
                    ]}
                    value={apellido}
                    onChangeText={(texto) => {
                      setApellido(texto);
                      setErrorGeneral('');
                      setMensajeExito('');
                      if (texto.trim().length > MAX_NOMBRE_APELLIDO) {
                        setErrorApellido(
                          `El apellido no puede superar los ${MAX_NOMBRE_APELLIDO} caracteres`
                        );
                      } else if (errorApellido) {
                        validarApellido(texto, true);
                      }
                    }}
                    onBlur={() => validarApellido(apellido, true)}
                    placeholder="Ingrese su apellido"
                    placeholderTextColor="#6E706D"
                    autoCapitalize="words"
                    autoCorrect={false}
                    maxLength={MAX_NOMBRE_APELLIDO}
                    editable={!guardando}
                  />
                ) : (
                  <View style={estilos.cajaDato}>
                    <Text style={estilos.textoDato}>{apellido || '-'}</Text>
                  </View>
                )}
                {errorApellido ? (
                  <Text style={estilos.textoError}>{errorApellido}</Text>
                ) : null}
              </View>

              {/* Campo Correo Electrónico (solo lectura, no editable) */}
              <View style={estilos.grupoCampo}>
                <Text style={estilos.etiqueta}>CORREO ELECTRÓNICO</Text>
                <View style={estilos.cajaDatoBloqueado}>
                  <Text style={estilos.textoDatoBloqueado}>{correo || '-'}</Text>
                </View>
              </View>

              {/* Campo Rol (solo lectura) */}
              <View style={estilos.grupoCampo}>
                <Text style={estilos.etiqueta}>ROL</Text>
                <View style={estilos.cajaDatoBloqueado}>
                  <Text style={estilos.textoDatoBloqueado}>{rol}</Text>
                </View>
              </View>

              {/* Acciones */}
              {modoEdicion ? (
                <View style={estilos.contenedorBotonesEdicion}>
                  <Pressable
                    style={({ pressed }) => [
                      estilos.botonGuardar,
                      pressed && !guardando && estilos.botonPresionado,
                      guardando && estilos.botonDeshabilitado,
                    ]}
                    onPress={guardarCambios}
                    disabled={guardando}
                    accessibilityRole="button"
                  >
                    {guardando ? (
                      <ActivityIndicator size="small" color={COLORES.blanco} />
                    ) : (
                      <Text style={estilos.textoBotonBlanco}>GUARDAR CAMBIOS</Text>
                    )}
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      estilos.botonCancelar,
                      pressed && !guardando && estilos.botonPresionado,
                    ]}
                    onPress={cancelarEdicion}
                    disabled={guardando}
                    accessibilityRole="button"
                  >
                    <Text style={estilos.textoBotonOscuro}>CANCELAR</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    estilos.botonEditar,
                    pressed && estilos.botonPresionado,
                  ]}
                  onPress={() => {
                    setMensajeExito('');
                    setErrorGeneral('');
                    setModoEdicion(true);
                  }}
                  accessibilityRole="button"
                >
                  <Ionicons name="create-outline" size={20} color={COLORES.blanco} />
                  <Text style={estilos.textoBotonBlanco}>EDITAR PERFIL</Text>
                </Pressable>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantallaCarga: {
    flex: 1,
    backgroundColor: COLORES.blanco,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contenedorPrincipal: {
    flex: 1,
    backgroundColor: COLORES.blanco,
  },
  barraSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 44,
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: COLORES.blanco,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.grisMedio,
  },
  botonVolver: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORES.blanco,
    borderWidth: 1.5,
    borderColor: COLORES.grisMedio,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tituloEncabezado: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 16,
    color: COLORES.negro,
    letterSpacing: 0.6,
  },
  espaciadorDerecha: {
    width: 42,
  },
  contenedorTeclado: {
    flex: 1,
  },
  contenidoScroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
  },
  cajaCargando: {
    marginTop: 60,
    alignItems: 'center',
    gap: 10,
  },
  textoCargando: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: COLORES.maderaOscura,
  },
  tarjeta: {
    backgroundColor: COLORES.blanco,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: COLORES.grisMedio,
    padding: 20,
  },
  seccionAvatar: {
    alignItems: 'center',
    marginBottom: 18,
  },
  contenedorAvatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: COLORES.amarilloDorado,
    backgroundColor: COLORES.naranja,
  },
  contenedorAvatarEdicion: {
    width: 146,
    height: 146,
    borderRadius: 73,
    borderWidth: 3.5,
  },
  imagenAvatar: {
    width: '100%',
    height: '100%',
  },
  personitaNaranja: {
    flex: 1,
    backgroundColor: COLORES.naranja,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonCamaraAbajo: {
    marginTop: -20,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORES.maderaOscura,
    borderWidth: 2.5,
    borderColor: COLORES.blanco,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cajaExito: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#15803D',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  textoExito: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: COLORES.blanco,
  },
  cajaErrorGeneral: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#991B1B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  textoErrorGeneral: {
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
    fontSize: 12.5,
    color: COLORES.negro,
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  input: {
    minHeight: 48,
    backgroundColor: COLORES.blanco,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORES.grisMedio,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14.5,
    color: COLORES.negro,
  },
  bordeError: {
    borderColor: '#991B1B',
    backgroundColor: '#FEF2F2',
  },
  cajaDato: {
    minHeight: 46,
    justifyContent: 'center',
    backgroundColor: COLORES.blanco,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORES.grisMedio,
    paddingHorizontal: 14,
  },
  textoDato: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14.5,
    color: COLORES.negro,
  },
  cajaDatoBloqueado: {
    minHeight: 46,
    justifyContent: 'center',
    backgroundColor: '#F5F5F4',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORES.grisMedio,
    paddingHorizontal: 14,
  },
  textoDatoBloqueado: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORES.maderaOscura,
  },
  textoError: {
    marginTop: 5,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#991B1B',
  },
  botonEditar: {
    marginTop: 8,
    minHeight: 50,
    backgroundColor: COLORES.naranja,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  contenedorBotonesEdicion: {
    marginTop: 8,
    gap: 10,
  },
  botonGuardar: {
    minHeight: 50,
    backgroundColor: COLORES.naranja,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonCancelar: {
    minHeight: 46,
    backgroundColor: COLORES.blanco,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: COLORES.maderaOscura,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBotonBlanco: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 14,
    color: COLORES.blanco,
    letterSpacing: 0.5,
  },
  textoBotonOscuro: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13.5,
    color: COLORES.maderaOscura,
    letterSpacing: 0.5,
  },
  botonPresionado: {
    opacity: 0.82,
  },
  botonDeshabilitado: {
    opacity: 0.65,
  },
});