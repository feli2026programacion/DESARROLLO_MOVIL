import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
} from 'react-native';

export default function ClientesScreen({ navigation }) {
  const [busqueda, setBusqueda] = useState('');
  
  // ESTADO DE CLIENTES: Inicialmente vacío como me pediste.
  // Para probar el diseño con las tarjetas de Lucas, Sofía y Diego, simplemente descomentá el bloque de abajo.
  const [clientes, setClientes] = useState([]);
  
  /* 
  // Descomentá estas líneas para ver cómo se luce con los clientes cargados:
  const [clientes, setClientes] = useState([
    { id: 1, nombre: 'Lucas García', dni: '12345678', tel: '3514001001', correo: 'lucas@mail.com', activo: true },
    { id: 2, nombre: 'Sofía Martínez', dni: '87654321', tel: '3514002002', correo: 'sofia@mail.com', activo: false },
    { id: 3, nombre: 'Diego López', dni: '11223344', tel: '3514003003', correo: 'diego@mail.com', activo: true },
  ]);
  */

  // Filtrar clientes según la búsqueda
  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    cliente.dni.includes(busqueda)
  );

  const handleAgregarCliente = () => {
    Alert.alert('Agregar Cliente', 'Aquí se abrirá el formulario para registrar un cliente en MySQL.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Barra superior de navegación */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>CLIENTES</Text>
        <View style={styles.placeholderIcon} />
      </View>

      {/* Zona de Buscador y Botón Agregar (Solo se muestra si hay clientes o si querés agregar el primero) */}
      <View style={styles.topActionsContainer}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar cliente..."
            placeholderTextColor="#999"
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAgregarCliente}>
          <Text style={styles.addButtonText}>+ AGREGAR</Text>
        </TouchableOpacity>
      </View>

      {/* RENDERIZADO CONDICIONAL: Si no hay clientes registrados */}
      {clientes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>No hay clientes registrados</Text>
          <Text style={styles.emptySubtitle}>Comenzá agregando a tu primer socio del gimnasio.</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={handleAgregarCliente}>
            <Text style={styles.emptyButtonText}>+ Agregar Primer Cliente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Si hay clientes, despliega la lista tal como tu captura
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {clientesFiltrados.map((cliente) => (
              <View key={cliente.id} style={styles.clientCard}>
                {/* Encabezado naranja de la tarjeta */}
                <View style={styles.cardHeader}>
                  <Text style={styles.clientName}>{cliente.nombre}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: '#FFFFFF' }]}>
                    <View style={[styles.statusDot, { backgroundColor: cliente.activo ? '#4CD964' : '#FF3B30' }]} />
                    <Text style={styles.statusText}>{cliente.activo ? 'Activo' : 'Inactivo'}</Text>
                  </View>
                </View>

                {/* Cuerpo de datos con tipografía y distribución idéntica */}
                <View style={styles.cardBody}>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>DNI</Text>
                    <Text style={styles.dataValue}>{cliente.dni}</Text>
                    <TouchableOpacity style={styles.copyButton} onPress={() => alert('Copiado')}>
                      <Text style={styles.copyIcon}>📋</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>TEL.</Text>
                    <Text style={styles.dataValue}>{cliente.tel}</Text>
                  </View>

                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>CORREO</Text>
                    <Text style={styles.dataValue}>{cliente.correo}</Text>
                  </View>
                </View>

                {/* Botones inferiores de acciones */}
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => alert('Editar')}>
                    <Text style={styles.actionEditText}>📝 Editar</Text>
                  </TouchableOpacity>
                  <View style={styles.divider} />
                  <TouchableOpacity style={styles.actionButton} onPress={() => alert('Eliminar')}>
                    <Text style={styles.actionDeleteText}>🗑️ Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
          <Text style={styles.footerCounter}>
            {clientesFiltrados.length} de {clientes.length} clientes
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  backButton: { width: 35, height: 35, borderRadius: 10, backgroundColor: '#FFF5EF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FCE6D8' },
  backButtonText: { color: '#F27405', fontSize: 18, fontWeight: 'bold' },
  navTitle: { fontSize: 16, fontWeight: '900', color: '#000', letterSpacing: 1 },
  placeholderIcon: { width: 35 },
  
  topActionsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginVertical: 10, gap: 10 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#CCCCCC', borderRadius: 8, paddingHorizontal: 10, height: 45 },
  searchIcon: { fontSize: 16, marginRight: 5 },
  searchInput: { flex: 1, fontSize: 14, color: '#000' },
  addButton: { backgroundColor: '#F27405', height: 45, paddingHorizontal: 15, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  addButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 60, marginBottom: 15 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#3A2922', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#777', textAlign: 'center', marginBottom: 25, lineHeight: 20 },
  emptyButton: { backgroundColor: '#F27405', paddingVertical: 14, paddingHorizontal: 25, borderRadius: 12 },
  emptyButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  scrollContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  clientCard: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#E2DCD8', marginBottom: 20, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F27405', paddingVertical: 12, paddingHorizontal: 20 },
  clientName: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '700', color: '#222' },
  
  cardBody: { padding: 20 },
  dataRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dataLabel: { width: 80, fontSize: 12, fontWeight: '900', color: '#222' },
  dataValue: { fontSize: 14, color: '#444', fontWeight: '500' },
  copyButton: { marginLeft: 8, padding: 4, backgroundColor: '#FFF5EF', borderRadius: 6, borderWidth: 1, borderColor: '#FCE6D8' },
  copyIcon: { fontSize: 12, color: '#F27405' },

  cardActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#EEEEEE', height: 48, alignItems: 'center' },
  actionButton: { flex: 1, justifyContent: 'center', alignItems: 'center', height: '100%' },
  actionEditText: { color: '#F27405', fontSize: 14, fontWeight: '700' },
  actionDeleteText: { color: '#922b21', fontSize: 14, fontWeight: '700' },
  divider: { width: 1, height: '60%', backgroundColor: '#EEEEEE' },
  footerCounter: { textAlign: 'center', color: '#999999', fontSize: 12, marginVertical: 10 }
});
