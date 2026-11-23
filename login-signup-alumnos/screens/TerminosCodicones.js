import React from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
} from '@expo-google-fonts/montserrat';
import {
  Poppins_400Regular,
  Poppins_600SemiBold,
} from '@expo-google-fonts/poppins';

const COLORES = {
  blanco: '#FFFFFF',
  negro: '#000000',
  naranja: '#FF6600',
  amarilloDorado: '#FDB813',
  maderaOscura: '#3D2B1F',
  grisMedio: '#BDBFBC',
};

export default function TerminosCodicones({ navigation }) {
  const [fuentesCargadas] = useFonts({
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  if (!fuentesCargadas) {
    return <View style={estilos.respaldo} />;
  }

  return (
    <ImageBackground
      source={require('../assets/Fondologin.png')}
      style={estilos.imagenFondo}
      resizeMode="cover"
    >
      <View style={estilos.capaClara}>
        <View style={estilos.encabezado}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={({ pressed }) => [
              estilos.botonVolver,
              pressed && estilos.botonVolverPresionado,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Ionicons name="arrow-back" size={24} color={COLORES.blanco} />
          </Pressable>
          <Text style={estilos.tituloEncabezado}>TÉRMINOS Y CONDICIONES</Text>
          <View style={estilos.espaciadorEncabezado} />
        </View>

        <ScrollView
          contentContainerStyle={estilos.contenidoScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={estilos.tarjeta}>
            <Text style={estilos.tituloGimnasio}>RT BURPERS GYM</Text>
            <Text style={estilos.textoActualizacion}>
              Condiciones de uso de la aplicación y gestión de socios
            </Text>

            <Text style={estilos.tituloSeccion}>1. Registro y cuenta de usuario</Text>
            <Text style={estilos.textoCuerpo}>
              Para utilizar la aplicación de RT Burpers Gym, el usuario debe proporcionar datos reales y actualizados (nombre, apellido y correo electrónico). Cada cuenta es personal e intransferible.
            </Text>

            <Text style={estilos.tituloSeccion}>2. Planes, cuotas y asistencias</Text>
            <Text style={estilos.textoCuerpo}>
              El acceso a las instalaciones y la reserva o registro de asistencias quedan sujetos al estado del plan contratado y al día de la cuota correspondiente. El gimnasio podrá actualizar horarios o modalidades de entrenamiento informándolo previamente.
            </Text>

            <Text style={estilos.tituloSeccion}>3. Salud y responsabilidad física</Text>
            <Text style={estilos.textoCuerpo}>
              Al entrenar en el gimnasio, el socio declara encontrarse en condiciones físicas adecuadas para realizar actividad física y se compromete a respetar las normas de seguridad, el uso correcto de máquinas y las indicaciones del personal.
            </Text>

            <Text style={estilos.tituloSeccion}>4. Privacidad y uso de datos</Text>
            <Text style={estilos.textoCuerpo}>
              Los datos registrados se utilizan exclusivamente para administrar tu perfil, planes, cuotas y asistencias dentro del sistema del gimnasio, protegiendo tu información según las políticas vigentes.
            </Text>

            <Pressable
              style={({ pressed }) => [
                estilos.botonAceptar,
                pressed && estilos.botonAceptarPresionado,
              ]}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Volver al formulario"
            >
              <Text style={estilos.textoBotonAceptar}>ENTENDIDO, VOLVER</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const estilos = StyleSheet.create({
  respaldo: {
    flex: 1,
    backgroundColor: COLORES.blanco,
  },
  imagenFondo: {
    flex: 1,
    backgroundColor: COLORES.blanco,
  },
  capaClara: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 46,
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  botonVolver: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORES.maderaOscura,
    borderWidth: 1.5,
    borderColor: COLORES.amarilloDorado,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonVolverPresionado: {
    opacity: 0.8,
  },
  tituloEncabezado: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 15,
    color: COLORES.negro,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORES.grisMedio,
    letterSpacing: 0.5,
  },
  espaciadorEncabezado: {
    width: 42,
  },
  contenidoScroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  tarjeta: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORES.grisMedio,
    padding: 20,
  },
  tituloGimnasio: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 20,
    color: COLORES.negro,
    textAlign: 'center',
  },
  textoActualizacion: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12.5,
    color: COLORES.maderaOscura,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 16,
  },
  tituloSeccion: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    color: COLORES.naranja,
    marginTop: 12,
    marginBottom: 4,
  },
  textoCuerpo: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13.5,
    lineHeight: 20,
    color: COLORES.negro,
  },
  botonAceptar: {
    marginTop: 22,
    minHeight: 48,
    backgroundColor: COLORES.naranja,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonAceptarPresionado: {
    opacity: 0.85,
  },
  textoBotonAceptar: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 14,
    color: COLORES.blanco,
    letterSpacing: 0.5,
  },
});