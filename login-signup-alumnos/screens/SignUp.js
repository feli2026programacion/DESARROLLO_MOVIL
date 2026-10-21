// screens/SignUp.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../src/config/firebaseConfig';

export default function SignUp({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [termsModalVisible, setTermsModalVisible] = useState(false);

  const handleSignUp = async () => {
    let newErrors = {};

    if (!firstName.trim()) newErrors.firstName = 'Obligatorio';
    if (!lastName.trim()) newErrors.lastName = 'Obligatorio';
    if (!username.trim()) newErrors.username = 'Obligatorio';
    if (!email.trim()) newErrors.email = 'Obligatorio';
    if (!password) newErrors.password = 'Obligatorio';
    if (!confirmPassword) newErrors.confirmPassword = 'Obligatorio';

    if (!acceptedTerms) {
      newErrors.terms = 'Debés aceptar los términos para continuar';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Las contraseñas no coinciden' });
      return;
    }

    if (password.length < 6) {
      setErrors({ password: 'Mínimo 6 caracteres' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const emailToUse = email.includes('@') ? email.trim() : `${email.trim()}@gmail.com`;
      
      // 1. Crear el usuario en Firebase Authentication
      const credential = await createUserWithEmailAndPassword(auth, emailToUse, password);
      const user = credential.user;

      // 2. Guardar los datos en Firestore (Colección "users")
      if (db) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          username: username.trim().toLowerCase(),
          email: emailToUse,
          createdAt: new Date().toISOString(),
        });
      }

      // 3. Actualizar perfil
      await updateProfile(user, {
        displayName: `${firstName.trim()} ${lastName.trim()}`,
      });

      // 4. Cerrar sesión y redirigir al Login para que el usuario inicie sesión
      await signOut(auth);

      Alert.alert(
        '¡Registro Exitoso!',
        'Tu cuenta ha sido creada correctamente. Ahora podés iniciar sesión.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );

    } catch (error) {
      console.log('🔴 ERROR AL REGISTRAR:', error);
      let msg = 'Hubo un problema al registrar la cuenta.';
      if (error.code === 'auth/email-already-in-use') {
        msg = 'El correo ya está en uso.';
      } else if (error.code === 'permission-denied') {
        msg = 'Faltan permisos de lectura/escritura en Cloud Firestore.';
      }
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CREAR CUENTA</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>NOMBRE</Text>
        <View style={styles.inputWrapper}>
          <View style={styles.iconContainer}><Text style={styles.iconText}>👤</Text></View>
          <TextInput
            style={styles.input}
            placeholder="Tu nombre"
            placeholderTextColor="#888"
            value={firstName}
            onChangeText={(text) => {
              setFirstName(text);
              if (errors.firstName) setErrors({ ...errors, firstName: null });
            }}
          />
        </View>
        {errors.firstName && <Text style={styles.errorLabel}>{errors.firstName}</Text>}

        <Text style={styles.label}>APELLIDO</Text>
        <View style={styles.inputWrapper}>
          <View style={styles.iconContainer}><Text style={styles.iconText}>👤</Text></View>
          <TextInput
            style={styles.input}
            placeholder="Tu apellido"
            placeholderTextColor="#888"
            value={lastName}
            onChangeText={(text) => {
              setLastName(text);
              if (errors.lastName) setErrors({ ...errors, lastName: null });
            }}
          />
        </View>
        {errors.lastName && <Text style={styles.errorLabel}>{errors.lastName}</Text>}

        <Text style={styles.label}>USUARIO</Text>
        <View style={styles.inputWrapper}>
          <View style={styles.iconContainer}><Text style={styles.iconText}>👤</Text></View>
          <TextInput
            style={styles.input}
            placeholder="Nombre de usuario"
            placeholderTextColor="#888"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              if (errors.username) setErrors({ ...errors, username: null });
            }}
            autoCapitalize="none"
          />
        </View>
        {errors.username && <Text style={styles.errorLabel}>{errors.username}</Text>}

        <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
        <View style={styles.inputWrapper}>
          <View style={styles.iconContainer}><Text style={styles.iconText}>✉️</Text></View>
          <TextInput
            style={styles.input}
            placeholder="correo@ejemplo.com"
            placeholderTextColor="#888"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: null });
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        {errors.email && <Text style={styles.errorLabel}>{errors.email}</Text>}

        <Text style={styles.label}>CONTRASEÑA</Text>
        <View style={styles.inputWrapper}>
          <View style={styles.iconContainer}><Text style={styles.iconText}>🔒</Text></View>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#888"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: null });
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
        {errors.password && <Text style={styles.errorLabel}>{errors.password}</Text>}

        <Text style={styles.label}>CONFIRMAR CONTRASEÑA</Text>
        <View style={styles.inputWrapper}>
          <View style={styles.iconContainer}><Text style={styles.iconText}>🔒</Text></View>
          <TextInput
            style={styles.input}
            placeholder="Repetí tu contraseña"
            placeholderTextColor="#888"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
            }}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity
            style={styles.eyeIconContainer}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Text style={styles.eyeIconText}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && <Text style={styles.errorLabel}>{errors.confirmPassword}</Text>}

        <View style={[styles.termsCard, errors.terms ? styles.termsCardError : null]}>
          <View style={styles.termsRow}>
            <TouchableOpacity
              style={[styles.checkbox, acceptedTerms ? styles.checkboxChecked : null]}
              onPress={() => {
                setAcceptedTerms(!acceptedTerms);
                if (errors.terms) setErrors({ ...errors, terms: null });
              }}
            >
              {acceptedTerms && <Text style={styles.checkboxCheck}>✓</Text>}
            </TouchableOpacity>
            <Text style={styles.termsText}>
              Acepto los{' '}
              <Text
                style={styles.termsLink}
                onPress={() => setTermsModalVisible(true)}
              >
                Términos y condiciones
              </Text>
            </Text>
          </View>
          {errors.terms && <Text style={styles.termsErrorText}>{errors.terms}</Text>}
        </View>

        <TouchableOpacity
          style={styles.registerButton}
          onPress={handleSignUp}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.registerButtonText}>REGISTRARSE</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={termsModalVisible}
        animationType="slide"
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setTermsModalVisible(false)}
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>TÉRMINOS Y CONDICIONES</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.termsScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.termsBodyCard}>
              <Text style={styles.termsSectionTitle}>1. Aceptación</Text>
              <Text style={styles.termsSectionText}>
                Al usar RT Burpers Gym aceptás estos términos en su totalidad.
              </Text>

              <Text style={styles.termsSectionTitle}>2. Uso del servicio</Text>
              <Text style={styles.termsSectionText}>
                Esta aplicación es de uso exclusivo para miembros y personal autorizado del gimnasio RT Burpers.
              </Text>

              <Text style={styles.termsSectionTitle}>3. Datos personales</Text>
              <Text style={styles.termsSectionText}>
                Tus datos se almacenan de forma segura y no son compartidos con terceros sin tu consentimiento.
              </Text>

              <Text style={styles.termsSectionTitle}>4. Responsabilidades</Text>
              <Text style={styles.termsSectionText}>
                El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso.
              </Text>

              <Text style={styles.termsSectionTitle}>5. Modificaciones</Text>
              <Text style={styles.termsSectionText}>
                Nos reservamos el derecho de modificar estos términos con previo aviso a los usuarios.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.returnButton}
              onPress={() => setTermsModalVisible(false)}
            >
              <Text style={styles.returnButtonText}>← VOLVER</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F3D5B5',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 20,
    color: '#E58325',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 30,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 10,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F07D00',
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
  errorLabel: {
    color: '#E53935',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  termsCard: {
    borderWidth: 1.5,
    borderColor: '#F07D00',
    borderRadius: 14,
    padding: 16,
    marginTop: 18,
    marginBottom: 10,
  },
  termsCardError: {
    borderColor: '#E53935',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#F07D00',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#F07D00',
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  termsText: {
    fontSize: 13,
    color: '#333333',
  },
  termsLink: {
    color: '#F07D00',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  termsErrorText: {
    color: '#E53935',
    fontSize: 12,
    marginTop: 8,
  },
  registerButton: {
    backgroundColor: '#FF9800',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 15,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  termsScroll: {
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  termsBodyCard: {
    borderWidth: 1.5,
    borderColor: '#F07D00',
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  termsSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#F07D00',
    marginTop: 10,
    marginBottom: 4,
  },
  termsSectionText: {
    fontSize: 13,
    color: '#444444',
    lineHeight: 20,
    marginBottom: 10,
  },
  returnButton: {
    borderWidth: 1.5,
    borderColor: '#F07D00',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 30,
  },
  returnButtonText: {
    color: '#F07D00',
    fontWeight: 'bold',
    fontSize: 14,
  },
});