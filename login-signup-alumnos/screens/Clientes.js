import React from 'react';
import { View, Text, StyleSheet, FlatList, TextInput } from 'react-native';

const clientesEjemplo = [
  { id: '1', nombre: 'Juan Pérez', dni: '38.123.456', estado: 'Activo' },
  { id: '2', nombre: 'María Gómez', dni: '40.987.654', estado: 'Vencido' },
  { id: '3', nombre: 'Lucas Díaz', dni: '35.111.222', estado: 'Activo' },
];

export default function Clientes() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Clientes</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Buscar cliente por DNI o nombre..." 
        placeholderTextColor="#888"
      />

      <FlatList
        data={clientesEjemplo}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.clientName}>{item.nombre}</Text>
            <Text style={styles.clientDni}>DNI: {item.dni}</Text>
            <Text style={[styles.badge, item.estado === 'Activo' ? styles.activo : styles.vencido]}>
              {item.estado}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FF7A00', marginBottom: 15 },
  input: { backgroundColor: '#1E1E1E', color: '#FFF', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  card: { backgroundColor: '#1E1E1E', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#333' },
  clientName: { fontSize: 18, color: '#FFF', fontWeight: 'bold' },
  clientDni: { color: '#AAA', marginVertical: 4 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, marginTop: 5, fontWeight: 'bold' },
  activo: { backgroundColor: '#2E7D32', color: '#FFF' },
  vencido: { backgroundColor: '#C62828', color: '#FFF' },
});