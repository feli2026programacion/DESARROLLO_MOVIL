import React, { useEffect, useState } from 'react';
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
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../src/config/firebaseConfig';

const COLORES = {
  blanco: '#FFFFFF',
  negro: '#000000',
  naranja: '#FF6600',
  amarilloDorado: '#FDB813',
  maderaOscura: '#3D2B1F',
  grisMedio: '#BDBFBC',
};

const LIMITE_NOMBRE_PLAN = 40;
const LIMITE_MONTO_CARACTERES = 6;
const LIMITE_DIAS_CARACTERES = 3;
const TIPOS_PLAN = ['Mensual', 'Por un día'];

const formatearMonto = (valor) => {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return '$0';
  return `$${numero.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

export default function Planes({ navigation }) {
  const [fuentesCargadas] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  const [planes, setPlanes] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [planEditando, setPlanEditando] = useState(null);

  const [nombrePlan, setNombrePlan] = useState('');
  const [montoPlan, setMontoPlan] = useState('');
  const [diasDisponibles, setDiasDisponibles] = useState('');
  const [tipoPlan, setTipoPlan] = useState('Mensual');

  const [errorNombre, setErrorNombre] = useState('');
  const [errorMonto, setErrorMonto] = useState('');
  const [errorDias, setErrorDias] = useState('');
  const [errorGeneral, setErrorGeneral] = useState('');
  const [mensajeAviso, setMensajeAviso] = useState('');

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setErrorGeneral('Falta configurar Firebase en el proyecto.');
      setCargandoLista(false);
      return;
    }

    const consultaPlanes = query(
      collection(db, 'planes'),
      orderBy('fechaCreacion', 'desc')
    );

    const desuscribir = onSnapshot(
      consultaPlanes,
      (instantanea) => {
        const lista = instantanea.docs.map((documento) => ({
          id: documento.id,
          ...documento.data(),
        }));
        setPlanes(lista);
        setCargandoLista(false);
      },
      () => {
        setErrorGeneral('No se pudieron cargar los planes desde Firestore.');
        setCargandoLista(false);
      }
    );

    return () => desuscribir();
  }, []);

  if (!fuentesCargadas) {
    return (
      <View style={estilos.pantallaCarga}>
        <ActivityIndicator size="large" color={COLORES.naranja} />
      </View>
    );
  }

  const limpiarErroresFormulario = () => {
    setErrorNombre('');
    setErrorMonto('');
    setErrorDias('');
    setErrorGeneral('');
  };

  const abrirModalCrear = () => {
    limpiarErroresFormulario();
    setMensajeAviso('');
    setPlanEditando(null);
    setNombrePlan('');
    setMontoPlan('');
    setDiasDisponibles('');
    setTipoPlan('Mensual');
    setModalVisible(true);
  };

  const abrirModalEditar = (plan) => {
    limpiarErroresFormulario();
    setMensajeAviso('');
    setPlanEditando(plan);
    setNombrePlan(plan?.nombre || '');
    setMontoPlan(
      plan?.monto !== undefined && plan?.monto !== null
        ? String(plan.monto).slice(0, LIMITE_MONTO_CARACTERES)
        : ''
    );
    setDiasDisponibles(
      plan?.diasDisponibles !== undefined && plan?.diasDisponibles !== null
        ? String(plan.diasDisponibles).slice(0, LIMITE_DIAS_CARACTERES)
        : ''
    );
    setTipoPlan(TIPOS_PLAN.includes(plan?.tipo) ? plan.tipo : 'Mensual');
    setModalVisible(true);
  };

  const cerrarModal = () => {
    if (guardando) return;
    setModalVisible(false);
    setPlanEditando(null);
    limpiarErroresFormulario();
  };

  const validarNombrePlan = (valor, mostrar = false) => {
    const limpio = valor.trim();
    if (!limpio) {
      if (mostrar) setErrorNombre('Falta ingresar el nombre del plan');
      return false;
    }
    if (limpio.length > LIMITE_NOMBRE_PLAN) {
      if (mostrar) {
        setErrorNombre(`Máximo ${LIMITE_NOMBRE_PLAN} caracteres`);
      }
      return false;
    }
    setErrorNombre('');
    return true;
  };

  const validarMontoPlan = (valor, mostrar = false) => {
    const limpio = valor.trim();
    if (!limpio) {
      if (mostrar) setErrorMonto('Falta ingresar el monto del plan');
      return false;
    }
    if (limpio.length > LIMITE_MONTO_CARACTERES) {
      if (mostrar) {
        setErrorMonto(`El monto puede tener como máximo ${LIMITE_MONTO_CARACTERES} caracteres`);
      }
      return false;
    }
    const normalizado = limpio.replace(',', '.');
    const numero = Number(normalizado);
    if (Number.isNaN(numero) || numero <= 0) {
      if (mostrar) setErrorMonto('Ingrese un monto válido mayor a 0');
      return false;
    }
    setErrorMonto('');
    return true;
  };

  const validarDiasDisponibles = (valor, mostrar = false) => {
    const limpio = valor.trim();
    if (!limpio) {
      if (mostrar) setErrorDias('Falta ingresar los días disponibles');
      return false;
    }
    if (!/^[0-9]+$/.test(limpio)) {
      if (mostrar) setErrorDias('Solo se permiten números');
      return false;
    }
    const cantidad = Number(limpio);
    if (Number.isNaN(cantidad) || cantidad <= 0) {
      if (mostrar) setErrorDias('Ingrese una cantidad de días mayor a 0');
      return false;
    }
    setErrorDias('');
    return true;
  };

  const manejarCambioMonto = (texto) => {
    const soloPermitidos = texto
      .replace(/[^0-9.,]/g, '')
      .slice(0, LIMITE_MONTO_CARACTERES);
    setMontoPlan(soloPermitidos);
    setErrorGeneral('');
    if (errorMonto) {
      validarMontoPlan(soloPermitidos, true);
    }
  };

  const manejarCambioDias = (texto) => {
    const soloNumeros = texto
      .replace(/[^0-9]/g, '')
      .slice(0, LIMITE_DIAS_CARACTERES);
    setDiasDisponibles(soloNumeros);
    setErrorGeneral('');
    if (errorDias) {
      validarDiasDisponibles(soloNumeros, true);
    }
  };

  const guardarPlan = async () => {
    if (guardando) return;

    const hayCamposVacios =
      !nombrePlan.trim() || !montoPlan.trim() || !diasDisponibles.trim();
    const nombreOk = validarNombrePlan(nombrePlan, true);
    const montoOk = validarMontoPlan(montoPlan, true);
    const diasOk = validarDiasDisponibles(diasDisponibles, true);

    if (!nombreOk || !montoOk || !diasOk) {
      setErrorGeneral(
        hayCamposVacios
          ? 'Faltan datos por completar. Complete todos los campos obligatorios.'
          : 'Revise los datos marcados antes de guardar el plan.'
      );
      return;
    }

    const nombreLimpio = nombrePlan.trim();
    const montoNumerico = Number(montoPlan.replace(',', '.').trim());
    const diasNumericos = Number(diasDisponibles.trim());
    const ahora = new Date().toISOString();

    setGuardando(true);
    setErrorGeneral('');

    try {
      if (planEditando) {
        const refPlan = doc(db, 'planes', planEditando.id);
        await setDoc(
          refPlan,
          {
            nombre: nombreLimpio,
            monto: montoNumerico,
            diasDisponibles: diasNumericos,
            tipo: tipoPlan,
            fechaActualizacion: ahora,
          },
          { merge: true }
        );
        setMensajeAviso('Plan actualizado correctamente.');
      } else {
        // Todo plan nuevo se crea siempre en estado 'Activo'
        await addDoc(collection(db, 'planes'), {
          nombre: nombreLimpio,
          monto: montoNumerico,
          diasDisponibles: diasNumericos,
          tipo: tipoPlan,
          estado: 'Activo',
          fechaCreacion: ahora,
          fechaActualizacion: ahora,
        });
        setMensajeAviso('Plan creado correctamente en estado Activo.');
      }

      setModalVisible(false);
      setPlanEditando(null);
    } catch (_error) {
      setErrorGeneral('No se pudo guardar el plan en Firebase.');
    } finally {
      setGuardando(false);
    }
  };

  const alternarEstadoPlan = async (plan) => {
    if (guardando) return;
    const nuevoEstado = plan?.estado === 'Activo' ? 'Inactivo' : 'Activo';
    setGuardando(true);
    setMensajeAviso('');

    try {
      const refPlan = doc(db, 'planes', plan.id);
      await setDoc(
        refPlan,
        {
          estado: nuevoEstado,
          fechaActualizacion: new Date().toISOString(),
        },
        { merge: true }
      );
      setMensajeAviso(`El plan "${plan.nombre}" ahora está ${nuevoEstado}.`);
    } catch (_error) {
      setMensajeAviso('No se pudo cambiar el estado del plan.');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminarPlan = (plan) => {
    if (guardando) return;
    Alert.alert(
      'Eliminar plan',
      `¿Seguro que querés eliminar el plan "${plan.nombre}" de forma permanente?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setGuardando(true);
            setMensajeAviso('');
            try {
              await deleteDoc(doc(db, 'planes', plan.id));
              setMensajeAviso('Plan eliminado correctamente.');
            } catch (_error) {
              setMensajeAviso('No se pudo eliminar el plan.');
            } finally {
              setGuardando(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={estilos.contenedorPrincipal}>
      {/* Encabezado superior */}
      <View style={estilos.barraSuperior}>
        <Pressable
          onPress={() => navigation.goBack()}
          disabled={guardando}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={({ pressed }) => [
            estilos.botonVolver,
            pressed && estilos.botonPresionado,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name="arrow-back" size={24} color={COLORES.negro} />
        </Pressable>

        <Text style={estilos.tituloEncabezado}>PLANES</Text>

        <Pressable
          onPress={abrirModalCrear}
          disabled={guardando}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={({ pressed }) => [
            estilos.botonAgregarSuperior,
            pressed && estilos.botonPresionado,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Nuevo plan"
        >
          <Ionicons name="add" size={24} color={COLORES.blanco} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={estilos.contenidoScroll}
        showsVerticalScrollIndicator={false}
      >
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

        {errorGeneral && !modalVisible ? (
          <View style={estilos.cajaError}>
            <Ionicons name="alert-circle-outline" size={18} color={COLORES.blanco} />
            <Text style={estilos.textoErrorBlanco}>{errorGeneral}</Text>
          </View>
        ) : null}

        {cargandoLista ? (
          <View style={estilos.cajaCargando}>
            <ActivityIndicator size="large" color={COLORES.naranja} />
            <Text style={estilos.textoCargando}>Cargando planes...</Text>
          </View>
        ) : planes.length === 0 ? (
          <View style={estilos.tarjetaVacia}>
            <Ionicons
              name="barbell-outline"
              size={42}
              color={COLORES.maderaOscura}
            />
            <Text style={estilos.tituloVacio}>No hay planes cargados</Text>
            <Text style={estilos.textoVacio}>
              Creá tu primer plan mensual o por un día para comenzar a administrar las cuotas del gimnasio.
            </Text>
            <Pressable
              style={({ pressed }) => [
                estilos.botonCrearVacio,
                pressed && estilos.botonPresionado,
              ]}
              onPress={abrirModalCrear}
            >
              <Text style={estilos.textoBotonBlanco}>CREAR PLAN</Text>
            </Pressable>
          </View>
        ) : (
          planes.map((plan) => {
            const esActivo = plan.estado === 'Activo';
            const tieneDias =
              plan.diasDisponibles !== undefined &&
              plan.diasDisponibles !== null &&
              String(plan.diasDisponibles).trim() !== '';

            return (
              <View key={plan.id} style={estilos.tarjetaPlan}>
                <View style={estilos.filaSuperiorPlan}>
                  <View style={estilos.infoPrincipalPlan}>
                    <Text style={estilos.nombrePlan}>{plan.nombre}</Text>
                    <Text style={estilos.tipoPlan}>
                      Modalidad: {plan.tipo || 'Mensual'}
                    </Text>
                    <Text style={estilos.diasPlan}>
                      Días disponibles:{' '}
                      {tieneDias ? `${plan.diasDisponibles} días` : 'Sin asignar'}
                    </Text>
                  </View>

                  <View
                    style={[
                      estilos.insigniaEstado,
                      esActivo ? estilos.insigniaActiva : estilos.insigniaInactiva,
                    ]}
                  >
                    <Text
                      style={[
                        estilos.textoEstado,
                        esActivo ? estilos.textoEstadoActivo : estilos.textoEstadoInactivo,
                      ]}
                    >
                      {plan.estado || 'Activo'}
                    </Text>
                  </View>
                </View>

                <Text style={estilos.montoPlan}>{formatearMonto(plan.monto)}</Text>

                <View style={estilos.separadorTarjeta} />

                <View style={estilos.filaAccionesPlan}>
                  <Pressable
                    style={({ pressed }) => [
                      estilos.botonAccionSecundario,
                      pressed && estilos.botonPresionado,
                    ]}
                    onPress={() => alternarEstadoPlan(plan)}
                    disabled={guardando}
                  >
                    <Ionicons
                      name={esActivo ? 'pause-circle-outline' : 'play-circle-outline'}
                      size={18}
                      color={COLORES.maderaOscura}
                    />
                    <Text style={estilos.textoAccionSecundario}>
                      {esActivo ? 'Inactivar' : 'Activar'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      estilos.botonAccionEditar,
                      pressed && estilos.botonPresionado,
                    ]}
                    onPress={() => abrirModalEditar(plan)}
                    disabled={guardando}
                  >
                    <Ionicons
                      name="create-outline"
                      size={18}
                      color={COLORES.naranja}
                    />
                    <Text style={estilos.textoAccionEditar}>Editar</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      estilos.botonAccionEliminar,
                      pressed && estilos.botonPresionado,
                    ]}
                    onPress={() => confirmarEliminarPlan(plan)}
                    disabled={guardando}
                  >
                    <Ionicons name="trash-outline" size={18} color="#991B1B" />
                    <Text style={estilos.textoAccionEliminar}>Eliminar</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal para Crear / Editar Plan */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={cerrarModal}
      >
        <KeyboardAvoidingView
          style={estilos.fondoModal}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={estilos.tarjetaModal}>
            <View style={estilos.cabeceraModal}>
              <Text style={estilos.tituloModal}>
                {planEditando ? 'EDITAR PLAN' : 'NUEVO PLAN'}
              </Text>
              <Pressable
                onPress={cerrarModal}
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

              {/* Nombre del plan */}
              <View style={estilos.grupoCampo}>
                <Text style={estilos.etiqueta}>NOMBRE DEL PLAN</Text>
                <TextInput
                  style={[
                    estilos.input,
                    errorNombre ? estilos.bordeError : null,
                  ]}
                  value={nombrePlan}
                  onChangeText={(texto) => {
                    setNombrePlan(texto);
                    setErrorGeneral('');
                    if (errorNombre) validarNombrePlan(texto, true);
                  }}
                  onBlur={() => validarNombrePlan(nombrePlan, true)}
                  placeholder="Ej. Pase Libre Mensual"
                  placeholderTextColor="#6E706D"
                  maxLength={LIMITE_NOMBRE_PLAN}
                  editable={!guardando}
                />
                {errorNombre ? (
                  <Text style={estilos.textoErrorCampo}>{errorNombre}</Text>
                ) : null}
              </View>

              {/* Monto (máx. 6 caracteres) */}
              <View style={estilos.grupoCampo}>
                <Text style={estilos.etiqueta}>
                  MONTO ($) (MÁX. {LIMITE_MONTO_CARACTERES} CAR.)
                </Text>
                <TextInput
                  style={[
                    estilos.input,
                    errorMonto ? estilos.bordeError : null,
                  ]}
                  value={montoPlan}
                  onChangeText={manejarCambioMonto}
                  onBlur={() => validarMontoPlan(montoPlan, true)}
                  placeholder="Ej. 25000"
                  placeholderTextColor="#6E706D"
                  keyboardType="decimal-pad"
                  maxLength={LIMITE_MONTO_CARACTERES}
                  editable={!guardando}
                />
                {errorMonto ? (
                  <Text style={estilos.textoErrorCampo}>{errorMonto}</Text>
                ) : null}
              </View>

              {/* Días disponibles (solo números) */}
              <View style={estilos.grupoCampo}>
                <Text style={estilos.etiqueta}>DÍAS DISPONIBLES (SOLO NÚMEROS)</Text>
                <TextInput
                  style={[
                    estilos.input,
                    errorDias ? estilos.bordeError : null,
                  ]}
                  value={diasDisponibles}
                  onChangeText={manejarCambioDias}
                  onBlur={() => validarDiasDisponibles(diasDisponibles, true)}
                  placeholder="Ej. 30 o 1"
                  placeholderTextColor="#6E706D"
                  keyboardType="number-pad"
                  maxLength={LIMITE_DIAS_CARACTERES}
                  editable={!guardando}
                />
                {errorDias ? (
                  <Text style={estilos.textoErrorCampo}>{errorDias}</Text>
                ) : null}
              </View>

              {/* Tipo: Mensual o Por un día */}
              <View style={estilos.grupoCampo}>
                <Text style={estilos.etiqueta}>TIPO DE PLAN</Text>
                <View style={estilos.filaOpciones}>
                  {TIPOS_PLAN.map((opcion) => {
                    const seleccionada = tipoPlan === opcion;
                    return (
                      <Pressable
                        key={opcion}
                        style={[
                          estilos.opcionSelector,
                          seleccionada && estilos.opcionSeleccionada,
                        ]}
                        onPress={() => setTipoPlan(opcion)}
                        disabled={guardando}
                      >
                        <Text
                          style={[
                            estilos.textoOpcion,
                            seleccionada && estilos.textoOpcionSeleccionada,
                          ]}
                        >
                          {opcion}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={estilos.contenedorBotonesModal}>
                <Pressable
                  style={({ pressed }) => [
                    estilos.botonGuardar,
                    pressed && !guardando && estilos.botonPresionado,
                    guardando && estilos.botonDeshabilitado,
                  ]}
                  onPress={guardarPlan}
                  disabled={guardando}
                >
                  {guardando ? (
                    <ActivityIndicator size="small" color={COLORES.blanco} />
                  ) : (
                    <Text style={estilos.textoBotonBlanco}>
                      {planEditando ? 'GUARDAR CAMBIOS' : 'CREAR PLAN'}
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    estilos.botonCancelar,
                    pressed && !guardando && estilos.botonPresionado,
                  ]}
                  onPress={cerrarModal}
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
  botonVolver: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORES.blanco,
    borderWidth: 1.5,
    borderColor: COLORES.grisMedio,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tituloEncabezado: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 16,
    color: COLORES.negro,
    letterSpacing: 0.6,
  },
  botonAgregarSuperior: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORES.naranja,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contenidoScroll: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 36,
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
    paddingVertical: 10,
    marginBottom: 14,
  },
  textoAviso: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
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
    marginBottom: 14,
  },
  textoErrorBlanco: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 12.5,
    color: COLORES.blanco,
  },
  cajaCargando: {
    marginTop: 60,
    alignItems: 'center',
    gap: 10,
  },
  textoCargando: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: COLORES.maderaOscura,
  },
  tarjetaVacia: {
    marginTop: 30,
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
  tarjetaPlan: {
    backgroundColor: COLORES.blanco,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORES.grisMedio,
    padding: 16,
    marginBottom: 14,
  },
  filaSuperiorPlan: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoPrincipalPlan: {
    flex: 1,
  },
  nombrePlan: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
    color: COLORES.negro,
  },
  tipoPlan: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: COLORES.maderaOscura,
    marginTop: 2,
  },
  diasPlan: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12.5,
    color: COLORES.maderaOscura,
    marginTop: 2,
  },
  insigniaEstado: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
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
    fontSize: 11.5,
  },
  textoEstadoActivo: {
    color: '#15803D',
  },
  textoEstadoInactivo: {
    color: '#991B1B',
  },
  montoPlan: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 20,
    color: COLORES.naranja,
    marginTop: 10,
  },
  separadorTarjeta: {
    height: 1,
    backgroundColor: COLORES.grisMedio,
    marginVertical: 12,
  },
  filaAccionesPlan: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  botonAccionSecundario: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORES.maderaOscura,
    backgroundColor: COLORES.blanco,
  },
  textoAccionSecundario: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: COLORES.maderaOscura,
  },
  botonAccionEditar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORES.naranja,
    backgroundColor: '#FFF7ED',
  },
  textoAccionEditar: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: COLORES.naranja,
  },
  botonAccionEliminar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#991B1B',
    backgroundColor: '#FEF2F2',
  },
  textoAccionEliminar: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#991B1B',
  },
  fondoModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 24,
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
  grupoCampo: {
    marginBottom: 14,
  },
  etiqueta: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12,
    color: COLORES.negro,
    marginBottom: 6,
  },
  input: {
    minHeight: 46,
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
  filaOpciones: {
    flexDirection: 'row',
    gap: 10,
  },
  opcionSelector: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORES.grisMedio,
    backgroundColor: COLORES.blanco,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  opcionSeleccionada: {
    borderColor: COLORES.naranja,
    backgroundColor: '#FFF7ED',
  },
  textoOpcion: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: COLORES.maderaOscura,
  },
  textoOpcionSeleccionada: {
    color: COLORES.naranja,
  },
  contenedorBotonesModal: {
    marginTop: 8,
    gap: 10,
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