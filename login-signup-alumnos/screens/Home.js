import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
import { doc, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../src/config/firebaseConfig';

const COLORES = {
  blanco: '#FFFFFF',
  negro: '#000000',
  naranja: '#FF6600',
  amarilloDorado: '#FDB813',
  maderaOscura: '#3D2B1F',
  grisMedio: '#BDBFBC',
};

const ANCHO_PANTALLA = Dimensions.get('window').width;
const ANCHO_MENU = Math.min(ANCHO_PANTALLA * 0.78, 320);

export default function Home({ navigation }) {
  const [fuentesCargadas] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [renderizarMenu, setRenderizarMenu] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [rolUsuario, setRolUsuario] = useState('Administrador');
  const [imagenUsuario, setImagenUsuario] = useState('');
  const [cargandoPerfil, setCargandoPerfil] = useState(true);
  const [avisoSeccion, setAvisoSeccion] = useState('');

  const posicionMenuX = useRef(new Animated.Value(-ANCHO_MENU)).current;

  useEffect(() => {
    const usuarioActual = auth.currentUser;
    if (!usuarioActual) {
      setNombreUsuario('Usuario');
      setCargandoPerfil(false);
      return;
    }

    const respaldoCorreo = usuarioActual.email
      ? usuarioActual.email.split('@')[0]
      : 'Usuario';

    const referenciaDoc = doc(db, 'usuarios', usuarioActual.uid);

    const desuscribir = onSnapshot(
      referenciaDoc,
      (instantanea) => {
        if (instantanea.exists()) {
          const datos = instantanea.data();
          const nombreCompleto = [datos?.nombre, datos?.apellido]
            .filter(Boolean)
            .join(' ')
            .trim();
          setNombreUsuario(nombreCompleto || datos?.nombre || respaldoCorreo);
          if (datos?.rol) {
            setRolUsuario(datos.rol);
          }
          setImagenUsuario(datos?.imagen || '');
        } else {
          setNombreUsuario(respaldoCorreo);
          setImagenUsuario('');
        }
        setCargandoPerfil(false);
      },
      () => {
        setNombreUsuario(respaldoCorreo);
        setCargandoPerfil(false);
      }
    );

    return () => desuscribir();
  }, []);

  const abrirMenu = () => {
    setAvisoSeccion('');
    setRenderizarMenu(true);
    setMenuAbierto(true);
    Animated.timing(posicionMenuX, {
      toValue: 0,
      duration: 240,
      useNativeDriver: true,
    }).start();
  };

  const cerrarMenu = (callbackAlCerrar) => {
    setMenuAbierto(false);
    Animated.timing(posicionMenuX, {
      toValue: -ANCHO_MENU,
      duration: 200,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setRenderizarMenu(false);
      }
      if (typeof callbackAlCerrar === 'function') {
        callbackAlCerrar();
      }
    });
  };

  const navegarA = (nombreRuta, etiquetaSeccion) => {
    cerrarMenu(() => {
      const rutasDisponibles = navigation?.getState?.()?.routeNames || [];
      if (rutasDisponibles.includes(nombreRuta) && navigation?.navigate) {
        navigation.navigate(nombreRuta);
      } else {
        setAvisoSeccion(`La sección "${etiquetaSeccion}" aún no está habilitada.`);
      }
    });
  };

  const cerrarSesion = async () => {
    cerrarMenu(async () => {
      try {
        await signOut(auth);
      } catch (_error) {
        // Si ya no había sesión activa, continuamos a Login
      }
      if (navigation?.replace) {
        navigation.replace('Login');
      }
    });
  };

  if (!fuentesCargadas) {
    return (
      <View style={estilos.pantallaCarga}>
        <ActivityIndicator size="large" color={COLORES.naranja} />
      </View>
    );
  }

  return (
    <View style={estilos.contenedorPrincipal}>
      <Pressable
        onPress={abrirMenu}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={({ pressed }) => [
          estilos.botonHamburguesa,
          pressed && estilos.botonPresionado,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Abrir menú de navegación"
      >
        <Ionicons name="menu" size={26} color={COLORES.negro} />
      </Pressable>

      <ScrollView
        contentContainerStyle={estilos.contenidoPrincipal}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.contenedorLogo}>
          <Image
            source={require('../assets/logo.png')}
            style={estilos.logo}
            resizeMode="cover"
            accessibilityLabel="Logo de RT Burpers Gym"
          />
        </View>

        <View style={estilos.bloqueSaludo}>
          <Text style={estilos.textoBienvenido}>Bienvenido</Text>
          {cargandoPerfil ? (
            <ActivityIndicator
              size="small"
              color={COLORES.naranja}
              style={estilos.cargandoNombre}
            />
          ) : (
            <Text style={estilos.nombreUsuario} numberOfLines={2}>
              {nombreUsuario}
            </Text>
          )}
        </View>

        <View style={estilos.tarjetaCentral}>
          <Text style={estilos.tituloTarjeta}>Panel de Administración</Text>
          <Text style={estilos.textoCentral}>
            Desde este espacio vas a organizar la actividad diaria de RT Burpers Gym. Usá el menú de la esquina superior izquierda para ir a tu perfil o recorrer las secciones de gestión.
          </Text>
        </View>

        {avisoSeccion ? (
          <View style={estilos.cajaAvisoSeccion}>
            <Text style={estilos.textoAvisoSeccion}>{avisoSeccion}</Text>
          </View>
        ) : null}
      </ScrollView>

      {renderizarMenu ? (
        <View style={estilos.capaMenuCompleta} pointerEvents={menuAbierto ? 'auto' : 'none'}>
          <Pressable
            style={estilos.fondoOscuroMenu}
            onPress={() => cerrarMenu()}
            accessibilityLabel="Cerrar menú tocando fuera"
          />

          <Animated.View
            style={[
              estilos.panelMenu,
              {
                width: ANCHO_MENU,
                transform: [{ translateX: posicionMenuX }],
              },
            ]}
          >
            <View style={estilos.cabeceraMenu}>
              <Text style={estilos.tituloMenu}>MENÚ</Text>
              <Pressable
                onPress={() => cerrarMenu()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={({ pressed }) => [
                  estilos.botonCerrarX,
                  pressed && estilos.botonPresionado,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Cerrar menú"
              >
                <Ionicons name="close" size={22} color={COLORES.negro} />
              </Pressable>
            </View>

            {/* Apartado de Perfil arriba en el menú */}
            <Pressable
              style={({ pressed }) => [
                estilos.tarjetaPerfilMenu,
                pressed && estilos.itemMenuPresionado,
              ]}
              onPress={() => navegarA('Perfiles', 'Perfil')}
              accessibilityRole="button"
              accessibilityLabel="Ir a mi perfil"
            >
              <View style={estilos.avatarPerfil}>
                {imagenUsuario ? (
                  <Image
                    source={{ uri: imagenUsuario }}
                    style={estilos.imagenAvatarMenu}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="person" size={24} color={COLORES.blanco} />
                )}
              </View>
              <View style={estilos.infoPerfilMenu}>
                <Text style={estilos.tituloPerfilMenu}>Perfil</Text>
                <Text style={estilos.subtituloPerfilMenu} numberOfLines={1}>
                  {nombreUsuario || 'Ver y editar datos'}
                </Text>
                <Text style={estilos.etiquetaRolMenu}>{rolUsuario}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORES.maderaOscura}
              />
            </Pressable>

            <View style={estilos.separadorMenu} />

            <ScrollView
              style={estilos.listaOpcionesMenu}
              showsVerticalScrollIndicator={false}
            >
              <Pressable
                style={({ pressed }) => [
                  estilos.itemMenu,
                  estilos.itemMenuActivo,
                  pressed && estilos.itemMenuPresionado,
                ]}
                onPress={() => cerrarMenu()}
                accessibilityRole="button"
              >
                <Ionicons name="home-outline" size={20} color={COLORES.naranja} />
                <Text style={[estilos.textoItemMenu, estilos.textoItemActivo]}>
                  Inicio
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  estilos.itemMenu,
                  pressed && estilos.itemMenuPresionado,
                ]}
                onPress={() => navegarA('Clientes', 'Clientes')}
                accessibilityRole="button"
              >
                <Ionicons
                  name="people-outline"
                  size={20}
                  color={COLORES.maderaOscura}
                />
                <Text style={estilos.textoItemMenu}>Clientes</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  estilos.itemMenu,
                  pressed && estilos.itemMenuPresionado,
                ]}
                onPress={() => navegarA('Planes', 'Planes')}
                accessibilityRole="button"
              >
                <Ionicons
                  name="barbell-outline"
                  size={20}
                  color={COLORES.maderaOscura}
                />
                <Text style={estilos.textoItemMenu}>Planes</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  estilos.itemMenu,
                  pressed && estilos.itemMenuPresionado,
                ]}
                onPress={() => navegarA('Cuotas', 'Cuotas')}
                accessibilityRole="button"
              >
                <Ionicons
                  name="card-outline"
                  size={20}
                  color={COLORES.maderaOscura}
                />
                <Text style={estilos.textoItemMenu}>Cuotas</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  estilos.itemMenu,
                  pressed && estilos.itemMenuPresionado,
                ]}
                onPress={() => navegarA('Asistencias', 'Asistencias')}
                accessibilityRole="button"
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={COLORES.maderaOscura}
                />
                <Text style={estilos.textoItemMenu}>Asistencias</Text>
              </Pressable>
            </ScrollView>

            <View style={estilos.pieMenu}>
              <Pressable
                style={({ pressed }) => [
                  estilos.botonCerrarSesion,
                  pressed && estilos.botonPresionado,
                ]}
                onPress={cerrarSesion}
                accessibilityRole="button"
                accessibilityLabel="Cerrar sesión"
              >
                <Ionicons name="log-out-outline" size={20} color={COLORES.blanco} />
                <Text style={estilos.textoBotonCerrarSesion}>CERRAR SESIÓN</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      ) : null}
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
  botonHamburguesa: {
    position: 'absolute',
    top: 44,
    left: 18,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORES.blanco,
    borderWidth: 1.5,
    borderColor: COLORES.grisMedio,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contenidoPrincipal: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 54,
    paddingBottom: 32,
  },
  contenedorLogo: {
    width: 152,
    height: 152,
    borderRadius: 76,
    overflow: 'hidden',
    borderWidth: 3.5,
    borderColor: COLORES.amarilloDorado,
    backgroundColor: COLORES.negro,
    marginBottom: 16,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  bloqueSaludo: {
    alignItems: 'center',
    marginBottom: 22,
    paddingHorizontal: 10,
  },
  textoBienvenido: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    color: COLORES.maderaOscura,
    textAlign: 'center',
  },
  nombreUsuario: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 22,
    color: COLORES.negro,
    textAlign: 'center',
    marginTop: 2,
  },
  cargandoNombre: {
    marginTop: 6,
  },
  tarjetaCentral: {
    width: '100%',
    backgroundColor: COLORES.blanco,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORES.grisMedio,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  tituloTarjeta: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 15,
    color: COLORES.naranja,
    textAlign: 'center',
    marginBottom: 8,
  },
  textoCentral: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: COLORES.negro,
    textAlign: 'center',
  },
  cajaAvisoSeccion: {
    marginTop: 14,
    width: '100%',
    backgroundColor: COLORES.blanco,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORES.maderaOscura,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textoAvisoSeccion: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: COLORES.maderaOscura,
    textAlign: 'center',
  },
  capaMenuCompleta: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 20,
  },
  fondoOscuroMenu: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  panelMenu: {
    height: '100%',
    backgroundColor: COLORES.blanco,
    borderRightWidth: 2,
    borderRightColor: COLORES.grisMedio,
    paddingTop: 44,
    paddingHorizontal: 16,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  cabeceraMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  tituloMenu: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 16,
    color: COLORES.negro,
    letterSpacing: 0.6,
  },
  botonCerrarX: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORES.blanco,
    borderWidth: 1.5,
    borderColor: COLORES.grisMedio,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tarjetaPerfilMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORES.blanco,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORES.amarilloDorado,
    padding: 10,
    gap: 10,
  },
  avatarPerfil: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: COLORES.naranja,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagenAvatarMenu: {
    width: '100%',
    height: '100%',
  },
  infoPerfilMenu: {
    flex: 1,
  },
  tituloPerfilMenu: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    color: COLORES.negro,
  },
  subtituloPerfilMenu: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12.5,
    color: COLORES.maderaOscura,
  },
  etiquetaRolMenu: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: COLORES.naranja,
    marginTop: 1,
  },
  separadorMenu: {
    height: 1.5,
    backgroundColor: COLORES.grisMedio,
    marginVertical: 14,
  },
  listaOpcionesMenu: {
    flex: 1,
  },
  itemMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
  },
  itemMenuActivo: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: COLORES.naranja,
  },
  textoItemMenu: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORES.negro,
  },
  textoItemActivo: {
    color: COLORES.naranja,
  },
  itemMenuPresionado: {
    opacity: 0.75,
  },
  pieMenu: {
    paddingTop: 10,
    borderTopWidth: 1.5,
    borderTopColor: COLORES.grisMedio,
  },
  botonCerrarSesion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    backgroundColor: COLORES.naranja,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  textoBotonCerrarSesion: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 13.5,
    color: COLORES.blanco,
    letterSpacing: 0.5,
  },
  botonPresionado: {
    opacity: 0.8,
  },
});