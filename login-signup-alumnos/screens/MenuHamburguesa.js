import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
const ANCHO_MENU = Math.min(ANCHO_PANTALLA * 0.8, 320);

export default function MenuHamburguesa({
  navigation,
  rutaActual = 'Home',
  onSeccionNoHabilitada,
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [renderizarMenu, setRenderizarMenu] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [rolUsuario, setRolUsuario] = useState('Administrador');
  const [imagenUsuario, setImagenUsuario] = useState('');
  const [cargandoPerfil, setCargandoPerfil] = useState(true);

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
    posicionMenuX.setValue(-ANCHO_MENU);
    setRenderizarMenu(true);
    setMenuAbierto(true);
    requestAnimationFrame(() => {
      Animated.timing(posicionMenuX, {
        toValue: 0,
        duration: 230,
        useNativeDriver: true,
      }).start();
    });
  };

  const cerrarMenu = (callbackAlCerrar) => {
    setMenuAbierto(false);
    Animated.timing(posicionMenuX, {
      toValue: -ANCHO_MENU,
      duration: 190,
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
    if (nombreRuta === rutaActual) {
      cerrarMenu();
      return;
    }

    cerrarMenu(() => {
      const rutasDisponibles = navigation?.getState?.()?.routeNames || [];
      if (rutasDisponibles.includes(nombreRuta) && navigation?.navigate) {
        navigation.navigate(nombreRuta);
      } else if (typeof onSeccionNoHabilitada === 'function') {
        onSeccionNoHabilitada(
          `La sección "${etiquetaSeccion}" aún no está habilitada.`
        );
      }
    });
  };

  const cerrarSesion = async () => {
    cerrarMenu(async () => {
      try {
        await signOut(auth);
      } catch (_error) {}
      if (navigation?.replace) {
        navigation.replace('Login');
      }
    });
  };

  const itemsMenu = [
    { ruta: 'Home', etiqueta: 'Inicio', icono: 'home-outline' },
    { ruta: 'Clientes', etiqueta: 'Clientes', icono: 'people-outline' },
  ];

  return (
    <>
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
        <Ionicons name="menu" size={24} color={COLORES.negro} />
      </Pressable>

      <Modal
        visible={renderizarMenu}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => cerrarMenu()}
      >
        <View
          style={estilos.capaMenuCompleta}
          pointerEvents={menuAbierto ? 'auto' : 'none'}
        >
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

            <Pressable
              style={({ pressed }) => [
                estilos.tarjetaPerfilMenu,
                rutaActual === 'Perfiles' && estilos.itemMenuActivo,
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
                {cargandoPerfil ? (
                  <ActivityIndicator size="small" color={COLORES.naranja} />
                ) : (
                  <Text style={estilos.subtituloPerfilMenu} numberOfLines={1}>
                    {nombreUsuario || 'Ver y editar datos'}
                  </Text>
                )}
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
              {itemsMenu.map((item) => {
                const esActivo = rutaActual === item.ruta;
                return (
                  <Pressable
                    key={item.ruta}
                    style={({ pressed }) => [
                      estilos.itemMenu,
                      esActivo && estilos.itemMenuActivo,
                      pressed && estilos.itemMenuPresionado,
                    ]}
                    onPress={() => navegarA(item.ruta, item.etiqueta)}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name={item.icono}
                      size={20}
                      color={esActivo ? COLORES.naranja : COLORES.maderaOscura}
                    />
                    <Text
                      style={[
                        estilos.textoItemMenu,
                        esActivo && estilos.textoItemActivo,
                      ]}
                    >
                      {item.etiqueta}
                    </Text>
                  </Pressable>
                );
              })}
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
                <Ionicons
                  name="log-out-outline"
                  size={20}
                  color={COLORES.blanco}
                />
                <Text style={estilos.textoBotonCerrarSesion}>CERRAR SESIÓN</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const estilos = StyleSheet.create({
  botonHamburguesa: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORES.blanco,
    borderWidth: 1.5,
    borderColor: COLORES.grisMedio,
    justifyContent: 'center',
    alignItems: 'center',
  },
  capaMenuCompleta: {
    flex: 1,
    flexDirection: 'row',
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
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 24,
    justifyContent: 'space-between',
    elevation: 12,
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