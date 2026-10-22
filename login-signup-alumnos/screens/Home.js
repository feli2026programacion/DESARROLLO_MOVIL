import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../src/config/firebaseConfig';

export default function Home({ navigation }) {

  const handleLogOut = async () => {
    try {
      await signOut(auth);  
      Alert.alert("Sesión cerrada", "Has cerrado sesión correctamente.");
    } catch (error) {
      Alert.alert("Error", "Hubo un problema al cerrar sesión.");
    }
  };

  return (
    <View style={styles.container}>
      
      {/* CORRECCIÓN: Botón "Menú" añadido en la esquina superior derecha */}
      <View style={styles.headerSuperior}>
        <TouchableOpacity 
          style={styles.botonMenuEsquina} 
          onPress={() => navigation.navigate('Menu')}
        >
          <Text style={styles.textoBotonMenu}>Menú ☰</Text>
        </TouchableOpacity>
      </View>

      {/* Contenido Central Original */}
      <View style={styles.contenidoCentral}>
        <Image source={require('../assets/logo.png')} style={styles.logo} />
        <Text style={styles.title}>Bienvenido a la aplicación</Text>
        
        <TouchableOpacity style={styles.button} onPress={handleLogOut}>
          <Text style={styles.buttonText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerSuperior: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 50, // Espacio para no chocarse con la barra de estado del celular
    paddingHorizontal: 20,
  },
  botonMenuEsquina: {
    backgroundColor: '#F58220', // Naranja institucional de tu gimnasio
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  textoBotonMenu: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  contenidoCentral: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -50, // Compensa el espacio del header superior para centrar bien el logo
  },
  logo: {
    width: 130,
    height: 130,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#222222',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#922b21',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 20,
    width: '75%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
