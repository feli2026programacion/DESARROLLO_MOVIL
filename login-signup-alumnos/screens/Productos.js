import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TextInput, 
  TouchableOpacity, Modal, Image, Alert, ActivityIndicator 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../src/config/firebaseConfig'; // Ajusta la ruta a tu firebaseConfig

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estados según tu diagrama ER: NOMBRE, DESCRIPCION, PRECIO VENTA (+ imagen)
  const [modalVisible, setModalVisible] = useState(false);
  const [idEdit, setIdEdit] = useState(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [imagen, setImagen] = useState(null);

  // 1. LEER PRODUCTOS (READ)
  const obtenerProductos = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'productos'));
      const lista = [];
      querySnapshot.forEach((docSnap) => {
        lista.push({ id: docSnap.id, ...docSnap.data() });
      });
      setProductos(lista);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerProductos();
  }, []);

  // 2. SELECCIONAR IMAGEN (ImagePicker)
  const seleccionarImagen = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permiso denegado', 'Se necesita permiso para acceder a la galería.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImagen(result.assets[0].uri);
    }
  };

  // 3. GUARDAR (CREATE / UPDATE)
  const guardarProducto = async () => {
    if (!nombre.trim() || !descripcion.trim() || !precioVenta.trim()) {
      Alert.alert('Campos incompletos', 'Por favor llena Nombre, Descripción y Precio de Venta.');
      return;
    }

    try {
      setLoading(true);
      const datosProducto = {
        nombre,
        descripcion,
        precio_venta: parseFloat(precioVenta) || 0,
        imagen: imagen || null,
      };

      if (idEdit) {
        // Actualizar
        const prodRef = doc(db, 'productos', idEdit);
        await updateDoc(prodRef, datosProducto);
        Alert.alert('Éxito', 'Producto actualizado correctamente');
      } else {
        // Crear
        await addDoc(collection(db, 'productos'), {
          ...datosProducto,
          createdAt: new Date(),
        });
        Alert.alert('Éxito', 'Producto registrado correctamente');
      }

      cerrarModal();
      obtenerProductos();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. ELIMINAR (DELETE)
  const eliminarProducto = (id) => {
    Alert.alert(
      'Eliminar producto',
      '¿Estás seguro de que deseas eliminar este registro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'productos', id));
              obtenerProductos();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          }
        }
      ]
    );
  };

  const abrirEditar = (item) => {
    setIdEdit(item.id);
    setNombre(item.nombre || '');
    setDescripcion(item.descripcion || '');
    setPrecioVenta(item.precio_venta ? String(item.precio_venta) : '');
    setImagen(item.imagen || null);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setIdEdit(null);
    setNombre('');
    setDescripcion('');
    setPrecioVenta('');
    setImagen(null);
    setModalVisible(false);
  };

  // Filtrado para el buscador
  const productosFiltrados = productos.filter((p) => 
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Productos</Text>
      
      {/* Buscador */}
      <TextInput 
        style={styles.input} 
        placeholder="Buscar por nombre o descripción..." 
        placeholderTextColor="#888"
        value={busqueda}
        onChangeText={setBusqueda}
      />

      {/* Botón para Abrir Modal */}
      <TouchableOpacity style={styles.btnAdd} onPress={() => setModalVisible(true)}>
        <Text style={styles.btnAddText}>+ Agregar Nuevo Producto</Text>
      </TouchableOpacity>

      {loading && !modalVisible ? (
        <ActivityIndicator size="large" color="#FF7A00" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={productosFiltrados}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.imagen ? (
                <Image source={{ uri: item.imagen }} style={styles.productImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Text style={{ fontSize: 10, color: '#888' }}>Sin imagen</Text>
                </View>
              )}
              
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.productName}>{item.nombre}</Text>
                <Text style={styles.productDesc}>{item.descripcion}</Text>
                <Text style={styles.productPrice}>
                  Precio Venta: ${item.precio_venta ? item.precio_venta.toFixed(2) : '0.00'}
                </Text>
                
                <View style={styles.cardButtons}>
                  <TouchableOpacity style={styles.btnEdit} onPress={() => abrirEditar(item)}>
                    <Text style={styles.btnText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnDelete} onPress={() => eliminarProducto(item.id)}>
                    <Text style={styles.btnText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* MODAL PARA CREAR Y EDITAR */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {idEdit ? 'Editar Producto' : 'Nuevo Producto'}
            </Text>

            <TextInput 
              style={styles.modalInput} 
              placeholder="Nombre del producto" 
              placeholderTextColor="#888"
              value={nombre}
              onChangeText={setNombre}
            />
            
            <TextInput 
              style={[styles.modalInput, { height: 60 }]} 
              placeholder="Descripción" 
              placeholderTextColor="#888"
              multiline={true}
              value={descripcion}
              onChangeText={setDescripcion}
            />

            <TextInput 
              style={styles.modalInput} 
              placeholder="Precio Venta (Ej: 1200.50)" 
              placeholderTextColor="#888"
              keyboardType="decimal-pad"
              value={precioVenta}
              onChangeText={setPrecioVenta}
            />

            {/* ImagePicker */}
            <TouchableOpacity style={styles.btnImagePicker} onPress={seleccionarImagen}>
              <Text style={{ color: '#FFF' }}>
                {imagen ? 'Cambiar Imagen' : 'Seleccionar Imagen de Galería'}
              </Text>
            </TouchableOpacity>

            {imagen && <Image source={{ uri: imagen }} style={styles.previewImage} />}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnSave} onPress={guardarProducto}>
                <Text style={styles.btnTextBold}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnClose} onPress={cerrarModal}>
                <Text style={styles.btnTextBold}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FF7A00', marginBottom: 15 },
  input: { backgroundColor: '#1E1E1E', color: '#FFF', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  btnAdd: { backgroundColor: '#FF7A00', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  btnAddText: { color: '#FFF', fontWeight: 'bold' },
  card: { backgroundColor: '#1E1E1E', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#333', flexDirection: 'row', alignItems: 'center' },
  productImage: { width: 60, height: 60, borderRadius: 6 },
  placeholderImage: { width: 60, height: 60, borderRadius: 6, backgroundColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center' },
  productName: { fontSize: 16, color: '#FFF', fontWeight: 'bold' },
  productDesc: { color: '#AAA', marginTop: 2, fontSize: 13 },
  productPrice: { color: '#FF7A00', marginTop: 4, fontWeight: 'bold', fontSize: 14 },
  cardButtons: { flexDirection: 'row', marginTop: 8, gap: 10 },
  btnEdit: { backgroundColor: '#333', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 4 },
  btnDelete: { backgroundColor: '#5A1A1A', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 4 },
  btnText: { color: '#FFF', fontSize: 12 },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 10, borderWidth: 1, borderColor: '#333' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#FF7A00', marginBottom: 15 },
  modalInput: { backgroundColor: '#121212', color: '#FFF', padding: 10, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: '#333' },
  btnImagePicker: { backgroundColor: '#2A2A2A', padding: 10, borderRadius: 6, alignItems: 'center', marginBottom: 10 },
  previewImage: { width: 80, height: 80, borderRadius: 6, alignSelf: 'center', marginBottom: 10 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btnSave: { backgroundColor: '#28a745', padding: 10, borderRadius: 6, flex: 1, marginRight: 5, alignItems: 'center' },
  btnClose: { backgroundColor: '#dc3545', padding: 10, borderRadius: 6, flex: 1, marginLeft: 5, alignItems: 'center' },
  btnTextBold: { color: '#FFF', fontWeight: 'bold' },
});