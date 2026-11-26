import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../src/config/firebaseConfig';
import MenuHamburguesa from './MenuHamburguesa';

const COLORES = {
  blanco: '#FFFFFF',
  negro: '#000000',
  naranja: '#FF6600',
  amarilloDorado: '#FDB813',
  maderaOscura: '#3D2B1F',
  grisMedio: '#BDBFBC',
  cremaSuave: '#FFFBEB',
  naranjaSuave: '#FFF7ED',
};

export default function Home({ navigation }) {
  const [fuentesCargadas] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  const [nombreUsuario, setNombreUsuario] = useState('');
  const [cargandoPerfil, setCargandoPerfil] = useState(true);
  const [avisoSeccion, setAvisoSeccion] = useState('');

  useEffect(() => {
    let cancelado = false;
    let desuscribirSnapshot = null;

    const iniciarEscuchaPerfil = (usuarioActual) => {
      const respaldoCorreo = usuarioActual.email
        ? usuarioActual.email.split('@')[0]
        : 'Usuario';

      const referenciaDoc = doc(db, 'usuarios', usuarioActual.uid);

      setDoc(referenciaDoc, { emailVerificado: true }, { merge: true }).catch(
        () => {}
      );

      desuscribirSnapshot = onSnapshot(
        referenciaDoc,
        (instantanea) => {
          if (cancelado) return;
          if (instantanea.exists()) {
            const datos = instantanea.data();
            const nombreCompleto = [datos?.nombre, datos?.apellido]
              .filter(Boolean)
              .join(' ')
              .trim();
            setNombreUsuario(nombreCompleto || datos?.nombre || respaldoCorreo);
          } else {
            setNombreUsuario(respaldoCorreo);
          }
          setCargandoPerfil(false);
        },
        () => {
          if (cancelado) return;
          setNombreUsuario(respaldoCorreo);
          setCargandoPerfil(false);
        }
      );
    };

    const verificarSesionYPerfil = async () => {
      const usuarioActual = auth.currentUser;
      if (!usuarioActual) {
        if (!cancelado) {
          setNombreUsuario('Usuario');
          setCargandoPerfil(false);
        }
        return;
      }

      try {
        await usuarioActual.reload();
      } catch (_err) {}

      if (cancelado) return;

      if (!usuarioActual.emailVerified) {
        const correoPendiente = usuarioActual.email || '';
        try {
          await signOut(auth);
        } catch (_err) {}
        if (!cancelado && navigation?.replace) {
          navigation.replace('Login', {
            pendingVerification: true,
            email: correoPendiente,
          });
        }
        return;
      }

      iniciarEscuchaPerfil(usuarioActual);
    };

    verificarSesionYPerfil();

    return () => {
      cancelado = true;
      if (typeof desuscribirSnapshot === 'function') {
        desuscribirSnapshot();
      }
    };
  }, [navigation]);

  if (!fuentesCargadas) {
    return (
      <View style={estilos.pantallaCarga}>
        <ActivityIndicator size="large" color={COLORES.naranja} />
      </View>
    );
  }

  return (
    <View style={estilos.contenedorPrincipal}>
      {/* Barra superior limpia: solo menú hamburguesa a la altura de Clientes */}
      <View style={estilos.barraSuperior}>
        <View style={estilos.huecoMenuHamburguesa}>
          <MenuHamburguesa
            navigation={navigation}
            rutaActual="Home"
            onSeccionNoHabilitada={(mensaje) => setAvisoSeccion(mensaje)}
          />
        </View>
        <View style={estilos.espaciadorDerecha} />
      </View>

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

        <View style={estilos.bloqueMarca}>
          <Text style={estilos.tituloMarca}>RT BURPERS</Text>
          <Text style={estilos.subtituloMarca}>
            FUERZA · SALUD · COMUNIDAD
          </Text>

          <View style={estilos.pillBienvenida}>
            {cargandoPerfil ? (
              <ActivityIndicator size="small" color={COLORES.maderaOscura} />
            ) : (
              <Text style={estilos.textoPillBienvenida} numberOfLines={2}>
                • Bienvenido, {nombreUsuario}
              </Text>
            )}
          </View>
        </View>

        <View style={estilos.tarjetaCentral}>
          <View style={estilos.franjaSuperiorTarjeta} />
          <Text style={estilos.tituloTarjeta}>Panel de Administración</Text>
          <Text style={estilos.fraseDestacada}>
            Entrenamos para mejorar tu salud, crear hábitos fuertes y transformar tu calidad de vida.
          </Text>
          <View style={estilos.divisorTarjeta} />
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
    paddingBottom: 10,
    backgroundColor: COLORES.blanco,
  },
  huecoMenuHamburguesa: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  espaciadorDerecha: {
    width: 42,
    height: 42,
  },
  contenidoPrincipal: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 32,
  },
  contenedorLogo: {
    width: 172,
    height: 172,
    borderRadius: 86,
    overflow: 'hidden',
    backgroundColor: COLORES.blanco,
    marginBottom: 14,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 86,
  },
  bloqueMarca: {
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  tituloMarca: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 25,
    color: COLORES.naranja,
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  subtituloMarca: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12,
    color: COLORES.maderaOscura,
    textAlign: 'center',
    letterSpacing: 1.4,
    marginTop: 4,
    marginBottom: 12,
  },
  pillBienvenida: {
    backgroundColor: COLORES.amarilloDorado,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: COLORES.maderaOscura,
    maxWidth: '100%',
  },
  textoPillBienvenida: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13.5,
    color: COLORES.negro,
    textAlign: 'center',
  },
  tarjetaCentral: {
    width: '100%',
    backgroundColor: COLORES.naranjaSuave,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORES.amarilloDorado,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 20,
  },
  franjaSuperiorTarjeta: {
    height: 5,
    backgroundColor: COLORES.naranja,
    marginHorizontal: -20,
    marginBottom: 14,
  },
  tituloTarjeta: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 15,
    color: COLORES.maderaOscura,
    textAlign: 'center',
    marginBottom: 8,
  },
  fraseDestacada: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    lineHeight: 21,
    color: COLORES.negro,
    textAlign: 'center',
  },
  divisorTarjeta: {
    height: 1,
    backgroundColor: COLORES.grisMedio,
    marginVertical: 14,
  },
  textoCentral: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13.5,
    lineHeight: 20,
    color: COLORES.maderaOscura,
    textAlign: 'center',
  },
  cajaAvisoSeccion: {
    marginTop: 14,
    width: '100%',
    backgroundColor: COLORES.cremaSuave,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORES.amarilloDorado,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textoAvisoSeccion: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: COLORES.maderaOscura,
    textAlign: 'center',
  },
});