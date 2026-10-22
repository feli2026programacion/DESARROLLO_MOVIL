import React from 'react';
import { View, Text, StyleSheet, FlatList, TextInput } from 'react-native';

const productosEjemplo = [
  { id: '1', nombre: 'Agua Mineral 500ml', precio: '$1.200', stock: 15 },
  { id: '2', nombre: 'Proteína Whey 1kg', precio: '$35.000', stock: 4 },
  { id: '3', nombre: 'Bebida Isotónica 500ml', precio: '$2.500', stock: 8 },
];

export default function Productos() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Productos y Stock</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Buscar producto..." 
        placeholderTextColor="#888"
      />

      <FlatList
        data={productosEjemplo}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.productName}>{item.nombre}</Text>
            <Text style={styles.productDetail}>Precio: {item.precio}</Text>
            <Text style={styles.productDetail}>Stock disponible: {item.stock} unidades</Text>
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
  productName: { fontSize: 18, color: '#FFF', fontWeight: 'bold' },
  productDetail: { color: '#AAA', marginTop: 4 },
});