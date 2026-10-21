// screens/Home.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../src/config/firebaseConfig';

const { width } = Dimensions.get('window');

export default function Home({ navigation }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [userName, setUserName] = useState('');
  const [fullUserName, setFullUserName] = useState('');

  // Obtener información real del usuario desde Firestore y Firebase Auth
  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        let nameToDisplay = 'Usuario';
        let fullNameToDisplay = 'Usuario';

        if (db) {
          try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              if (data.firstName) {
                nameToDisplay = data.firstName;
                fullNameToDisplay = `${data.firstName} ${data.lastName || ''}`.trim();
              }
            }
          } catch (error) {
            console.log('Error al obtener datos de Firestore:', error);
          }
        }

        // Si no encontró en Firestore, recurrir a Auth
        if (nameToDisplay === 'Usuario' && currentUser.displayName) {
          nameToDisplay = currentUser.displayName.split(' ')[0];
          fullNameToDisplay = currentUser.displayName;
        } else if (nameToDisplay === 'Usuario' && currentUser.email) {
          const emailPrefix = currentUser.email.split('@')[0];
          nameToDisplay = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
          fullNameToDisplay = nameToDisplay;
        }

        setUserName(nameToDisplay);
        setFullUserName(fullNameToDisplay);
      }
    };

    fetchUserData();
  }, []);

  const handleLogOut = async () => {
    try {
      setMenuVisible(false);
      await signOut(auth);
      Alert.alert('Sesión cerrada', 'Has cerrado sesión correctamente.');
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al cerrar sesión.');
    }
  };

  const handleOptionPress = (optionName) => {
    setMenuVisible(false);
    Alert.alert('Navegación', `Próximamente pantalla de ${optionName}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        {/* ENCABEZADO SUPERIOR */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.hamburgerButton}
            onPress={() => setMenuVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </TouchableOpacity>
        </View>

        {/* CONTENIDO PRINCIPAL DEL HOME */}
        <ScrollView
          contentContainerStyle={styles.mainContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo del Gimnasio Circular */}
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('../assets/logo.png')}
                style={styles.logo}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Título y Subtítulo */}
          <Text style={styles.brandTitle}>RT BURPERS</Text>
          <Text style={styles.brandSubtitle}>FUERZA · SALUD · COMUNIDAD</Text>

          {/* Píldora de Bienvenida */}
          <View style={styles.welcomeBadge}>
            <View style={styles.blackDot} />
            <Text style={styles.welcomeText}>Bienvenido, {userName}</Text>
          </View>

          {/* Tarjeta con mensaje de comunidad */}
          <View style={styles.cardContainer}>
            <Text style={styles.cardText}>
              Entrenamos para mejorar tu salud, crear hábitos fuertes y transformar tu calidad de vida. Sumate a nuestra comunidad y superá tus límites cada día.
            </Text>
          </View>
        </ScrollView>

        {/* MENÚ DESPLEGABLE LATERAL (MODAL) */}
        <Modal
          visible={menuVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>

            {/* Menú Drawer Izquierdo */}
            <View style={styles.drawerContainer}>
              <SafeAreaView style={{ flex: 1 }}>
                {/* Header del Menú */}
                <View style={styles.drawerHeader}>
                  <View style={styles.userInfoContainer}>
                    <View style={styles.drawerLogoWrapper}>
                      <Image
                        source={require('../assets/logo.png')}
                        style={styles.drawerLogo}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={styles.userTextContainer}>
                      <Text style={styles.drawerBrandTitle}>RT BURPERS</Text>
                      <Text style={styles.drawerUserName}>{fullUserName}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setMenuVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Perfil del Usuario */}
                <TouchableOpacity
                  style={styles.profileCard}
                  onPress={() => handleOptionPress('Mi Perfil')}
                >
                  <View style={styles.profileLeft}>
                    <Text style={styles.profileIcon}>👤</Text>
                    <Text style={styles.profileText}>Mi Perfil</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                {/* Lista de Opciones de Navegación */}
                <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                  <TouchableOpacity
                    style={styles.optionCard}
                    onPress={() => handleOptionPress('Clientes')}
                  >
                    <View style={styles.optionLeft}>
                      <View style={styles.orangeDot} />
                      <Text style={styles.optionText}>Clientes</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.optionCard}
                    onPress={() => handleOptionPress('Asistencia')}
                  >
                    <View style={styles.optionLeft}>
                      <View style={styles.orangeDot} />
                      <Text style={styles.optionText}>Asistencia</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.optionCard}
                    onPress={() => handleOptionPress('Cuotas')}
                  >
                    <View style={styles.optionLeft}>
                      <View style={styles.orangeDot} />
                      <Text style={styles.optionText}>Cuotas</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.optionCard}
                    onPress={() => handleOptionPress('Deudas')}
                  >
                    <View style={styles.optionLeft}>
                      <View style={styles.orangeDot} />
                      <Text style={styles.optionText}>Deudas</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.optionCard}
                    onPress={() => handleOptionPress('Venta de Productos')}
                  >
                    <View style={styles.optionLeft}>
                      <View style={styles.orangeDot} />
                      <Text style={styles.optionText}>Venta de Productos</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.optionCard}
                    onPress={() => handleOptionPress('Productos / Stock')}
                  >
                    <View style={styles.optionLeft}>
                      <View style={styles.orangeDot} />
                      <Text style={styles.optionText}>Productos / Stock</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                </ScrollView>

                {/* Botón de Cerrar Sesión al final del Drawer */}
                <View style={styles.drawerFooter}>
                  <TouchableOpacity style={styles.logoutButton} onPress={handleLogOut}>
                    <Text style={styles.logoutIcon}>➔</Text>
                    <Text style={styles.logoutText}>CERRAR SESIÓN</Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* HEADER HOME */
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    alignItems: 'flex-start',
  },
  hamburgerButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3D5B5',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  hamburgerLine: {
    width: 20,
    height: 2.5,
    backgroundColor: '#E58325',
    borderRadius: 2,
  },

  /* CONTENIDO PRINCIPAL HOME */
  mainContent: {
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 10,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  logoWrapper: {
    width: 170,
    height: 170,
    borderRadius: 85,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#E58325',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2D3A4B',
    marginTop: 6,
    letterSpacing: 1,
  },
  welcomeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFC107',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 25,
    marginTop: 20,
    marginBottom: 20,
  },
  blackDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000000',
    marginRight: 10,
  },
  welcomeText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000000',
  },
  cardContainer: {
    borderWidth: 1.5,
    borderColor: '#E58325',
    borderRadius: 18,
    padding: 22,
    backgroundColor: '#FFFFFF',
    marginTop: 5,
    width: '100%',
  },
  cardText: {
    fontSize: 14,
    color: '#222222',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },

  /* MODAL Y DRAWER LATERAL */
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  drawerContainer: {
    width: width * 0.8,
    height: '100%',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 15,
    paddingBottom: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerLogoWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  drawerLogo: {
    width: '100%',
    height: '100%',
  },
  userTextContainer: {
    justifyContent: 'center',
  },
  drawerBrandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#E58325',
  },
  drawerUserName: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },

  /* PERFIL Y OPCIONES */
  profileCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#FDE2C8',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 15,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  profileText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000000',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginBottom: 15,
  },
  optionsList: {
    flex: 1,
  },
  optionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFBF7',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orangeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#E58325',
    marginRight: 12,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  chevron: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444444',
  },

  /* BOTÓN CERRAR SESIÓN */
  drawerFooter: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFD6D6',
    borderRadius: 14,
    paddingVertical: 14,
  },
  logoutIcon: {
    fontSize: 16,
    color: '#E53935',
    marginRight: 8,
    fontWeight: 'bold',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E53935',
    letterSpacing: 0.5,
  },
});