import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Modal, Alert, StyleSheet } from 'react-native';

export default function Login({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Estados para la ventanita modal de "Olvidar contraseña"
  const [modalVisible, setModalVisible] = useState(false);
  const [emailRecuperacion, setEmailRecuperacion] = useState('');

  const handleEnviarRecuperacion = () => {
    if (!emailRecuperacion) {
      Alert.alert("Error", "Por favor, ingresá tu correo electrónico.");
      return;
    }
    Alert.alert("Éxito", "Se enviaron las instrucciones a tu correo electrónico.");
    setModalVisible(false);
    setEmailRecuperacion('');
  };

  return (
    <View style={styles.container}>
      {/* 1. SECCIÓN SUPERIOR: Imagen (Isologotipo) y Título */}
      <View style={styles.header}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>RT BURPEES GYM</Text>
      </View>

      {/* 2. SECCIÓN DEL FORMULARIO */}
      <View style={styles.form}>
        <Text style={styles.label}>USUARIO</Text>
        <TextInput
          style={styles.input}
          placeholder="Ingresá tu usuario"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Text style={styles.label}>CONTRASEÑA</Text>
        <TextInput
          style={styles.input}
          placeholder="********"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
        />

        {/* BOTÓN "OLVIDASTE TU CONTRASEÑA" */}
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.olvidasteContainer}>
          <Text style={styles.olvidasteText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        {/* BOTÓN INICIAR SESIÓN */}
        <TouchableOpacity style={styles.loginButton}>
          <Text style={styles.loginButtonText}>INICIAR SESIÓN</Text>
        </TouchableOpacity>
      </View>

      {/* 3. VENTANITA MODAL (FLOTANTE) PARA RECUPERAR CONTRASEÑA */}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#000',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  olvidasteContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  olvidasteText: {
    color: '#ff9800',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  loginButton: {
    backgroundColor: '#ff9800',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // ESTILOS DE LA VENTANA MODAL
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
    backgroundColor: '#ff9800',
  },
  sendText: {
    color: '#fff',
    fontWeight: '600',
  },
});