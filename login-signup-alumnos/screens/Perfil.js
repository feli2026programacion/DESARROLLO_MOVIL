import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  SafeAreaView,
} from 'react-native';

// CORRECCIÓN: Sincronizado el nombre del componente para evitar fallas en Navigation.js
export default function PerfilScreen({ navigation }) {
  const [editar, setEditar] = useState(false);
  const [oscuro, setOscuro] = useState(false);

  // Estados iniciales adaptados al formato exacto de tu imagen de Sonia
  const [nombre, setNombre] = useState('sonia');
  const [apellido, setApellido] = useState('calpanchay');
  const [usuario, setUsuario] = useState('sonyc');
  const [correo, setCorreo] = useState('sonia23@gmail.com');
  const [contrasena, setContrasena] = useState('');

  // Paleta de colores dinámica para soportar tu lógica de Modo Oscuro
  const fondo = oscuro ? '#202020' : '#FFFFFF';
  const tarjeta = oscuro ? '#303030' : '#FFFFFF';
  const texto = oscuro ? '#FFFFFF' : '#222222';
  const secundario = oscuro ? '#BBBBBB' : '#555555';
  const bordeCampo = oscuro ? '#444444' : '#E2DCD8';

  function guardarCambios() {
    Alert.alert(
      'Mi perfil',
      'Los cambios están en pantalla, pero todavía no se guardan en una base de datos.'
    );
    setEditar(false);
    setContrasena('');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: fondo }]}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Barra Superior */}
        <View style={styles.barraSuperior}>
          <TouchableOpacity
            style={[styles.botonVolver, { borderColor: oscuro ? '#444' : '#FCE6D8', backgroundColor: oscuro ? '#333' : '#FFF5EF' }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.volver}>←</Text>
          </TouchableOpacity>

          <Text style={[styles.encabezado, { color: texto }]}>
            MI PERFIL
          </Text>

          <Switch value={oscuro} onValueChange={setOscuro} />
        </View>

        {/* Banner de Mi Perfil con el recuadro naranja sutil */}
        <View style={[styles.banner, { backgroundColor: oscuro ? '#303030' : '#FFF8F4', borderColor: oscuro ? '#444' : '#FCE6D8' }]}>
          <Text style={styles.bannerIcon}>👤</Text>
          <View style={styles.bannerTextContainer}>
            <Text style={[styles.bannerTitulo, { color: oscuro ? '#FFF' : '#3A2922' }]}>Mi Perfil</Text>
            <Text style={[styles.bannerSubtitulo, { color: oscuro ? '#BBB' : '#A68B80' }]}>RT Burpers Gym</Text>
          </View>
        </View>

        {/* Presentación del Avatar Circular */}
        <View style={styles.presentacion}>
          <View style={[styles.avatar, { backgroundColor: oscuro ? '#444' : '#FFF8F4', borderColor: '#F27405' }]}>
            <Text style={styles.iniciales}>
              {((nombre || '') + (apellido || '')).toUpperCase().substring(0, 2)}
            </Text>
          </View>

          <Text style={[styles.nombreCompleto, { color: texto }]}>
            {nombre} {apellido}
          </Text>
          <Text style={styles.nombreUsuario}>
            @{usuario}
          </Text>
        </View>

        {/* Listado de Campos con bloques individuales independientes (Formato Captura) */}
        <View style={styles.listadoCampos}>
          <Campo
            etiqueta="NOMBRE"
            valor={nombre}
            cambiar={setNombre}
            editar={editar}
            colorTexto={texto}
            colorSecundario={secundario}
            colorTarjeta={tarjeta}
            colorBorde={bordeCampo}
          />

          <Campo
            etiqueta="APELLIDO"
            valor={apellido}
            cambiar={setApellido}
            editar={editar}
            colorTexto={texto}
            colorSecundario={secundario}
            colorTarjeta={tarjeta}
            colorBorde={bordeCampo}
          />

          <Campo
            etiqueta="USUARIO"
            valor={usuario}
            cambiar={setUsuario}
            editar={editar}
            colorTexto={texto}
            colorSecundario={secundario}
            colorTarjeta={tarjeta}
            colorBorde={bordeCampo}
          />

          <Campo
            etiqueta="CORREO ELECTRÓNICO"
            valor={correo}
            cambiar={setCorreo}
            editar={editar}
            colorTexto={texto}
            colorSecundario={secundario}
            colorTarjeta={tarjeta}
            colorBorde={bordeCampo}
            tipo="email-address"
          />

          {editar && (
            <View style={[styles.campo, { backgroundColor: tarjeta, borderColor: bordeCampo, flexDirection: 'column', alignItems: 'flex-start' }]}>
              <Text style={[styles.etiqueta, { color: secundario, marginBottom: 8 }]}>
                CAMBIAR CONTRASEÑA
              </Text>
              <TextInput
                style={[styles.input, { color: texto, borderColor: oscuro ? '#555' : '#DDDDDD', width: '100%' }]}
                value={contrasena}
                onChangeText={setContrasena}
                placeholder="Nueva contraseña (opcional)"
                placeholderTextColor="#999999"
                secureTextEntry
              />
            </View>
          )}
        </View>

        {/* Manejo de Botones Inferiores de Acción */}
        {editar ? (
          <View style={styles.botones}>
            <TouchableOpacity
              style={styles.botonGuardar}
              onPress={guardarCambios}
            >
              <Text style={styles.textoBoton}>GUARDAR CAMBIOS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botonCancelar}
              onPress={() => setEditar(false)}
            >
              <Text style={[styles.textoCancelar, { color: texto }]}>
                CANCELAR
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.botonGuardar}
            onPress={() => setEditar(true)}
          >
            <Text style={styles.textoBoton}>EDITAR PERFIL</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.pie, { color: secundario }]}>
          RT Burpers Gym · Mi perfil
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// Componente Interno Campo optimizado para emular la distribución paralela de la imagen
function Campo({
  etiqueta,
  valor,
  cambiar,
  editar,
  colorTexto,
  colorSecundario,
  colorTarjeta,
  colorBorde,
  tipo = 'default',
}) {
  return (
    <View style={[
      styles.campo, 
      { 
        backgroundColor: colorTarjeta, 
        borderColor: colorBorde, 
        flexDirection: editar ? 'column' : 'row',
        alignItems: editar ? 'flex-start' : 'center'
      }
    ]}>
      <Text style={[styles.etiqueta, { color: colorSecundario, marginBottom: editar ? 8 : 0 }]}>
        {etiqueta}
      </Text>

      {editar ? (
        <TextInput
          style={[styles.input, { color: colorTexto, borderColor: '#DDDDDD', width: '100%' }]}
          value={valor}
          onChangeText={cambiar}
          keyboardType={tipo}
          autoCapitalize={tipo === 'email-address' ? 'none' : 'words'}
        />
      ) : (
        <Text style={[styles.valor, { color: colorTexto }]}>{valor}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 35,
  },
  barraSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
    paddingTop: 10,
  },
  botonVolver: {
    width: 35, 
    height: 35, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1,
  },
  volver: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F27405',
  },
  encabezado: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  banner: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    marginVertical: 15,
  },
  bannerIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  bannerTextContainer: {
    flexDirection: 'column',
  },
  bannerTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bannerSubtitulo: {
    fontSize: 12,
  },
  presentacion: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iniciales: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F27405',
  },
  nombreCompleto: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    textTransform: 'capitalize',
  },
  nombreUsuario: {
    fontSize: 14,
    color: '#F27405',
    marginTop: 4,
  },
  listadoCampos: {
    width: '100%',
  },
  campo: {
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 12,
  },
  etiqueta: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  valor: {
    fontSize: 15,
    fontWeight: '500',
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  botones: {
    gap: 12,
  },
  botonGuardar: {
    backgroundColor: '#F27405', // Naranja del botón "EDITAR PERFIL"
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  botonCancelar: {
    alignItems: 'center',
    padding: 12,
  },
  textoCancelar: {
    fontWeight: '800',
  },
  pie: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 25,
  },
});
