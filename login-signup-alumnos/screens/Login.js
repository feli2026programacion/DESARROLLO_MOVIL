import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';

export default function Login({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    console.log("Iniciar sesión con usuario:", username, "y contraseña:", password);
  };

  return (
    <View>
      {/* 1. SECCIÓN SUPERIOR: Imagen (Isologotipo) y Título */}
      <View>
        <Image 
          source={require('../assets/logo.png')} 
        />
        <Text>RT BURPERS GYM</Text>
      </View>

      {/* 2. SECCIÓN DEL FORMULARIO */}
      <View>
        <Text>USUARIO</Text>
        <TextInput 
          placeholder="Ingresá tu usuario"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Text>CONTRASEÑA</Text>
        <TextInput 
          placeholder="********"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
        />

        <TouchableOpacity onPress={handleLogin}>
          <Text>INICIAR SESIÓN</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => console.log('Recuperar contraseña')}>
          <Text>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        <Text>¿No tenés cuenta?</Text>

        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text>CREAR CUENTA</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}