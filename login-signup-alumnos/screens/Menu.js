import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { auth } from '../src/config/firebaseConfig'; // Importación de tu Firebase Config

// Lista de módulos adaptada con los colores institucionales exactos de tu sistema web
const modulos = [
  { titulo: 'Gestión de Clientes', descripcion: 'Administra socios, altas, bajas y estados de membresía.', color: '#F27405', textoOscuro: false },
  { titulo: 'Control de Caja', descripcion: 'Apertura, cierre, registro de cobros diarios y pagos.', color: '#EAA123', textoOscuro: false },
  { titulo: 'Control de Asistencia', descripcion: 'Registro por DNI y validación de créditos/cupos activos.', color: '#CCCCCC', textoOscuro: true },
  { titulo: 'Gestión de Planes', descripcion: 'Configuración de pases mensuales, por clase y tarifas.', color: '#FCE673', textoOscuro: true },
  { titulo: 'Sedes (RT Burpers / Lucía)', descripcion: 'Administración de sucursales y ubicaciones principales.', color: '#3A2922', textoOscuro: false },
  { titulo: 'Seguridad y Usuarios', descripcion: 'Control de accesos y credenciales de administración.', color: '#A63F14', textoOscuro: false },
];

export default function MenuScreen({ navigation }) {
  // Saludo dinámico conectado de forma segura a Firebase Auth
  const nombreUsuario = auth.currentUser?.displayName || "RUBEN";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.saludo}>
            <Text style={styles.hola}>¡Hola, {nombreUsuario.toUpperCase()}! 👋</Text>
            <Text style={styles.rol}>Perfil activo: Administrador</Text>
          </View>

          {/* Ruta a 'Perfil' (en español) para que coincida con tu Navigation.js */}
          <TouchableOpacity
            style={styles.botonPerfil}
            onPress={() => navigation.navigate('Perfil')} 
          >
            <Text style={styles.iconoPerfil}>👤</Text>
            <Text style={styles.textoBotonPerfil}>Mi perfil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bienvenida}>
          <Text style={styles.titulo}>Panel principal</Text>
          <Text style={styles.subtitulo}>
            Seleccioná el módulo con el que querés trabajar.
          </Text>
        </View>

        {/* Grilla con tarjetas de colores corporativos */}
        <View style={styles.grid}>
          {modulos.map((modulo, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.tarjeta, { backgroundColor: modulo.color }]} 
              activeOpacity={0.8}
              {/* CAMBIO AQUÍ: Se evalúa de manera dinámica si es Gestión de Clientes */}
              onPress={() => {
                if (modulo.titulo === 'Gestión de Clientes') {
                  navigation.navigate('Clientes');
                } else {
                  alert(`Ingresando a: ${modulo.titulo}`);
                }
              }}
            >
              <Text style={[styles.tituloTarjeta, modulo.textoOscuro && styles.textDark]}>
                {modulo.titulo}
              </Text>
              <Text style={[styles.descripcion, modulo.textoOscuro ? styles.textDarkDesc : styles.textClaroDesc]}>
                {modulo.descripcion}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.pie}>RT Burpers Gym · Sistema de gestión</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  container: {
    padding: 20,
    paddingTop: 25,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  saludo: {
    flex: 1,
    minWidth: 180,
  },
  hola: {
    fontSize: 24,
    fontWeight: '900',
    color: '#222222',
  },
  rol: {
    marginTop: 6,
    fontSize: 13,
    color: '#777777',
  },
  botonPerfil: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F58220',
    paddingVertical: 11,
    paddingHorizontal: 15,
    borderRadius: 12,
    gap: 7,
  },
  iconoPerfil: {
    fontSize: 18,
  },
  textoBotonPerfil: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  bienvenida: {
    marginTop: 32,
    marginBottom: 20,
  },
  titulo: {
    fontSize: 23,
    fontWeight: '900',
    color: '#222222',
  },
  subtitulo: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#777777',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },
  tarjeta: {
    width: '48%',
    flexGrow: 1,
    flexBasis: 140,
    minHeight: 140,
    borderRadius: 16,
    padding: 17,
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tituloTarjeta: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  descripcion: {
    fontSize: 11.5,
    marginTop: 7,
    lineHeight: 16,
    textAlign: 'center',
  },
  textClaroDesc: {
    color: '#FFEFE5', // Texto claro para las tarjetas de colores fuertes
  },
  textDark: {
    color: '#3A2922', // Título oscuro para las tarjetas gris y amarilla
  },
  textDarkDesc: {
    color: '#555555', // Descripción oscura para las tarjetas gris y amarilla
  },
  pie: {
    textAlign: 'center',
    color: '#999999',
    fontSize: 12,
    marginTop: 28,
    marginBottom: 10,
  },
});

