// src/config/firebaseConfig.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Credenciales oficiales de tu proyecto de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC5rxmTFzBJTiObcMpbj1T6rG3RYsVbAWk",
  authDomain: "proyecto-movil-5dd39.firebaseapp.com",
  projectId: "proyecto-movil-5dd39",
  storageBucket: "proyecto-movil-5dd39.firebasestorage.app",
  messagingSenderId: "536629137767",
  appId: "1:536629137767:web:8368fc5394047f43a99fc2",
};

export const isFirebaseConfigured = true;

// Inicialización de la App de Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Configuración de Auth con persistencia
let auth;
try {
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch (error) {
  auth = getAuth(app);
}

// Inicialización de Firestore Database
const db = getFirestore(app);

export { auth, db };