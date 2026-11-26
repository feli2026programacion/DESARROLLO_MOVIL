import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  where,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../src/config/firebaseConfig';
import MenuHamburguesa from './MenuHamburguesa';

const COLORES = {
  blanco: '#FFFFFF',
  negro: '#000000',
  naranja: '#FF6600',
  amarilloDorado: '#FDB813',
  maderaOscura: '#3D2B1F',
  grisMedio: '#BDBFBC',
};

const formatearFechaHora = (isoString) => {
  if (!isoString) return '-';
  const fecha = new Date(isoString);
  if (Number.isNaN(fecha.getTime())) return isoString;
  return fecha.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function Asistencias({ navigation }) {
  const [fuentesCargadas] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  const [asistencias, setAsistencias] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [mensajeAviso, setMensajeAviso] = useState('');
  const [errorGeneral, setErrorGeneral] = useState('');

  // Modal Registrar Asistencia
  const [modalFormularioVisible, setModalFormularioVisible] = useState(false);
  const [siguienteIdPreview, setSiguienteIdPreview] = useState(1);
  const [dniCliente, setDniCliente] = useState('');
  const [errorDni, setErrorDni] = useState('');

  // Ventana secundaria Ver detalle de asistencia
  const [asistenciaSeleccionada, setAsistenciaSeleccionada] = useState(null);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setErrorGeneral('Falta configurar Firebase en el proyecto.');
      setCargandoLista(false);
      return;
    }

    const consultaAsistencias = query(
      collection(db, 'asistencias'),
      orderBy('idAsistencia', 'desc')
    );

    const desuscribir = onSnapshot(
      consultaAsistencias,
      (instantanea) => {
        const lista = instantanea.docs.map((documento) => ({
          id: documento.id,
          ...documento.data(),
        }));
        setAsistencias(lista);

        const maxId = lista.reduce((acum, item) => {
          const valor = Number(item?.idAsistencia) || 0;
          return valor > acum ? valor : acum;
        }, 0);
        setSiguienteIdPreview(maxId + 1);
        setCargandoLista(false);
      },
      () => {
        setErrorGeneral('No se pudieron cargar las asistencias desde Firestore.');
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

  const abrirModalCrear = () => {
    setErrorDni('');
    setErrorGeneral('');
    setMensajeAviso('');
    setDniCliente('');
    setModalFormularioVisible(true);
  };

  const cerrarModalFormulario = () => {
    if (guardando) return;
    setModalFormularioVisible(false);
    setErrorDni('');
    setErrorGeneral('');
  };

  const validarDni = (valor, mostrar = false) => {
    const limpio = valor.trim();
    if (!limpio) {
      if (mostrar) setErrorDni('Falta ingresar el DNI del cliente');
      return false;
    }
    if (!/^[0-9]+$/.test(limpio)) {
      if (mostrar) setErrorDni('El DNI solo puede contener números');
      return false;
    }
    if (limpio.length < 7 || limpio.length > 8) {
      if (mostrar) setErrorDni('El DNI debe tener entre 7 y 8 dígitos');
      return false;
    }
    setErrorDni('');
    return true;
  };

  const obtenerUsuarioActualInfo = async () => {
    const usuarioAuth = auth.currentUser;
    if (!usuarioAuth) {
      return {
        uid: '',
        nombreCompleto: 'Administrador',
        correo: '',
      };
    }

    let nombreCompleto = usuarioAuth.email
      ? usuarioAuth.email.split('@')[0]
      : 'Administrador';

    try {
      const snapUsuario = await getDoc(doc(db, 'usuarios', usuarioAuth.uid));
      if (snapUsuario.exists()) {
        const datosU = snapUsuario.data();
        const armado = [datosU?.nombre, datosU?.apellido]
          .filter(Boolean)
          .join(' ')
          .trim();
        if (armado) {
          nombreCompleto = armado;
        }
      }
    } catch (_e) {
      // Usa respaldo
    }

    return {
      uid: usuarioAuth.uid,
      nombreCompleto,
      correo: usuarioAuth.email || '',
    };
  };

  const buscarClientePorDni = async (dniLimpio) => {
    const consulta = query(
      collection(db, 'clientes'),
      where('dni', '==', dniLimpio)
    );
    const snapshot = await getDocs(consulta);
    if (snapshot.empty) return null;
    const primerDoc = snapshot.docs[0];
    return {
      id: primerDoc.id,
      ...primerDoc.data(),
    };
  };

  const registrarAsistencia = async () => {
    if (guardando) return;

    const dniLimpio = dniCliente.trim();
    const dniOk = validarDni(dniLimpio, true);

    if (!dniOk) {
      setErrorGeneral('Verifique el DNI ingresado antes de registrar la asistencia.');
      return;
    }

    setGuardando(true);
    setErrorGeneral('');

    try {
      const clienteEncontrado = await buscarClientePorDni(dniLimpio);
      if (!clienteEncontrado) {
        setErrorDni('No existe un cliente registrado con este DNI');
        setErrorGeneral('El DNI ingresado no corresponde a ningún cliente.');
        setGuardando(false);
        return;
      }

      const infoUsuario = await obtenerUsuarioActualInfo();
      const ahoraIso = new Date().toISOString();
      const refContadorAsistencias = doc(db, 'contadores', 'asistencias');
      const refCliente = doc(db, 'clientes', clienteEncontrado.id);

      let nuevoIdAsistencia = siguienteIdPreview;
      let diasRestantesCliente = 0;
      let clienteSinDias = false;
      const clienteNombreCompleto =
        `${clienteEncontrado.nombre || ''} ${clienteEncontrado.apellido || ''}`.trim();

      await runTransaction(db, async (transaccion) => {
        const snapContador = await transaccion.get(refContadorAsistencias);
        const snapCliente = await transaccion.get(refCliente);

        if (!snapCliente.exists()) {
          throw new Error('CLIENTE_NO_EXISTE');
        }

        const datosCliente = snapCliente.data();
        const diasActuales = Number(datosCliente?.diasDisponibles) || 0;
        const estadoActual = datosCliente?.estado || 'Inactivo';

        if (estadoActual !== 'Activo' || diasActuales <= 0) {
          clienteSinDias = true;
          throw new Error('SIN_DIAS_DISPONIBLES');
        }

        let ultimoId = 0;
        if (snapContador.exists()) {
          ultimoId = Number(snapContador.data()?.ultimoId) || 0;
        } else {
          asistencias.forEach((a) => {
            const n = Number(a?.idAsistencia) || 0;
            if (n > ultimoId) ultimoId = n;
          });
        }

        nuevoIdAsistencia = ultimoId + 1;
        diasRestantesCliente = Math.max(0, diasActuales - 1);
        const nuevoEstadoCliente =
          diasRestantesCliente > 0 ? 'Activo' : 'Inactivo';

        transaccion.set(
          refContadorAsistencias,
          { ultimoId: nuevoIdAsistencia, fechaActualizacion: ahoraIso },
          { merge: true }
        );

        const refNuevaAsistencia = doc(
          db,
          'asistencias',
          String(nuevoIdAsistencia)
        );
        transaccion.set(refNuevaAsistencia, {
          idAsistencia: nuevoIdAsistencia,
          dniCliente: dniLimpio,
          clienteId: clienteEncontrado.id,
          clienteNombreCompleto,
          fechaHoraRegistro: ahoraIso,
          origenRegistro: 'Manual',
          registradoPorNombre: infoUsuario.nombreCompleto,
          registradoPorCorreo: infoUsuario.correo,
          registradoPorUid: infoUsuario.uid,
        });

        const actualizacionCliente = {
          diasDisponibles: diasRestantesCliente,
          estado: nuevoEstadoCliente,
          fechaActualizacion: ahoraIso,
        };

        if (nuevoEstadoCliente === 'Inactivo') {
          actualizacionCliente.fechaInicioInactividad = ahoraIso;
        }

        transaccion.set(refCliente, actualizacionCliente, { merge: true });
      });

      if (clienteSinDias) {
        setErrorDni(
          'El cliente está Inactivo o no tiene días disponibles. Debe pagar una cuota.'
        );
        setErrorGeneral('No se puede registrar asistencia sin días disponibles.');
        setGuardando(false);
        return;
      }

      setMensajeAviso(
        diasRestantesCliente > 0
          ? `Asistencia #${nuevoIdAsistencia} registrada para ${clienteNombreCompleto}. Le quedan ${diasRestantesCliente} días disponibles.`
          : `Asistencia #${nuevoIdAsistencia} registrada para ${clienteNombreCompleto}. Consumió su último día y pasó a Inactivo.`
      );

      setModalFormularioVisible(false);
    } catch (error) {
      if (error?.message === 'SIN_DIAS_DISPONIBLES') {
        setErrorDni(
          'El cliente está Inactivo o tiene 0 días disponibles. Debe abonar una cuota.'
        );
        setErrorGeneral('No se puede registrar asistencia sin días disponibles.');
      } else {
        setErrorGeneral('No se pudo registrar la asistencia en Firebase.');
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={estilos.contenedorPrincipal}>
      {/* Encabezado superior */}
      <View style={estilos.barraSuperior}>
        <View style={estilos.huecoMenuHamburguesa}>
          <MenuHamburguesa
            navigation={navigation}
            rutaActual="Asistencias"
            onSeccionNoHabilitada={(mensaje) => setMensajeAviso(mensaje)}
          />
        </View>

        <Text style={estilos.tituloEncabezado} numberOfLines={1}>
          ASISTENCIAS
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
          accessibilityLabel="Registrar asistencia"
        >
          <Text style={estilos.textoBotonSuperior} numberOfLines={1}>
            Registrar asistencia
          </Text>
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
            <Text style={estilos.textoCargando}>Cargando asistencias...</Text>
          </View>
        ) : asistencias.length === 0 ? (
          <View style={estilos.tarjetaVacia}>
            <Ionicons
              name="calendar-outline"
              size={42}
              color={COLORES.maderaOscura}
            />
            <Text style={estilos.tituloVacio}>
              No hay asistencias registradas
            </Text>
            <Text style={estilos.textoVacio}>
              Tocá "Registrar asistencia" e ingresá el DNI de un cliente Activo para descontar 1 día disponible.
            </Text>
            <Pressable
              style={({ pressed }) => [
                estilos.botonCrearVacio,
                pressed && estilos.botonPresionado,
              ]}
              onPress={abrirModalCrear}
            >
              <Text style={estilos.textoBotonBlanco}>
                REGISTRAR ASISTENCIA
              </Text>
            </Pressable>
          </View>
        ) : (
          asistencias.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                setAsistenciaSeleccionada(item);
                setModalDetalleVisible(true);
              }}
              style={({ pressed }) => [
                estilos.tarjetaAsistencia,
                pressed && estilos.tarjetaPresionada,
              ]}
            >
              <View style={estilos.filaCabeceraAsistencia}>
                <Text style={estilos.idAsistenciaBadge}>
                  ASISTENCIA #{item.idAsistencia}
                </Text>
                {item.origenRegistro === 'Cuota' ? (
                  <Text style={estilos.badgeOrigenCuota}>Por cuota</Text>
                ) : (
                  <Text style={estilos.badgeOrigenManual}>Manual</Text>
                )}
              </View>

              <Text style={estilos.datoPrincipal}>
                DNI Cliente: {item.dniCliente}
                {item.clienteNombreCompleto
                  ? ` · ${item.clienteNombreCompleto}`
                  : ''}
              </Text>

              <Text style={estilos.fechaAsistencia}>
                Fecha y hora: {formatearFechaHora(item.fechaHoraRegistro)}
              </Text>

              <View style={estilos.separadorTarjeta} />

              <Pressable
                style={({ pressed }) => [
                  estilos.botonDetalleAsistencia,
                  pressed && estilos.botonPresionado,
                ]}
                onPress={() => {
                  setAsistenciaSeleccionada(item);
                  setModalDetalleVisible(true);
                }}
              >
                <Ionicons
                  name="eye-outline"
                  size={17}
                  color={COLORES.naranja}
                />
                <Text style={estilos.textoDetalleAsistencia}>Ver detalle</Text>
              </Pressable>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Ventana secundaria Ver detalle de asistencia */}
      <Modal
        visible={modalDetalleVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalDetalleVisible(false)}
      >
        <View style={estilos.fondoModal}>
          <View style={estilos.tarjetaModal}>
            <View style={estilos.cabeceraModal}>
              <Text style={estilos.tituloModal}>DETALLE DE ASISTENCIA</Text>
              <Pressable
                onPress={() => setModalDetalleVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={COLORES.negro} />
              </Pressable>
            </View>

            {asistenciaSeleccionada ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={estilos.bloqueDetalle}>
                  <Text style={estilos.etiquetaDetalle}>ID DE ASISTENCIA</Text>
                  <Text style={estilos.valorDetalleDestacado}>
                    #{asistenciaSeleccionada.idAsistencia}
                  </Text>
                </View>

                <View style={estilos.bloqueDetalle}>
                  <Text style={estilos.etiquetaDetalle}>DNI DEL CLIENTE</Text>
                  <Text style={estilos.valorDetalle}>
                    {asistenciaSeleccionada.dniCliente}
                  </Text>
                </View>

                {asistenciaSeleccionada.clienteNombreCompleto ? (
                  <View style={estilos.bloqueDetalle}>
                    <Text style={estilos.etiquetaDetalle}>CLIENTE</Text>
                    <Text style={estilos.valorDetalle}>
                      {asistenciaSeleccionada.clienteNombreCompleto}
                    </Text>
                  </View>
                ) : null}

                <View style={estilos.bloqueDetalle}>
                  <Text style={estilos.etiquetaDetalle}>
                    FECHA Y HORA DE REGISTRO
                  </Text>
                  <Text style={estilos.valorDetalle}>
                    {formatearFechaHora(
                      asistenciaSeleccionada.fechaHoraRegistro
                    )}
                  </Text>
                </View>

                <View style={estilos.bloqueDetalle}>
                  <Text style={estilos.etiquetaDetalle}>
                    USUARIO QUE REGISTRÓ LA ASISTENCIA
                  </Text>
                  <Text style={estilos.valorDetalle}>
                    {asistenciaSeleccionada.registradoPorNombre ||
                      'Administrador'}
                  </Text>
                </View>

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

      {/* Modal Registrar Asistencia */}
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
              <Text style={estilos.tituloModal}>REGISTRAR ASISTENCIA</Text>
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

              {/* ID Autoincremental automático */}
              <View style={estilos.grupoCampo}>
                <Text style={estilos.etiqueta}>
                  ID DE ASISTENCIA (AUTOINCREMENTAL)
                </Text>
                <View style={estilos.cajaIdAuto}>
                  <Text style={estilos.textoIdAuto}>#{siguienteIdPreview}</Text>
                  <Text style={estilos.notaAuto}>Asignación automática</Text>
                </View>
              </View>

              {/* DNI del cliente */}
              <View style={estilos.grupoCampo}>
                <Text style={estilos.etiqueta}>DNI DEL CLIENTE</Text>
                <TextInput
                  style={[estilos.input, errorDni ? estilos.bordeError : null]}
                  value={dniCliente}
                  onChangeText={(texto) => {
                    const soloNumeros = texto.replace(/[^0-9]/g, '');
                    setDniCliente(soloNumeros);
                    setErrorGeneral('');
                    if (errorDni) validarDni(soloNumeros, true);
                  }}
                  onBlur={() => validarDni(dniCliente, true)}
                  placeholder="Ingrese DNI del cliente"
                  placeholderTextColor="#6E706D"
                  keyboardType="number-pad"
                  maxLength={8}
                  editable={!guardando}
                />
                {errorDni ? (
                  <Text style={estilos.textoErrorCampo}>{errorDni}</Text>
                ) : null}
              </View>

              <Text style={estilos.notaReglaAsistencia}>
                Al registrar la asistencia se descontará 1 día disponible del cliente. Si llega a 0 días, pasará automáticamente a Inactivo.
              </Text>

              <View style={estilos.contenedorBotonesModal}>
                <Pressable
                  style={({ pressed }) => [
                    estilos.botonGuardar,
                    pressed && !guardando && estilos.botonPresionado,
                    guardando && estilos.botonDeshabilitado,
                  ]}
                  onPress={registrarAsistencia}
                  disabled={guardando}
                >
                  {guardando ? (
                    <ActivityIndicator size="small" color={COLORES.blanco} />
                  ) : (
                    <Text style={estilos.textoBotonBlanco}>
                      REGISTRAR ASISTENCIA
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
    fontSize: 14,
    color: COLORES.negro,
    letterSpacing: 0.3,
    marginHorizontal: 4,
  },
  botonAccionSuperior: {
    minHeight: 38,
    paddingHorizontal: 10,
    borderRadius: 11,
    backgroundColor: COLORES.naranja,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBotonSuperior: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 11,
    color: COLORES.blanco,
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
  tarjetaAsistencia: {
    backgroundColor: COLORES.blanco,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORES.grisMedio,
    padding: 16,
    marginBottom: 14,
  },
  tarjetaPresionada: {
    backgroundColor: '#FFF7ED',
  },
  filaCabeceraAsistencia: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  idAsistenciaBadge: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 13,
    color: COLORES.maderaOscura,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: COLORES.amarilloDorado,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeOrigenCuota: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11.5,
    color: '#15803D',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#15803D',
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeOrigenManual: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11.5,
    color: COLORES.naranja,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: COLORES.naranja,
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: 999,
  },
  datoPrincipal: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORES.negro,
    marginTop: 2,
  },
  fechaAsistencia: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12.5,
    color: '#52525B',
    marginTop: 3,
  },
  separadorTarjeta: {
    height: 1,
    backgroundColor: COLORES.grisMedio,
    marginVertical: 11,
  },
  botonDetalleAsistencia: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORES.naranja,
    backgroundColor: '#FFF7ED',
  },
  textoDetalleAsistencia: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12.5,
    color: COLORES.naranja,
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
    marginBottom: 2,
  },
  valorDetalle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14.5,
    color: COLORES.negro,
  },
  valorDetalleDestacado: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 16,
    color: COLORES.naranja,
  },
  grupoCampo: {
    marginBottom: 13,
  },
  etiqueta: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 11.5,
    color: COLORES.negro,
    marginBottom: 5,
  },
  cajaIdAuto: {
    minHeight: 45,
    backgroundColor: '#F5F5F4',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORES.grisMedio,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textoIdAuto: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 15,
    color: COLORES.negro,
  },
  notaAuto: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11.5,
    color: COLORES.maderaOscura,
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
  notaReglaAsistencia: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: COLORES.maderaOscura,
    lineHeight: 18,
    marginBottom: 6,
  },
  contenedorBotonesModal: {
    marginTop: 10,
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