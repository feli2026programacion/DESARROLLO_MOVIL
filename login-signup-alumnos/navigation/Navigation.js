import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import Login from '../screens/Login';
import SignUp from '../screens/SignUp';
import OlvideContraseña from '../screens/OlvideContraseña';
import TerminosCodicones from '../screens/TerminosCodicones';
import Home from '../screens/Home';
import Perfiles from '../screens/Perfiles';
import Clientes from '../screens/Clientes';

const Stack = createStackNavigator();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="OlvideContraseña" component={OlvideContraseña} />
        <Stack.Screen name="TerminosCodicones" component={TerminosCodicones} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Perfiles" component={Perfiles} />
        <Stack.Screen name="Clientes" component={Clientes} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}