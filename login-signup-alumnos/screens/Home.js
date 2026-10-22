import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';

export default function Home({ navigation }) {
  const [menuVisible, setMenuVisible] = useState(false);

  const handleNavigation = (screenName) => {
    setMenuVisible(false);
    navigation.navigate(screenName);
  };

  return (
    <View style={styles.container}>
      {/* Encabezado */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuVisible(true)}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RT BURPERS</Text>
      </View>

      {/* Contenido Principal */}
      <View style={styles.content}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.welcomeText}>¡Bienvenido al Panel de Control!</Text>
        <Text style={styles.subText}>
          Despliega el menú superior para acceder a los módulos.
        </Text>
      </View>

      {/* Menú Desplegable Lateral */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.drawerContainer}>
            <Text style={styles.drawerTitle}>Menú Principal</Text>

            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => handleNavigation('Home')}
            >
              <Text style={styles.drawerItemText}>🏠 Inicio</Text>
            </TouchableOpacity>

            {/* Opción Clientes -> Conectada a tu vista Clientes */}
            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => handleNavigation('Clientes')}
            >
              <Text style={styles.drawerItemText}>👥 Clientes</Text>
            </TouchableOpacity>

            {/* Opción Productos / Stock -> Conectada a tu vista Productos */}
            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => handleNavigation('Productos')}
            >
              <Text style={styles.drawerItemText}>📦 Productos / Stock</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.drawerItem, styles.logoutItem]}
              onPress={() => handleNavigation('Login')}
            >
              <Text style={[styles.drawerItemText, styles.logoutText]}>
                🚪 Cerrar Sesión
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    height: 60,
    backgroundColor: '#1E1E1E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#FF7A00',
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: '#FF7A00',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 15,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF7A00',
    textAlign: 'center',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-start',
  },
  drawerContainer: {
    width: '75%',
    height: '100%',
    backgroundColor: '#1E1E1E',
    padding: 20,
    paddingTop: 50,
    borderRightWidth: 1,
    borderRightColor: '#FF7A00',
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF7A00',
    marginBottom: 25,
  },
  drawerItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  drawerItemText: {
    fontSize: 16,
    color: '#FFF',
  },
  logoutItem: {
    marginTop: 30,
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#E53935',
    fontWeight: 'bold',
  },
});