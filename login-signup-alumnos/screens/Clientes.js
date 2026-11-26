import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import {
  useFonts,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
} from '@expo-google-fonts/montserrat';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
} from '@expo-google-fonts/poppins';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../src/config/firebaseConfig';
import MenuHamburguesa from './MenuHamburguesa';

const COLORES = {
  blanco: '#FFFFFF',
  negro: '#000000',
  naranja: '#FF6600',
  amarilloDorado: '#FDB813',
  maderaOscura: '#3D2B1F',
  grisMedio: '#BDBFBC',
};

const MIN_NOMBRE_APELLIDO = 3;
const MAX_NOMBRE_APELLIDO = 30;
const MIN_DNI = 8;
const MAX_DNI = 9;
const LIMITE_TELEFONO = 15;

const REGEX_SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s]+$/;
const REGEX_SOLO_NUMEROS = /^[0-9]+$/;
const REGEX_CORREO = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const calcularDiasInactivo = (cliente) => {
  const referenciaIso =
    cliente?.fechaInicioInactividad ||
    cliente?.fechaActualizacion ||
    cliente?.fechaCreacion;
  if (!referenciaIso) return 0;

  const fechaInicio = new Date(referenciaIso);
  if (Number.isNaN(fechaInicio.getTime())) return 0;

  const diferenciaMs = Date.now() - fechaInicio.getTime();
  if (diferenciaMs <= 0) return 0;

  return Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
};

