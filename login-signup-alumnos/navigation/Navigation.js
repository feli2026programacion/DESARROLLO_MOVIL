import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../src/config/firebaseConfig';
import Login from '../screens/Login';
import SignUp from '../screens/SignUp';
import Home from '../screens/Home';
// NUEVAS IMPORTACIONES: Añadimos tus nuevas pantallas creadas al enrutador
import Menu from '../screens/Menu';
import Perfil from '../screens/Perfil';
import Clientes from '../screens/Clientes';

const Stack = createStackNavigator();

export default function Navigation() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, setUser);
  }, []);

  if (!isFirebaseConfigured) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>
          Falta configurar Firebase. Copia .env.example como .env y completa los datos de tu proyecto.
        </Text>
      </View>
    );
  }

  if (user === undefined) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  return (
    <NavigationContainer>
      {/* 
        CORRECCIÓN: Agregamos screenOptions={{ headerShown: false }} para ocultar la barra blanca 
        por defecto de React Navigation y que luzcan tus encabezados naranjas personalizados.
      */}
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            {/* Si el usuario está logueado, primero ve el Home (Logo central) */}
            <Stack.Screen name="Home" component={Home} />
            {/* Registramos tus pantallas para habilitar navigation.navigate() entre ellas */}
            <Stack.Screen name="Menu" component={Menu} />
            <Stack.Screen name="Perfil" component={Perfil} />
            <Stack.Screen name="Clientes" component={Clientes} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="SignUp" component={SignUp} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  message: { textAlign: 'center', fontSize: 16 },
});

