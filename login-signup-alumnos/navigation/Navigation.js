import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Login from '../screens/Login';
import SignUp from '../screens/SignUp';
import TerminosCodicones from '../screens/TerminosCodicones';
import Home from '../screens/Home';
import Perfiles from '../screens/Perfiles';
import Planes from '../screens/Planes';
import Clientes from '../screens/Clientes';
import Cuotas from '../screens/Cuotas';
import Asistencias from '../screens/Asistencias';

const PilaNavegacion = createNativeStackNavigator();

export default function Navigation() {
  return (
    <NavigationContainer>
      <PilaNavegacion.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <PilaNavegacion.Screen name="Login" component={Login} />
        <PilaNavegacion.Screen name="SignUp" component={SignUp} />
        <PilaNavegacion.Screen name="TerminosCodicones" component={TerminosCodicones} />
        <PilaNavegacion.Screen name="Home" component={Home} />
        <PilaNavegacion.Screen name="Perfiles" component={Perfiles} />
        <PilaNavegacion.Screen name="Planes" component={Planes} />
        <PilaNavegacion.Screen name="Clientes" component={Clientes} />
        <PilaNavegacion.Screen name="Cuotas" component={Cuotas} />
        <PilaNavegacion.Screen name="Asistencias" component={Asistencias} />
      </PilaNavegacion.Navigator>
    </NavigationContainer>
  );
}