export default function Clientes({ navigation }) {
  const [fuentesCargadas] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  const [clientes, setClientes] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [mensajeAviso, setMensajeAviso] = useState('');
  const [errorGeneral, setErrorGeneral] = useState('');

  // Modal Crear / Editar
  const [modalFormularioVisible, setModalFormularioVisible] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);

  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [telefonoEmergencia, setTelefonoEmergencia] = useState('');

  const [errorDni, setErrorDni] = useState('');
  const [errorNombre, setErrorNombre] = useState('');
  const [errorApellido, setErrorApellido] = useState('');
  const [errorCorreo, setErrorCorreo] = useState('');
  const [errorTelefono, setErrorTelefono] = useState('');
  const [errorTelefonoEmergencia, setErrorTelefonoEmergencia] = useState('');

  // Modal de acciones al tocar una fila y ventana secundaria Ver detalle
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState(null);
  const [modalAccionesVisible, setModalAccionesVisible] = useState(false);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [dniCopiado, setDniCopiado] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setErrorGeneral('Falta configurar Firebase en el proyecto.');
      setCargandoLista(false);
      return;
    }

    const consultaClientes = query(
      collection(db, 'clientes'),
      orderBy('fechaCreacion', 'desc')
    );

    const desuscribir = onSnapshot(
      consultaClientes,
      (instantanea) => {
        const lista = instantanea.docs.map((documento) => ({
          id: documento.id,
          ...documento.data(),
        }));
        setClientes(lista);
        setCargandoLista(false);
      },
      () => {
        setErrorGeneral('No se pudieron cargar los clientes desde Firestore.');
        setCargandoLista(false);
      }
    );

    return () => desuscribir();
  }, []);

  const clienteSeleccionado = useMemo(
    () => clientes.find((c) => c.id === clienteSeleccionadoId) || null,
    [clientes, clienteSeleccionadoId]
  );

  const clientesFiltrados = useMemo(() => {
    const termino = textoBusqueda.trim().toLowerCase();
    if (!termino) return clientes;

    return clientes.filter((item) => {
      const dniCoincide = String(item?.dni || '').toLowerCase().includes(termino);
      const nombreCoincide = String(item?.nombre || '').toLowerCase().includes(termino);
      const apellidoCoincide = String(item?.apellido || '').toLowerCase().includes(termino);
      return dniCoincide || nombreCoincide || apellidoCoincide;
    });
  }, [clientes, textoBusqueda]);

  if (!fuentesCargadas) {
    return (
      <View style={estilos.pantallaCarga}>
        <ActivityIndicator size="large" color={COLORES.naranja} />
      </View>
    );
  }

  const limpiarErrores = () => {
    setErrorDni('');
    setErrorNombre('');
    setErrorApellido('');
    setErrorCorreo('');
    setErrorTelefono('');
    setErrorTelefonoEmergencia('');
    setErrorGeneral('');
  };

  const abrirModalCrear = () => {
    limpiarErrores();
    setMensajeAviso('');
    setClienteEditando(null);
    setDni('');
    setNombre('');
    setApellido('');
    setCorreo('');
    setTelefono('');
    setTelefonoEmergencia('');
    setModalFormularioVisible(true);
  };

  const abrirModalEditar = (cliente) => {
    limpiarErrores();
    setMensajeAviso('');
    setClienteEditando(cliente);
    setDni(String(cliente?.dni || ''));
    setNombre(cliente?.nombre || '');
    setApellido(cliente?.apellido || '');
    setCorreo(cliente?.correo || '');
    setTelefono(String(cliente?.telefono || ''));
    setTelefonoEmergencia(String(cliente?.telefonoEmergencia || ''));
    setModalFormularioVisible(true);
  };

  const cerrarModalFormulario = () => {
    if (guardando) return;
    setModalFormularioVisible(false);
    setClienteEditando(null);
    limpiarErrores();
  };

  const validarDni = (valor, mostrar = false) => {
    const limpio = valor.trim();
    if (!limpio) {
      if (mostrar) setErrorDni('Falta ingresar el DNI del cliente');
      return false;
    }
    if (!REGEX_SOLO_NUMEROS.test(limpio)) {
      if (mostrar) setErrorDni('El DNI solo puede contener números');
      return false;
    }
    if (limpio.length < MIN_DNI) {
      if (mostrar) {
        setErrorDni(`El DNI debe tener al menos ${MIN_DNI} dígitos`);
      }
      return false;
    }
    if (limpio.length > MAX_DNI) {
      if (mostrar) {
        setErrorDni(`El DNI no puede superar los ${MAX_DNI} dígitos`);
      }
      return false;
    }
    setErrorDni('');
    return true;
  };

  const validarNombre = (valor, mostrar = false) => {
    const limpio = valor.trim();
    if (!limpio) {
      if (mostrar) setErrorNombre('Falta ingresar el nombre');
      return false;
    }
    if (!REGEX_SOLO_LETRAS.test(limpio)) {
      if (mostrar) {
        setErrorNombre('El nombre solo puede contener letras y espacios');
      }
      return false;
    }
    if (limpio.length < MIN_NOMBRE_APELLIDO) {
      if (mostrar) {
        setErrorNombre(
          `El nombre debe tener al menos ${MIN_NOMBRE_APELLIDO} caracteres`
        );
      }
      return false;
    }
    if (limpio.length > MAX_NOMBRE_APELLIDO) {
      if (mostrar) {
        setErrorNombre(
          `El nombre no puede superar los ${MAX_NOMBRE_APELLIDO} caracteres`
        );
      }
      return false;
    }
    setErrorNombre('');
    return true;
  };

  const validarApellido = (valor, mostrar = false) => {
    const limpio = valor.trim();
    if (!limpio) {
      if (mostrar) setErrorApellido('Falta ingresar el apellido');
      return false;
    }
    if (!REGEX_SOLO_LETRAS.test(limpio)) {
      if (mostrar) {
        setErrorApellido('El apellido solo puede contener letras y espacios');
      }
      return false;
    }
    if (limpio.length < MIN_NOMBRE_APELLIDO) {
      if (mostrar) {
        setErrorApellido(
          `El apellido debe tener al menos ${MIN_NOMBRE_APELLIDO} caracteres`
        );
      }
      return false;
    }
    if (limpio.length > MAX_NOMBRE_APELLIDO) {
      if (mostrar) {
        setErrorApellido(
          `El apellido no puede superar los ${MAX_NOMBRE_APELLIDO} caracteres`
        );
      }
      return false;
    }
    setErrorApellido('');
    return true;
  };

  const validarCorreo = (valor, mostrar = false) => {
    const limpio = valor.trim().toLowerCase();
    if (!limpio) {
      if (mostrar) setErrorCorreo('Falta ingresar el correo electrónico');
      return false;
    }
    if (!REGEX_CORREO.test(limpio)) {
      if (mostrar) {
        setErrorCorreo('Ingrese un correo válido (ej. usuario@correo.com)');
      }
      return false;
    }
    setErrorCorreo('');
    return true;
  };

  const validarTelefono = (valor, esEmergencia = false, mostrar = false) => {
    const limpio = valor.trim();
    const etiquetaError = esEmergencia
      ? 'teléfono de emergencia'
      : 'teléfono';
    const setError = esEmergencia
      ? setErrorTelefonoEmergencia
      : setErrorTelefono;

    if (!limpio) {
      if (mostrar) setError(`Falta ingresar el ${etiquetaError}`);
      return false;
    }
    if (!REGEX_SOLO_NUMEROS.test(limpio)) {
      if (mostrar) setError(`El ${etiquetaError} solo puede contener números`);
      return false;
    }
    if (limpio.length < 7 || limpio.length > LIMITE_TELEFONO) {
      if (mostrar) {
        setError(`Ingrese entre 7 y ${LIMITE_TELEFONO} dígitos`);
      }
      return false;
    }
    setError('');
    return true;
  };

  const verificarDuplicadoEnFirestore = async (campo, valor, idExcluir = null) => {
    const consulta = query(collection(db, 'clientes'), where(campo, '==', valor));
    const snapshot = await getDocs(consulta);
    let duplicado = false;
    snapshot.forEach((documento) => {
      if (documento.id !== idExcluir) {
        duplicado = true;
      }
    });
    return duplicado;
  };

  const guardarCliente = async () => {
    if (guardando) return;

    const dniLimpio = dni.trim();
    const nombreLimpio = nombre.trim();
    const apellidoLimpio = apellido.trim();
    const correoLimpio = correo.trim().toLowerCase();
    const telefonoLimpio = telefono.trim();
    const emergenciaLimpio = telefonoEmergencia.trim();

    const hayCamposVacios =
      !dniLimpio ||
      !nombreLimpio ||
      !apellidoLimpio ||
      !correoLimpio ||
      !telefonoLimpio ||
      !emergenciaLimpio;

    const dniOk = validarDni(dniLimpio, true);
    const nombreOk = validarNombre(nombreLimpio, true);
    const apellidoOk = validarApellido(apellidoLimpio, true);
    const correoOk = validarCorreo(correoLimpio, true);
    const telefonoOk = validarTelefono(telefonoLimpio, false, true);
    const emergenciaOk = validarTelefono(emergenciaLimpio, true, true);

    if (
      !dniOk ||
      !nombreOk ||
      !apellidoOk ||
      !correoOk ||
      !telefonoOk ||
      !emergenciaOk
    ) {
      setErrorGeneral(
        hayCamposVacios
          ? 'Faltan datos por completar. Complete todos los campos obligatorios.'
          : 'Revise los campos marcados antes de guardar.'
      );
      return;
    }

    setGuardando(true);
    setErrorGeneral('');

    try {
      const idExcluir = clienteEditando?.id || null;

      const dniExiste = await verificarDuplicadoEnFirestore('dni', dniLimpio, idExcluir);
      if (dniExiste) {
        setErrorDni('Ya existe un cliente registrado con este DNI');
        setErrorGeneral('Verifique el DNI ingresado.');
        setGuardando(false);
        return;
      }

      const correoExiste = await verificarDuplicadoEnFirestore(
        'correo',
        correoLimpio,
        idExcluir
      );
      if (correoExiste) {
        setErrorCorreo('Ya existe un cliente registrado con este correo');
        setErrorGeneral('Verifique el correo electrónico ingresado.');
        setGuardando(false);
        return;
      }

      const ahora = new Date().toISOString();

      if (clienteEditando) {
        const refCliente = doc(db, 'clientes', clienteEditando.id);
        await setDoc(
          refCliente,
          {
            dni: dniLimpio,
            nombre: nombreLimpio,
            apellido: apellidoLimpio,
            correo: correoLimpio,
            telefono: telefonoLimpio,
            telefonoEmergencia: emergenciaLimpio,
            estado: clienteEditando.estado || 'Inactivo',
            fechaActualizacion: ahora,
          },
          { merge: true }
        );
        setMensajeAviso('Datos del cliente actualizados correctamente.');
      } else {
        await addDoc(collection(db, 'clientes'), {
          dni: dniLimpio,
          nombre: nombreLimpio,
          apellido: apellidoLimpio,
          correo: correoLimpio,
          telefono: telefonoLimpio,
          telefonoEmergencia: emergenciaLimpio,
          estado: 'Inactivo',
          diasDisponibles: 0,
          fechaInicioInactividad: ahora,
          fechaCreacion: ahora,
          fechaActualizacion: ahora,
        });
        setMensajeAviso(
          'Cliente registrado en estado Inactivo (pasará a Activo al pagar su cuota).'
        );
      }

      setModalFormularioVisible(false);
      setClienteEditando(null);
    } catch (_error) {
      setErrorGeneral('No se pudo guardar el cliente en Firebase.');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminarCliente = (cliente) => {
    if (guardando) return;
    setModalAccionesVisible(false);

    Alert.alert(
      'Eliminar cliente',
      `¿Seguro que querés eliminar a ${cliente.nombre} ${cliente.apellido} (DNI ${cliente.dni})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setGuardando(true);
            setMensajeAviso('');
            try {
              await deleteDoc(doc(db, 'clientes', cliente.id));
              setMensajeAviso('Cliente eliminado correctamente.');
              if (clienteSeleccionadoId === cliente.id) {
                setClienteSeleccionadoId(null);
                setModalDetalleVisible(false);
              }
            } catch (_error) {
              setMensajeAviso('No se pudo eliminar el cliente.');
            } finally {
              setGuardando(false);
            }
          },
        },
      ]
    );
  };

  const tocarFilaCliente = (cliente) => {
    setClienteSeleccionadoId(cliente.id);
    setDniCopiado(false);
    setModalAccionesVisible(true);
  };

  const abrirDetalleDesdeAcciones = () => {
    setModalAccionesVisible(false);
    setDniCopiado(false);
    setModalDetalleVisible(true);
  };

  const abrirEditarDesdeAcciones = () => {
    const objetivo = clienteSeleccionado;
    setModalAccionesVisible(false);
    if (objetivo) {
      abrirModalEditar(objetivo);
    }
  };

  const copiarDniAlPortapapeles = async (valorDni) => {
    const textoDni = String(valorDni ?? '').trim();
    if (!textoDni) return;

    try {
      if (Clipboard && typeof Clipboard.setStringAsync === 'function') {
        await Clipboard.setStringAsync(textoDni);
      } else if (
        Platform.OS === 'web' &&
        typeof navigator !== 'undefined' &&
        navigator.clipboard?.writeText
      ) {
        await navigator.clipboard.writeText(textoDni);
      } else {
        Alert.alert(
          'Portapapeles no disponible',
          'Ejecutá "npx expo install expo-clipboard" y reiniciá la app para copiar.'
        );
        return;
      }

      setDniCopiado(true);
      setTimeout(() => {
        setDniCopiado(false);
      }, 2000);
    } catch (_error) {
      Alert.alert(
        'No se pudo copiar',
        'Verificá que "expo-clipboard" esté instalado y volvé a intentar.'
      );
    }
  };

  return (
    <View style={estilos.contenedorPrincipal}>
      {/* Encabezado superior */}
      <View style={estilos.barraSuperior}>
        <View style={estilos.huecoMenuHamburguesa}>
          <MenuHamburguesa
            navigation={navigation}
            rutaActual="Clientes"
            onSeccionNoHabilitada={(mensaje) => setMensajeAviso(mensaje)}
          />
        </View>

        <Text style={estilos.tituloEncabezado} numberOfLines={1}>
          CLIENTES
        </Text>

        <Pressable
          onPress={abrirModalCrear}
          disabled={guardando}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [
            estilos.botonAccionSuperior,
            pressed && estilos.botonPresionado,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Registrar cliente"
        >
          <Text style={estilos.textoBotonSuperior} numberOfLines={1}>
            Registrar cliente
          </Text>
        </Pressable>
      </View>

      <View style={estilos.contenidoCuerpo}>
        {/* Buscador por DNI, nombre o apellido */}
        <View style={estilos.contenedorBuscador}>
          <Ionicons
            name="search-outline"
            size={20}
            color={COLORES.maderaOscura}
            style={estilos.iconoBuscar}
          />
          <TextInput
            style={estilos.inputBuscador}
            value={textoBusqueda}
            onChangeText={setTextoBusqueda}
            placeholder="Buscar por DNI, nombre o apellido..."
            placeholderTextColor="#6E706D"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {textoBusqueda ? (
            <Pressable
              onPress={() => setTextoBusqueda('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Limpiar búsqueda"
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={COLORES.maderaOscura}
              />
            </Pressable>
          ) : null}
        </View>

        {mensajeAviso ? (
          <View style={estilos.cajaAviso}>
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color={COLORES.maderaOscura}
            />
            <Text style={estilos.textoAviso}>{mensajeAviso}</Text>
          </View>
        ) : null}

        {errorGeneral && !modalFormularioVisible ? (
          <View style={estilos.cajaError}>
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={COLORES.blanco}
            />
            <Text style={estilos.textoErrorBlanco}>{errorGeneral}</Text>
          </View>
        ) : null}

        {cargandoLista ? (
          <View style={estilos.cajaCargando}>
            <ActivityIndicator size="large" color={COLORES.naranja} />
            <Text style={estilos.textoCargando}>Cargando clientes...</Text>
          </View>
        ) : clientesFiltrados.length === 0 ? (
          <View style={estilos.tarjetaVacia}>
            <Ionicons
              name="people-outline"
              size={42}
              color={COLORES.maderaOscura}
            />
            <Text style={estilos.tituloVacio}>
              {textoBusqueda ? 'Sin coincidencias' : 'No hay clientes registrados'}
            </Text>
            <Text style={estilos.textoVacio}>
              {textoBusqueda
                ? 'No se encontraron clientes con ese DNI, nombre o apellido.'
                : 'Tocá "Registrar cliente" para cargar el primero y verlo en la tabla.'}
            </Text>
            {!textoBusqueda ? (
              <Pressable
                style={({ pressed }) => [
                  estilos.botonCrearVacio,
                  pressed && estilos.botonPresionado,
                ]}
                onPress={abrirModalCrear}
              >
                <Text style={estilos.textoBotonBlanco}>REGISTRAR CLIENTE</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={estilos.contenedorTablaHorizontal}
          >
            <View style={estilos.tabla}>
              <View style={estilos.filaEncabezadoTabla}>
                <Text style={[estilos.celdaEncabezado, estilos.colDni]}>DNI</Text>
                <Text style={[estilos.celdaEncabezado, estilos.colNombreApellido]}>
                  Nombre y Apellido
                </Text>
                <Text style={[estilos.celdaEncabezado, estilos.colEstado]}>
                  Estado
                </Text>
                <Text style={[estilos.celdaEncabezado, estilos.colDias]}>
                  Días
                </Text>
                <Text style={[estilos.celdaEncabezado, estilos.colAccion]}>
                  Detalle
                </Text>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={estilos.cuerpoTablaScroll}
              >
                {clientesFiltrados.map((item, indice) => {
                  const esActivo = item.estado === 'Activo';
                  const diasMostrar = esActivo
                    ? `${Number(item.diasDisponibles) || 0} disp.`
                    : `${calcularDiasInactivo(item)} inact.`;

                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => tocarFilaCliente(item)}
                      style={({ pressed }) => [
                        estilos.filaDatoTabla,
                        indice % 2 === 1 && estilos.filaAlternada,
                        pressed && estilos.filaPresionada,
                      ]}
                    >
                      <Text style={[estilos.celdaDato, estilos.colDni]} numberOfLines={1}>
                        {item.dni}
                      </Text>

                      <Text
                        style={[estilos.celdaDato, estilos.colNombreApellido]}
                        numberOfLines={1}
                      >
                        {`${item.nombre} ${item.apellido}`}
                      </Text>

                      <View style={[estilos.celdaCentro, estilos.colEstado]}>
                        <View
                          style={[
                            estilos.insigniaEstado,
                            esActivo
                              ? estilos.insigniaActiva
                              : estilos.insigniaInactiva,
                          ]}
                        >
                          <Text
                            style={[
                              estilos.textoEstado,
                              esActivo
                                ? estilos.textoEstadoActivo
                                : estilos.textoEstadoInactivo,
                            ]}
                          >
                            {item.estado || 'Inactivo'}
                          </Text>
                        </View>
                      </View>

                      <Text style={[estilos.celdaDato, estilos.colDias]} numberOfLines={1}>
                        {diasMostrar}
                      </Text>

                      <View style={[estilos.celdaCentro, estilos.colAccion]}>
                        <Pressable
                          onPress={() => {
                            setClienteSeleccionadoId(item.id);
                            setDniCopiado(false);
                            setModalDetalleVisible(true);
                          }}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          style={estilos.botonVerDetalleRapido}
                          accessibilityLabel={`Ver detalle de ${item.nombre}`}
                        >
                          <Ionicons
                            name="eye-outline"
                            size={18}
                            color={COLORES.naranja}
                          />
                        </Pressable>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </ScrollView>
        )}
      </View>

      {/* Modal de opciones al tocar un cliente en la tabla */}
      <Modal
        visible={modalAccionesVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalAccionesVisible(false)}
      >
        <Pressable
          style={estilos.fondoModal}
          onPress={() => setModalAccionesVisible(false)}
        >
          <Pressable style={estilos.tarjetaAcciones} onPress={() => {}}>
            <Text style={estilos.tituloAcciones} numberOfLines={1}>
              {clienteSeleccionado
                ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`
                : 'Cliente'}
            </Text>
            <Text style={estilos.subtituloAcciones}>
              DNI: {clienteSeleccionado?.dni || '-'}
            </Text>

            <Pressable
              style={({ pressed }) => [
                estilos.botonOpcionAccion,
                pressed && estilos.botonPresionado,
              ]}
              onPress={abrirDetalleDesdeAcciones}
            >
              <Ionicons name="eye-outline" size={20} color={COLORES.naranja} />
              <Text style={estilos.textoOpcionAccion}>Ver detalle</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                estilos.botonOpcionAccion,
                pressed && estilos.botonPresionado,
              ]}
              onPress={abrirEditarDesdeAcciones}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={COLORES.maderaOscura}
              />
              <Text style={estilos.textoOpcionAccion}>Editar cliente</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                estilos.botonOpcionEliminar,
                pressed && estilos.botonPresionado,
              ]}
              onPress={() =>
                clienteSeleccionado && confirmarEliminarCliente(clienteSeleccionado)
              }
            >
              <Ionicons name="trash-outline" size={20} color="#991B1B" />
              <Text style={estilos.textoOpcionEliminar}>Eliminar cliente</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Ventana secundaria (Modal) de Ver detalle */}
      <Modal
        visible={modalDetalleVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalDetalleVisible(false)}
      >
        <View style={estilos.fondoModal}>
          <View style={estilos.tarjetaModal}>
            <View style={estilos.cabeceraModal}>
              <Text style={estilos.tituloModal}>DETALLE DEL CLIENTE</Text>
              <Pressable
                onPress={() => setModalDetalleVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={COLORES.negro} />
              </Pressable>
            </View>

            {clienteSeleccionado ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* DNI con ícono de copiar */}
                <View style={estilos.bloqueDetalle}>
                  <Text style={estilos.etiquetaDetalle}>DNI</Text>
                  <View style={estilos.filaDniCopiar}>
                    <Text style={estilos.valorDetalleDestacado}>
                      {clienteSeleccionado.dni}
                    </Text>
                    <Pressable
                      onPress={() => copiarDniAlPortapapeles(clienteSeleccionado.dni)}
                      style={({ pressed }) => [
                        estilos.botonCopiarHojas,
                        dniCopiado && estilos.botonCopiarConfirmado,
                        pressed && estilos.botonPresionado,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Copiar DNI"
                    >
                      <Ionicons
                        name={dniCopiado ? 'checkmark-outline' : 'copy-outline'}
                        size={20}
                        color={dniCopiado ? '#15803D' : COLORES.naranja}
                      />
                      <Text
                        style={[
                          estilos.textoCopiarHojas,
                          dniCopiado && estilos.textoCopiarConfirmado,
                        ]}
                      >
                        {dniCopiado ? 'Copiado' : 'Copiar'}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <View style={estilos.bloqueDetalle}>
                  <Text style={estilos.etiquetaDetalle}>NOMBRE</Text>
                  <Text style={estilos.valorDetalle}>{clienteSeleccionado.nombre}</Text>
                </View>

                <View style={estilos.bloqueDetalle}>
                  <Text style={estilos.etiquetaDetalle}>APELLIDO</Text>
                  <Text style={estilos.valorDetalle}>
                    {clienteSeleccionado.apellido}
                  </Text>
                </View>

                <View style={estilos.bloqueDetalle}>
                  <Text style={estilos.etiquetaDetalle}>CORREO ELECTRÓNICO</Text>
                  <Text style={estilos.valorDetalle}>{clienteSeleccionado.correo}</Text>
                </View>

                <View style={estilos.bloqueDetalle}>
                  <Text style={estilos.etiquetaDetalle}>TELÉFONO</Text>
                  <Text style={estilos.valorDetalle}>{clienteSeleccionado.telefono}</Text>
                </View>

                <View style={estilos.bloqueDetalle}>
                  <Text style={estilos.etiquetaDetalle}>TELÉFONO DE EMERGENCIA</Text>
                  <Text style={estilos.valorDetalle}>
                    {clienteSeleccionado.telefonoEmergencia}
                  </Text>
                </View>

                <View style={estilos.bloqueDetalle}>
                  <Text style={estilos.etiquetaDetalle}>ESTADO</Text>
                  <View
                    style={[
                      estilos.insigniaEstado,
                      clienteSeleccionado.estado === 'Activo'
                        ? estilos.insigniaActiva
                        : estilos.insigniaInactiva,
                    ]}
                  >
                    <Text
                      style={[
                        estilos.textoEstado,
                        clienteSeleccionado.estado === 'Activo'
                          ? estilos.textoEstadoActivo
                          : estilos.textoEstadoInactivo,
                      ]}
                    >
                      {clienteSeleccionado.estado || 'Inactivo'}
                    </Text>
                  </View>
                </View>

                {clienteSeleccionado.estado === 'Activo' ? (
                  <View style={estilos.bloqueDetalle}>
                    <Text style={estilos.etiquetaDetalle}>DÍAS DISPONIBLES</Text>
                    <Text style={estilos.valorDiasDisponibles}>
                      {Number(clienteSeleccionado.diasDisponibles) || 0} días
                    </Text>
                    {clienteSeleccionado.planActivoNombre ? (
                      <Text style={estilos.subtextoPlanActivo}>
                        Plan actual: {clienteSeleccionado.planActivoNombre}
                      </Text>
                    ) : null}
                  </View>
                ) : (
                  <View style={estilos.bloqueDetalle}>
                    <Text style={estilos.etiquetaDetalle}>DÍAS INACTIVO</Text>
                    <Text style={estilos.valorDiasInactivo}>
                      {calcularDiasInactivo(clienteSeleccionado)} días
                    </Text>
                  </View>
                )}

                <Pressable
                  style={({ pressed }) => [
                    estilos.botonGuardar,
                    estilos.margenSuperiorBoton,
                    pressed && estilos.botonPresionado,
                  ]}
                  onPress={() => setModalDetalleVisible(false)}
                >
                  <Text style={estilos.textoBotonBlanco}>CERRAR</Text>
                </Pressable>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Modal Crear / Editar Cliente */}
      <Modal
        visible={modalFormularioVisible}
        transparent
        animationType="fade"
        onRequestClose={cerrarModalFormulario}
      >
        <KeyboardAvoidingView
          style={estilos.fondoModal}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={estilos.tarjetaModal}>
            <View style={estilos.cabeceraModal}>
              <Text style={estilos.tituloModal}>
                {clienteEditando ? 'EDITAR CLIENTE' : 'REGISTRAR CLIENTE'}
              </Text>
              <Pressable
                onPress={cerrarModalFormulario}
                disabled={guardando}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={COLORES.negro} />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {errorGeneral ? (
                <View style={estilos.cajaError}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color={COLORES.blanco}
                  />
                  <Text style={estilos.textoErrorBlanco}>{errorGeneral}</Text>
                </View>
              ) : null}

              <View style={estilos.grupoCampo}>
                <Text style={estilos.etiqueta}>DNI</Text>
                <TextInput
                  style={[estilos.input, errorDni ? estilos.bordeError : null]}
                  value={dni}
                  onChangeText={(texto) => {
                    const soloDigitos = texto.replace(/[^0-9]/g, '');
                    setDni(soloDigitos);
                    setErrorGeneral('');
                    if (soloDigitos.length > MAX_DNI) {
                      setErrorDni(
                        `El DNI no puede superar los ${MAX_DNI} dígitos`
                      );
                    } else if (errorDni) {
                      validarDni(soloDigitos, true);
                    }
                  }}
                  onBlur={() => validarDni(dni, true)}
                  placeholder="Ej. 40123456"
                  placeholderTextColor="#6E706D"
                  keyboardType="number-pad"
                  maxLength={MAX_DNI}
                  editable={!guardando}
                />
                {errorDni ? (
                  <Text style={estilos.textoErrorCampo}>{errorDni}</Text>
                ) : null}
              </View>

              <View style={estilos.grupoCampo}>
                <Text style={estilos.etiqueta}>NOMBRE</Text>
                <TextInput
                  style={[estilos.input, errorNombre ? estilos.bordeError : null]}
                  value={nombre}
                  onChangeText={(texto) => {
                    setNombre(texto);
                    setErrorGeneral('');
                    if (texto.trim().length > MAX_NOMBRE_APELLIDO) {
                      setErrorNombre(
                        `El nombre no puede superar los ${MAX_NOMBRE_APELLIDO} caracteres`
                      );
                    } else if (errorNombre) {
                      validarNombre(texto, true);
                    }
                  }}
                  onBlur={() => validarNombre(nombre, true)}
                  placeholder="Ej. Lucas"
                  placeholderTextColor="#6E706D"
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={MAX_NOMBRE_APELLIDO}
                  editable={!guardando}
                />
                {errorNombre ? (
                  <Text style={estilos.textoErrorCampo}>{errorNombre}</Text>
                ) : null}
              </View>

              <View style={estilos.grupoCampo}>
                <Text style={estilos.etiqueta}>APELLIDO</Text>
                <TextInput
                  style={[estilos.input, errorApellido ? estilos.bordeError : null]}
                  value={apellido}
                  onChangeText={(texto) => {
                    setApellido(texto);
                    setErrorGeneral('');
                    if (texto.trim().length > MAX_NOMBRE_APELLIDO) {
                      setErrorApellido(
                        `El apellido no puede superar los ${MAX_NOMBRE_APELLIDO} caracteres`
                      );
                    } else if (errorApellido) {
                      validarApellido(texto, true);
                    }
                  }}
                  onBlur={() => validarApellido(apellido, true)}
                  placeholder="Ej. Gómez"
                  placeholderTextColor="#6E706D"
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={MAX_NOMBRE_APELLIDO}
                  editable={!guardando}
                />
                {errorApellido ? (
                  <Text style={estilos.textoErrorCampo}>{errorApellido}</Text>
                ) : null}
              </View>

              <View style={estilos.grupoCampo}>
                <Text style={estilos.etiqueta}>CORREO ELECTRÓNICO</Text>
                <TextInput
                  style={[estilos.input, errorCorreo ? estilos.bordeError : null]}
                  value={correo}
                  onChangeText={(texto) => {
                    setCorreo(texto);
                    setErrorGeneral('');
                    if (errorCorreo) validarCorreo(texto, true);
                  }}
                  onBlur={() => validarCorreo(correo, true)}
                  placeholder="usuario@correo.com"
                  placeholderTextColor="#6E706D"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!guardando}
                />
                {errorCorreo ? (
                  <Text style={estilos.textoErrorCampo}>{errorCorreo}</Text>
                ) : null}
              </View>

              <View style={estilos.grupoCampo}>
                <Text style={estilos.etiqueta}>TELÉFONO</Text>
                <TextInput
                  style={[estilos.input, errorTelefono ? estilos.bordeError : null]}
                  value={telefono}
                  onChangeText={(texto) => {
                    const soloDigitos = texto.replace(/[^0-9]/g, '');
                    setTelefono(soloDigitos);
                    setErrorGeneral('');
                    if (errorTelefono) validarTelefono(soloDigitos, false, true);
                  }}
                  onBlur={() => validarTelefono(telefono, false, true)}
                  placeholder="Ej. 3874123456"
                  placeholderTextColor="#6E706D"
                  keyboardType="phone-pad"
                  maxLength={LIMITE_TELEFONO}
                  editable={!guardando}
                />
                {errorTelefono ? (
                  <Text style={estilos.textoErrorCampo}>{errorTelefono}</Text>
                ) : null}
              </View>

              <View style={estilos.grupoCampo}>
                <Text style={estilos.etiqueta}>TELÉFONO DE EMERGENCIA</Text>
                <TextInput
                  style={[
                    estilos.input,
                    errorTelefonoEmergencia ? estilos.bordeError : null,
                  ]}
                  value={telefonoEmergencia}
                  onChangeText={(texto) => {
                    const soloDigitos = texto.replace(/[^0-9]/g, '');
                    setTelefonoEmergencia(soloDigitos);
                    setErrorGeneral('');
                    if (errorTelefonoEmergencia) {
                      validarTelefono(soloDigitos, true, true);
                    }
                  }}
                  onBlur={() => validarTelefono(telefonoEmergencia, true, true)}
                  placeholder="Ej. 3874987654"
                  placeholderTextColor="#6E706D"
                  keyboardType="phone-pad"
                  maxLength={LIMITE_TELEFONO}
                  editable={!guardando}
                />
                {errorTelefonoEmergencia ? (
                  <Text style={estilos.textoErrorCampo}>
                    {errorTelefonoEmergencia}
                  </Text>
                ) : null}
              </View>

              {!clienteEditando ? (
                <Text style={estilos.notaEstadoInicial}>
                  El cliente se registrará como Inactivo y pasará a Activo cuando abone su cuota.
                </Text>
              ) : null}

              <View style={estilos.contenedorBotonesModal}>
                <Pressable
                  style={({ pressed }) => [
                    estilos.botonGuardar,
                    pressed && !guardando && estilos.botonPresionado,
                    guardando && estilos.botonDeshabilitado,
                  ]}
                  onPress={guardarCliente}
                  disabled={guardando}
                >
                  {guardando ? (
                    <ActivityIndicator size="small" color={COLORES.blanco} />
                  ) : (
                    <Text style={estilos.textoBotonBlanco}>
                      {clienteEditando ? 'GUARDAR CAMBIOS' : 'REGISTRAR CLIENTE'}
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    estilos.botonCancelar,
                    pressed && !guardando && estilos.botonPresionado,
                  ]}
                  onPress={cerrarModalFormulario}
                  disabled={guardando}
                >
                  <Text style={estilos.textoBotonOscuro}>CANCELAR</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantallaCarga: {
    flex: 1,
    backgroundColor: COLORES.blanco,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contenedorPrincipal: {
    flex: 1,
    backgroundColor: COLORES.blanco,
  },
  barraSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 44,
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: COLORES.blanco,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.grisMedio,
  },
  huecoMenuHamburguesa: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tituloEncabezado: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 14.5,
    color: COLORES.negro,
    letterSpacing: 0.4,
    marginHorizontal: 6,
  },
  botonAccionSuperior: {
    minHeight: 38,
    paddingHorizontal: 11,
    borderRadius: 11,
    backgroundColor: COLORES.naranja,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBotonSuperior: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 11.5,
    color: COLORES.blanco,
  },
  contenidoCuerpo: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  contenedorBuscador: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
    backgroundColor: COLORES.blanco,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORES.grisMedio,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  iconoBuscar: {
    marginRight: 8,
  },
  inputBuscador: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: COLORES.negro,
    paddingVertical: 8,
  },
  cajaAviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: COLORES.amarilloDorado,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
  },
  textoAviso: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 12.5,
    color: COLORES.maderaOscura,
  },
  cajaError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#991B1B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  textoErrorBlanco: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 12.5,
    color: COLORES.blanco,
  },
  cajaCargando: {
    marginTop: 50,
    alignItems: 'center',
    gap: 10,
  },
  textoCargando: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: COLORES.maderaOscura,
  },
  tarjetaVacia: {
    marginTop: 24,
    backgroundColor: COLORES.blanco,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORES.grisMedio,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  tituloVacio: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
    color: COLORES.negro,
  },
  textoVacio: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13.5,
    color: COLORES.maderaOscura,
    textAlign: 'center',
    lineHeight: 20,
  },
  botonCrearVacio: {
    marginTop: 6,
    minHeight: 46,
    paddingHorizontal: 22,
    backgroundColor: COLORES.naranja,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contenedorTablaHorizontal: {
    paddingBottom: 12,
  },
  tabla: {
    minWidth: 515,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORES.grisMedio,
    overflow: 'hidden',
    backgroundColor: COLORES.blanco,
  },
  filaEncabezadoTabla: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORES.maderaOscura,
    paddingVertical: 11,
    paddingHorizontal: 10,
  },
  celdaEncabezado: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12,
    color: COLORES.blanco,
    letterSpacing: 0.3,
  },
  cuerpoTablaScroll: {
    paddingBottom: 8,
  },
  filaDatoTabla: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.grisMedio,
    backgroundColor: COLORES.blanco,
  },
  filaAlternada: {
    backgroundColor: '#FAFAFA',
  },
  filaPresionada: {
    backgroundColor: '#FFF7ED',
  },
  celdaDato: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: COLORES.negro,
  },
  celdaCentro: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  colDni: {
    width: 92,
  },
  colNombreApellido: {
    width: 155,
    paddingRight: 8,
  },
  colEstado: {
    width: 94,
  },
  colDias: {
    width: 82,
    paddingLeft: 4,
  },
  colAccion: {
    width: 64,
  },
  insigniaEstado: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  insigniaActiva: {
    backgroundColor: '#F0FDF4',
    borderColor: '#15803D',
  },
  insigniaInactiva: {
    backgroundColor: '#FEF2F2',
    borderColor: '#991B1B',
  },
  textoEstado: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
  },
  textoEstadoActivo: {
    color: '#15803D',
  },
  textoEstadoInactivo: {
    color: '#991B1B',
  },
  botonVerDetalleRapido: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORES.naranja,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fondoModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  tarjetaAcciones: {
    backgroundColor: COLORES.blanco,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORES.amarilloDorado,
    padding: 20,
    gap: 10,
  },
  tituloAcciones: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 16,
    color: COLORES.negro,
  },
  subtituloAcciones: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: COLORES.maderaOscura,
    marginBottom: 4,
  },
  botonOpcionAccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 46,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORES.grisMedio,
    backgroundColor: COLORES.blanco,
  },
  textoOpcionAccion: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORES.negro,
  },
  botonOpcionEliminar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 46,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#991B1B',
    backgroundColor: '#FEF2F2',
  },
  textoOpcionEliminar: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#991B1B',
  },
  tarjetaModal: {
    maxHeight: '90%',
    backgroundColor: COLORES.blanco,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORES.amarilloDorado,
    padding: 20,
  },
  cabeceraModal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  tituloModal: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 16,
    color: COLORES.negro,
  },
  bloqueDetalle: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.grisMedio,
  },
  etiquetaDetalle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 11.5,
    color: COLORES.maderaOscura,
    marginBottom: 3,
  },
  valorDetalle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14.5,
    color: COLORES.negro,
  },
  valorDiasDisponibles: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 16,
    color: '#15803D',
  },
  valorDiasInactivo: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 16,
    color: '#991B1B',
  },
  subtextoPlanActivo: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: COLORES.maderaOscura,
    marginTop: 2,
  },
  filaDniCopiar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  valorDetalleDestacado: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 16,
    color: COLORES.negro,
  },
  botonCopiarHojas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORES.naranja,
    backgroundColor: '#FFF7ED',
  },
  botonCopiarConfirmado: {
    borderColor: '#15803D',
    backgroundColor: '#F0FDF4',
  },
  textoCopiarHojas: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12.5,
    color: COLORES.naranja,
  },
  textoCopiarConfirmado: {
    color: '#15803D',
  },
  grupoCampo: {
    marginBottom: 12,
  },
  etiqueta: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 11.5,
    color: COLORES.negro,
    marginBottom: 5,
  },
  input: {
    minHeight: 45,
    backgroundColor: COLORES.blanco,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORES.grisMedio,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: COLORES.negro,
  },
  bordeError: {
    borderColor: '#991B1B',
    backgroundColor: '#FEF2F2',
  },
  textoErrorCampo: {
    marginTop: 4,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11.5,
    color: '#991B1B',
  },
  notaEstadoInicial: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: COLORES.maderaOscura,
    marginBottom: 6,
    lineHeight: 17,
  },
  contenedorBotonesModal: {
    marginTop: 8,
    gap: 10,
  },
  margenSuperiorBoton: {
    marginTop: 10,
  },
  botonGuardar: {
    minHeight: 48,
    backgroundColor: COLORES.naranja,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonCancelar: {
    minHeight: 44,
    backgroundColor: COLORES.blanco,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORES.maderaOscura,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBotonBlanco: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 13.5,
    color: COLORES.blanco,
    letterSpacing: 0.5,
  },
  textoBotonOscuro: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13,
    color: COLORES.maderaOscura,
    letterSpacing: 0.5,
  },
  botonPresionado: {
    opacity: 0.82,
  },
  botonDeshabilitado: {
    opacity: 0.65,
  },
});