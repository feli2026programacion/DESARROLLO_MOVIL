// screens/Login.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore'; // 👈 Importamos funciones de Firestore
import { auth, db } from '../src/config/firebaseConfig';

export default function Login({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [emailRecuperacion, setEmailRecuperacion] = useState('');

  const handleLogin = async () => {
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('El campo Usuario es obligatorio.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('El campo Contraseña es obligatorio.');
      return;
    }

    setLoading(true);

    try {
      let emailToLogin = username.trim();

      // Buscar el correo real en Firestore si el usuario no ingresó un email directo
      if (!username.includes('@')) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username.trim().toLowerCase()));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          emailToLogin = userData.email;
        } else {
          emailToLogin = `${username.trim()}@gmail.com`;
        }
      }

      await signInWithEmailAndPassword(auth, emailToLogin, password);
    } catch (error) {
      setErrorMessage('Usuario o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarRecuperacion = () => {
    if (!emailRecuperacion) {
      Alert.alert('Error', 'Por favor, ingresá tu correo electrónico.');
      return;
    }
    Alert.alert('Éxito', 'Se enviaron las instrucciones a tu correo electrónico.');
    setModalVisible(false);
    setEmailRecuperacion('');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        {/* ISOLOGOTIPO CIRCULAR CENTRADO */}
        <View style={styles.header}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* FORMULARIO */}
        <View style={styles.form}>
          <Text style={styles.title}>RT BURPEES GYM</Text>

          <Text style={styles.label}>USUARIO</Text>
          <View style={styles.inputWrapper}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>👤</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Ingresá tu usuario"
              placeholderTextColor="#888"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (errorMessage) setErrorMessage('');
              }}
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.label}>CONTRASEÑA</Text>
          <View style={styles.inputWrapper}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>🔒</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="********"
              placeholderTextColor="#888"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMessage) setErrorMessage('');
              }}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeIconContainer}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeIconText}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {errorMessage !== '' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>INICIAR SESIÓN</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.olvidasteContainer}>
            <Text style={styles.olvidasteText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.subtext}>¿No tenés cuenta?</Text>
          <TouchableOpacity
            style={styles.createAccountButton}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.createAccountText}>CREAR CUENTA</Text>
          </TouchableOpacity>
        </View>

        {/* MODAL RECUPERAR CONTRASEÑA */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Recuperar Contraseña</Text>
              <Text style={styles.modalDescription}>
                Ingresá tu correo electrónico para enviarte las instrucciones de restablecimiento:
              </Text>

              <TextInput
                style={styles.inputModal}
                placeholder="correo@ejemplo.com"
                placeholderTextColor="#888"
                value={emailRecuperacion}
                onChangeText={setEmailRecuperacion}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.buttonModal, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.buttonModal, styles.sendButton]}
                  onPress={handleEnviarRecuperacion}
                >
                  <Text style={styles.sendText}>Enviar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 10,
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
  form: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#F07D00',
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 15,
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 6,
    marginTop: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F07D00',
    marginBottom: 12,
    overflow: 'hidden',
  },
  iconContainer: {
    backgroundColor: '#7A7A7A',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333333',
  },
  eyeIconContainer: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIconText: {
    fontSize: 16,
  },
  errorBox: {
    width: '100%',
    backgroundColor: '#FDE8E8',
    borderColor: '#F8B4B4',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  errorText: {
    color: '#E02424',
    fontSize: 13,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#FF9800',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  olvidasteContainer: {
    marginVertical: 6,
  },
  olvidasteText: {
    color: '#F07D00',
    fontWeight: '600',
    fontSize: 13,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#EAEAEA',
    marginVertical: 14,
  },
  subtext: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 10,
  },
  createAccountButton: {
    backgroundColor: '#3E322B',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  createAccountText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111',
  },
  modalDescription: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  inputModal: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
    backgroundColor: '#fafafa',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  buttonModal: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#eee',
  },
  cancelText: {
    color: '#333',
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: '#FF9800',
  },
  sendText: {
    color: '#fff',
    fontWeight: '600',
  },
});