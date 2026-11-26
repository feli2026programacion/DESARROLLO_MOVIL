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
  setDoc,
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

const METODOS_PAGO = ['Transferencia', 'Efectivo'];

const formatearMonto = (valor) => {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return '$0';
  return `$${numero.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
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

export default function Cuotas({ navigation }) {
  const [fuentesCargadas] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  const [cuotas, setCuotas] = useState([]);
  const [planesDisponibles, setPlanesDisponibles] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [mensajeAviso, setMensajeAviso] = useState('');
  const [errorGeneral, setErrorGeneral] = useState('');

  // Modal Crear / Editar Cuota
  const [modalFormularioVisible, setModalFormularioVisible] = useState(false);
  const [cuotaEditando, setCuotaEditando] = useState(null);
  const [siguienteIdPreview, setSiguienteIdPreview] = useState(1);

  const [dniCliente, setDniCliente] = useState('');
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [montoPlan, setMontoPlan] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [listaPlanesAbierta, setListaPlanesAbierta] = useState(false);

  const [errorDni, setErrorDni] = useState('');
  const [errorPlan, setErrorPlan] = useState('');
  const [errorMetodo, setErrorMetodo] = useState('');

  // Modal de opciones al tocar una cuota y ventana secundaria Ver detalle
  const [cuotaSeleccionada, setCuotaSeleccionada] = useState(null);
  const [modalAccionesVisible, setModalAccionesVisible] = useState(false);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setErrorGeneral('Falta configurar Firebase en el proyecto.');
      setCargandoLista(false);
      return;
    }

    const consultaCuotas = query(
      collection(db, 'cuotas'),
      orderBy('idCuota', 'desc')
    );

    const desuscribirCuotas = onSnapshot(
      consultaCuotas,
      (instantanea) => {
        const lista = instantanea.docs.map((documento) => ({
          id: documento.id,
          ...documento.data(),
        }));
        setCuotas(lista);

        const maxId = lista.reduce((acum, item) => {
          const valor = Number(item?.idCuota) || 0;
          return valor > acum ? valor : acum;
        }, 0);
        setSiguienteIdPreview(maxId + 1);
        setCargandoLista(false);
      },
      () => {
        setErrorGeneral('No se pudieron cargar las cuotas desde Firestore.');
        setCargandoLista(false);
      }
    );

    const consultaPlanes = query(
      collection(db, 'planes'),
      orderBy('fechaCreacion', 'desc')
    );

    const desuscribirPlanes = onSnapshot(
      consultaPlanes,
      (instantanea) => {
        const listaPlanes = instantanea.docs.map((documento) => ({
          id: documento.id,
          ...documento.data(),
        }));
        setPlanesDisponibles(listaPlanes);
      },
      () => {
        // Si falla la escucha de planes, se maneja al abrir
      }
    );

    return () => {
      desuscribirCuotas();
      desuscribirPlanes();
    };
  }, []);

  if (!fuentesCargadas) {
    return (
      <View style={estilos.pantallaCarga}>
        <ActivityIndicator size="large" color={COLORES.naranja} />
      </View>
    );
  }

  const limpiarErrores = () => {
    setErrorDni('');
    setErrorPlan('');
    setErrorMetodo('');
    setErrorGeneral('');
  };

  const abrirModalCrear = () => {
    limpiarErrores();
    setMensajeAviso('');
    setCuotaEditando(null);
    setDniCliente('');
    setPlanSeleccionado(null);
    setMontoPlan('');
    setMetodoPago('Efectivo');
    setListaPlanesAbierta(false);
    setModalFormularioVisible(true);
  };

  const abrirModalEditar = (cuota) => {
    limpiarErrores();
    setMensajeAviso('');
    setCuotaEditando(cuota);
    setDniCliente(String(cuota?.dniCliente || ''));

    const planCoincidente =
      planesDisponibles.find((p) => p.id === cuota?.planId) ||
      planesDisponibles.find((p) => p.nombre === cuota?.planNombre) ||
      (cuota?.planNombre
        ? {
            id: cuota?.planId || '',
            nombre: cuota.planNombre,
            monto: cuota.monto,
            tipo: cuota.tipoPlan || 'Mensual',
            diasDisponibles: cuota.diasDisponibles || 0,
          }
        : null);

    setPlanSeleccionado(planCoincidente);
    setMontoPlan(
      cuota?.monto !== undefined && cuota?.monto !== null
        ? String(cuota.monto)
        : ''
    );
    setMetodoPago(
      METODOS_PAGO.includes(cuota?.metodoPago) ? cuota.metodoPago : 'Efectivo'
    );
    setListaPlanesAbierta(false);
    setModalFormularioVisible(true);
  };

  const cerrarModalFormulario = () => {
    if (guardando) return;
    setModalFormularioVisible(false);
    setCuotaEditando(null);
    setListaPlanesAbierta(false);
    limpiarErrores();
  };

  const seleccionarPlan = (plan) => {
    setPlanSeleccionado(plan);
    setMontoPlan(
      plan?.monto !== undefined && plan?.monto !== null ? String(plan.monto) : ''
    );
    setErrorPlan('');
    setErrorGeneral('');
    setListaPlanesAbierta(false);
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

  const guardarCuota = async () => {
    if (guardando) return;

    const dniLimpio = dniCliente.trim();
    const dniOk = validarDni(dniLimpio, true);
    const planOk = Boolean(planSeleccionado);
    const metodoOk = METODOS_PAGO.includes(metodoPago);

    if (!planOk) {
      setErrorPlan('Seleccione un plan creado');
    } else {
      setErrorPlan('');
    }

    if (!metodoOk) {
      setErrorMetodo('Seleccione un método de pago');
    } else {
      setErrorMetodo('');
    }

    if (!dniOk || !planOk || !metodoOk) {
      setErrorGeneral(
        !dniLimpio || !planOk
          ? 'Faltan datos por completar. Complete todos los campos obligatorios.'
          : 'Revise los campos marcados antes de guardar.'
      );
      return;
    }

    setGuardando(true);
    setErrorGeneral('');

    try {
      const clienteEncontrado = await buscarClientePorDni(dniLimpio);
      if (!clienteEncontrado) {
        setErrorDni('No existe un cliente registrado con este DNI');
        setErrorGeneral('Verifique el DNI del cliente antes de registrar la cuota.');
        setGuardando(false);
        return;
      }

      const infoUsuario = await obtenerUsuarioActualInfo();
      const ahoraIso = new Date().toISOString();
      const montoNumerico = Number(planSeleccionado.monto) || 0;
      const diasPlan = Number(planSeleccionado.diasDisponibles) || 0;
      const clienteNombreCompleto =
        `${clienteEncontrado.nombre || ''} ${clienteEncontrado.apellido || ''}`.trim();

      if (cuotaEditando) {
        const refCuota = doc(db, 'cuotas', cuotaEditando.id);
        await setDoc(
          refCuota,
          {
            dniCliente: dniLimpio,
            clienteId: clienteEncontrado.id,
            clienteNombreCompleto,
            planId: planSeleccionado.id || '',
            planNombre: planSeleccionado.nombre,
            tipoPlan: planSeleccionado.tipo || 'Mensual',
            diasDisponibles: diasPlan,
            monto: montoNumerico,
            metodoPago,
            fechaActualizacion: ahoraIso,
          },
          { merge: true }
        );

        await setDoc(
          doc(db, 'clientes', clienteEncontrado.id),
          {
            estado: 'Activo',
            planActivoNombre: planSeleccionado.nombre,
            fechaActualizacion: ahoraIso,
          },
          { merge: true }
        );

        setMensajeAviso(`Cuota #${cuotaEditando.idCuota} actualizada.`);
      } else {
        const refContadorCuotas = doc(db, 'contadores', 'cuotas');
        const refContadorAsistencias = doc(db, 'contadores', 'asistencias');
        const refCliente = doc(db, 'clientes', clienteEncontrado.id);

        let nuevoIdCuota = siguienteIdPreview;
        let nuevoIdAsistencia = 1;
        let diasRestantesCliente = Math.max(0, diasPlan - 1);

        await runTransaction(db, async (transaccion) => {
          const snapContadorCuotas = await transaccion.get(refContadorCuotas);
          const snapContadorAsistencias = await transaccion.get(
            refContadorAsistencias
          );
          const snapCliente = await transaccion.get(refCliente);

          let ultimoCuota = 0;
          if (snapContadorCuotas.exists()) {
            ultimoCuota = Number(snapContadorCuotas.data()?.ultimoId) || 0;
          } else {
            cuotas.forEach((c) => {
              const n = Number(c?.idCuota) || 0;
              if (n > ultimoCuota) ultimoCuota = n;
            });
          }

          let ultimoAsistencia = 0;
          if (snapContadorAsistencias.exists()) {
            ultimoAsistencia =
              Number(snapContadorAsistencias.data()?.ultimoId) || 0;
          }

          nuevoIdCuota = ultimoCuota + 1;
          nuevoIdAsistencia = ultimoAsistencia + 1;

          const diasPreviosCliente = snapCliente.exists()
            ? Number(snapCliente.data()?.diasDisponibles) || 0
            : 0;
          const totalDiasAntesDeAsistencia = diasPreviosCliente + diasPlan;
          diasRestantesCliente = Math.max(0, totalDiasAntesDeAsistencia - 1);
          const estadoFinalCliente =
            diasRestantesCliente > 0 ? 'Activo' : 'Inactivo';

          transaccion.set(
            refContadorCuotas,
            { ultimoId: nuevoIdCuota, fechaActualizacion: ahoraIso },
            { merge: true }
          );

          transaccion.set(
            refContadorAsistencias,
            { ultimoId: nuevoIdAsistencia, fechaActualizacion: ahoraIso },
            { merge: true }
          );

          const refNuevaCuota = doc(db, 'cuotas', String(nuevoIdCuota));
          transaccion.set(refNuevaCuota, {
            idCuota: nuevoIdCuota,
            dniCliente: dniLimpio,
            clienteId: clienteEncontrado.id,
            clienteNombreCompleto,
            planId: planSeleccionado.id || '',
            planNombre: planSeleccionado.nombre,
            tipoPlan: planSeleccionado.tipo || 'Mensual',
            diasDisponibles: diasPlan,
            monto: montoNumerico,
            metodoPago,
            fechaHoraRegistro: ahoraIso,
            fechaActualizacion: ahoraIso,
            registradoPorNombre: infoUsuario.nombreCompleto,
            registradoPorCorreo: infoUsuario.correo,
            registradoPorUid: infoUsuario.uid,
          });

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
            origenRegistro: 'Cuota',
            cuotaId: nuevoIdCuota,
            registradoPorNombre: infoUsuario.nombreCompleto,
            registradoPorCorreo: infoUsuario.correo,
            registradoPorUid: infoUsuario.uid,
          });

          const actualizacionCliente = {
            estado: estadoFinalCliente,
            diasDisponibles: diasRestantesCliente,
            planActivoNombre: planSeleccionado.nombre,
            fechaActualizacion: ahoraIso,
          };

          if (estadoFinalCliente === 'Inactivo') {
            actualizacionCliente.fechaInicioInactividad = ahoraIso;
          }

          transaccion.set(refCliente, actualizacionCliente, { merge: true });
        });

        setMensajeAviso(
          `Cuota #${nuevoIdCuota} y Asistencia #${nuevoIdAsistencia} registradas. Días disponibles de ${clienteNombreCompleto}: ${diasRestantesCliente}.`
        );
      }

      setModalFormularioVisible(false);
      setCuotaEditando(null);
      setListaPlanesAbierta(false);
    } catch (_error) {
      setErrorGeneral('No se pudo guardar la cuota en Firebase.');
    } finally {
      setGuardando(false);
    }
  };

  const tocarCuota = (cuota) => {
    setCuotaSeleccionada(cuota);
    setModalAccionesVisible(true);
  };

  const abrirDetalleCuota = () => {
    setModalAccionesVisible(false);
    setModalDetalleVisible(true);
  };

  const abrirEditarCuotaDesdeAcciones = () => {
    const objetivo = cuotaSeleccionada;
    setModalAccionesVisible(false);
    if (objetivo) {
      abrirModalEditar(objetivo);
    }
  };

  return (
    <View style={estilos.contenedorPrincipal}>
      {/* Encabezado superior */}
      <View style={estilos.barraSuperior}>
        <View style={estilos.huecoMenuHamburguesa}>
          <MenuHamburguesa
            navigation={navigation}
            rutaActual="Cuotas"
            onSeccionNoHabilitada={(mensaje) => setMensajeAviso(mensaje)}
          />
        </View>

        <Text style={estilos.tituloEncabezado} numberOfLines={1}>
          CUOTAS
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
          accessibilityLabel="Registrar cuota"
        >
          <Text style={estilos.textoBotonSuperior} numberOfLines={1}>
            Registrar cuota
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
            <Text style={estilos.textoCargando}>Cargando cuotas...</Text>
          </View>
        ) : cuotas.length === 0 ? (
          <View style={estilos.tarjetaVacia}>
            <Ionicons
              name="card-outline"
              size={42}
              color={COLORES.maderaOscura}
            />
            <Text style={estilos.tituloVacio}>No hay cuotas registradas</Text>
            <Text style={estilos.textoVacio}>
              Tocá "Registrar cuota" para cargar la primera, activar al cliente y registrar automáticamente su asistencia.
            </Text>
            <Pressable
              style={({ pressed }) => [
                estilos.botonCrearVacio,
                pressed && estilos.botonPresionado,
              ]}
              onPress={abrirModalCrear}
            >
              <Text style={estilos.textoBotonBlanco}>REGISTRAR CUOTA</Text>
            </Pressable>
          </View>
        ) : (
          cuotas.map((cuota) => (
            <Pressable
              key={cuota.id}
              onPress={() => tocarCuota(cuota)}
              style={({ pressed }) => [
                estilos.tarjetaCuota,
                pressed && estilos.tarjetaPresionada,
              ]}
            >
              <View style={estilos.filaCabeceraCuota}>
                <Text style={estilos.idCuotaBadge}>
                  CUOTA #{cuota.idCuota}
                </Text>
                <Text style={estilos.montoCuota}>
                  {formatearMonto(cuota.monto)}
                </Text>
              </View>

              <Text style={estilos.datoCuotaPrincipal}>
                DNI Cliente: {cuota.dniCliente}
                {cuota.clienteNombreCompleto
                  ? ` · ${cuota.clienteNombreCompleto}`
                  : ''}
              </Text>

              <Text style={estilos.datoCuotaSecundario}>
                Plan: {cuota.planNombre} · {cuota.metodoPago}
              </Text>

              <Text style={estilos.fechaCuota}>
                Registrada: {formatearFechaHora(cuota.fechaHoraRegistro)}
              </Text>

              <View style={estilos.separadorTarjeta} />

              <View style={estilos.filaPieCuota}>
                <Pressable
                  style={({ pressed }) => [
                    estilos.botonDetalleCuota,
                    pressed && estilos.botonPresionado,
                  ]}
                  onPress={() => {
                    setCuotaSeleccionada(cuota);
                    setModalDetalleVisible(true);
                  }}
                >
                  <Ionicons
                    name="eye-outline"
                    size={17}
                    color={COLORES.naranja}
                  />
                  <Text style={estilos.textoDetalleCuota}>Ver detalle</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    estilos.botonEditarCuota,
                    pressed && estilos.botonPresionado,
                  ]}
                  onPress={() => abrirModalEditar(cuota)}
                  disabled={guardando}
                >
                  <Ionicons
                    name="create-outline"
                    size={17}
                    color={COLORES.maderaOscura}
                  />
                  <Text style={estilos.textoEditarCuota}>Editar</Text>
                </Pressable>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Modal de acciones al tocar una cuota */}
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
            <Text style={estilos.tituloAcciones}>
              Cuota #{cuotaSeleccionada?.idCuota}
            </Text>
            <Text style={estilos.subtituloAcciones}>
              DNI Cliente: {cuotaSeleccionada?.dniCliente || '-'}
            </Text>

            <Pressable
              style={({ pressed }) => [
                estilos.botonOpcionAccion,
                pressed && estilos.botonPresionado,
              ]}
              onPress={abrirDetalleCuota}
            >
              <Ionicons name="eye-outline" size={20} color={COLORES.naranja} />
              <Text style={estilos.textoOpcionAccion}>Ver detalle</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                estilos.botonOpcionAccion,
                pressed && estilos.botonPresionado,
              ]}
              onPress={abrirEditarCuotaDesdeAcciones}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={COLORES.maderaOscura}
              />
              <Text style={estilos.textoOpcionAccion}>Editar cuota</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Ventana secundaria Ver detalle de la cuota */}
      <Modal
        visible={modalDetalleVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalDetalleVisible(false)}
      >
        <View style={estilos.fondoModal}>
          <View style={estilos.tarjetaModal}>
            <View style={estilos.cabeceraModal}>
              <Text style={estilos.tituloModal}>DETALLE DE CUOTA</Text>
              <Pressable
                onPress={() => setModalDetalleVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={COLORES.negro} />
              </Pressable>
            </View>

            {cuotaSeleccionada ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={estilos.bloqueDetalle}>
                  <Text style={estilos.etiquetaDetalle}>ID DE CUOTA</Text>
                  <Text style={estilos.valorDetalleDestacado}>
                    #{cuotaSeleccionada.idCuota}
                  </Text>
                </View>

                <View style={estilos.bloqueDetalle}>
                  <Text style={estilos.etiquetaDetalle}>DNI DEL CLIENTE</Text>
                  <Text style={estilos.valorDetalle}>
                    {cuotaSeleccionada.dniCliente}
                  </Text>
                </View>

                {cuotaSeleccionada.clienteNombreCompleto ? (
                  <View style={estilos.bloqueDetalle}>
                    <Text style={estilos.etiquetaDetalle}>CLIENTE</Text>
                    <Text style={estilos.valorDetalle}>
                      {cuotaSeleccionada.clienteNombreCompleto}
                    </Text>
                  </View>
                ) : null}

                <View style={estilos.bloqueDetalle}>
                  <Text style={estilos.etiquetaDetalle}>PLAN</Text>
                  <Text style={estilos.valorDetalle}>
                    {cuotaSeleccionada.planNombre}
                  </Text>
                </View>

                <View style={estilos.bloqueDetalle}>
                  <Text style={estilos.etiquetaDetalle}>MONTO</Text>
                  <Text style={estilos.valorDetalleDestacado}>
                    {formatearMonto(cuotaSeleccionada.monto)}
                  </Text>
                </View>

                <View style={estilos.bloqueDetalle}>
                  <Text style={estilos.etiquetaDetalle}>MÉTODO DE PAGO</Text>
                  <Text style={estilos.valorDetalle}>
                    {cuotaSeleccionada.metodoPago}
                  </Text>
                </View>

                <View style={estilos.bloqueDetalle}>
                  <Text style={estilos.etiquetaDetalle}>FECHA Y HORA DE REGISTRO</Text>
                  <Text style={estilos.valorDetalle}>
                    {formatearFechaHora(cuotaSeleccionada.fechaHoraRegistro)}
                  </Text>
                </View>

                <View style={estilos.bloqueDetalle}>
                  <Text style={estilos.etiquetaDetalle}>
                    USUARIO QUE REGISTRÓ LA CUOTA
                  </Text>
                  <Text style={estilos.valorDetalle}>
                    {cuotaSeleccionada.registradoPorNombre || 'Administrador'}
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

      {/* Modal Registrar / Editar Cuota */}
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
                {cuotaEditando
                  ? `EDITAR CUOTA #${cuotaEditando.idCuota}`
                  : 'REGISTRAR CUOTA'}
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

              {/* ID Autoincremental automático */}
              <View style={estilos.grupoCampo}>
                <Text style={estilos.etiqueta}>ID DE CUOTA (AUTOINCREMENTAL)</Text>
                <View style={estilos.cajaIdAuto}>
                  <Text style={estilos.textoIdAuto}>
                    #
                    {cuotaEditando
                      ? cuotaEditando.idCuota
                      : siguienteIdPreview}
                  </Text>
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

              {/* Apartado PLANES + Monto al lado */}
              <View style={estilos.filaPlanYMonto}>
                <View style={estilos.columnaPlan}>
                  <Text style={estilos.etiqueta}>PLANES</Text>
                  <Pressable
                    onPress={() => {
                      if (!guardando) {
                        setListaPlanesAbierta((prev) => !prev);
                      }
                    }}
                    style={[
                      estilos.selectorPlanBoton,
                      errorPlan ? estilos.bordeError : null,
                    ]}
                  >
                    <Text
                      style={
                        planSeleccionado
                          ? estilos.textoPlanSeleccionado
                          : estilos.textoPlaceholderPlan
                      }
                      numberOfLines={1}
                    >
                      {planSeleccionado
                        ? planSeleccionado.nombre
                        : 'Elegir plan'}
                    </Text>
                    <Ionicons
                      name={
                        listaPlanesAbierta
                          ? 'chevron-up-outline'
                          : 'chevron-down-outline'
                      }
                      size={18}
                      color={COLORES.maderaOscura}
                    />
                  </Pressable>
                </View>

                <View style={estilos.columnaMonto}>
                  <Text style={estilos.etiqueta}>MONTO</Text>
                  <View style={estilos.cajaMontoAuto}>
                    <Text style={estilos.textoMontoAuto} numberOfLines={1}>
                      {montoPlan !== '' ? formatearMonto(montoPlan) : '$0'}
                    </Text>
                  </View>
                </View>
              </View>

              {errorPlan ? (
                <Text style={estilos.textoErrorCampo}>{errorPlan}</Text>
              ) : null}

              {/* Lista desplegable de planes creados */}
              {listaPlanesAbierta ? (
                <View style={estilos.listaPlanesDesplegada}>
                  {planesDisponibles.length === 0 ? (
                    <Text style={estilos.textoSinPlanes}>
                      No hay planes creados aún. Creá uno en la sección Planes.
                    </Text>
                  ) : (
                    planesDisponibles.map((plan) => {
                      const estaSeleccionado =
                        planSeleccionado?.id === plan.id &&
                        planSeleccionado?.nombre === plan.nombre;
                      return (
                        <Pressable
                          key={plan.id}
                          onPress={() => seleccionarPlan(plan)}
                          style={[
                            estilos.itemPlanLista,
                            estaSeleccionado && estilos.itemPlanSeleccionado,
                          ]}
                        >
                          <View style={estilos.infoItemPlan}>
                            <Text style={estilos.nombreItemPlan}>
                              {plan.nombre}
                            </Text>
                            <Text style={estilos.subItemPlan}>
                              {plan.tipo || 'Mensual'} ·{' '}
                              {plan.diasDisponibles || 0} días ·{' '}
                              {plan.estado || 'Activo'}
                            </Text>
                          </View>
                          <Text style={estilos.montoItemPlan}>
                            {formatearMonto(plan.monto)}
                          </Text>
                        </Pressable>
                      );
                    })
                  )}
                </View>
              ) : null}

              {/* Método de pago: Transferencia o Efectivo */}
              <View style={estilos.grupoCampo}>
                <Text style={estilos.etiqueta}>MÉTODO DE PAGO</Text>
                <View style={estilos.filaOpciones}>
                  {METODOS_PAGO.map((metodo) => {
                    const activo = metodoPago === metodo;
                    return (
                      <Pressable
                        key={metodo}
                        onPress={() => {
                          setMetodoPago(metodo);
                          setErrorMetodo('');
                          setErrorGeneral('');
                        }}
                        disabled={guardando}
                        style={[
                          estilos.opcionMetodo,
                          activo && estilos.opcionMetodoActiva,
                        ]}
                      >
                        <Text
                          style={[
                            estilos.textoOpcionMetodo,
                            activo && estilos.textoOpcionMetodoActiva,
                          ]}
                        >
                          {metodo}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {errorMetodo ? (
                  <Text style={estilos.textoErrorCampo}>{errorMetodo}</Text>
                ) : null}
              </View>

              <View style={estilos.contenedorBotonesModal}>
                <Pressable
                  style={({ pressed }) => [
                    estilos.botonGuardar,
                    pressed && !guardando && estilos.botonPresionado,
                    guardando && estilos.botonDeshabilitado,
                  ]}
                  onPress={guardarCuota}
                  disabled={guardando}
                >
                  {guardando ? (
                    <ActivityIndicator size="small" color={COLORES.blanco} />
                  ) : (
                    <Text style={estilos.textoBotonBlanco}>
                      {cuotaEditando ? 'GUARDAR CAMBIOS' : 'REGISTRAR CUOTA'}
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
  tarjetaCuota: {
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
  filaCabeceraCuota: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  idCuotaBadge: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 13.5,
    color: COLORES.maderaOscura,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: COLORES.amarilloDorado,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  montoCuota: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 18,
    color: COLORES.naranja,
  },
  datoCuotaPrincipal: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORES.negro,
    marginTop: 2,
  },
  datoCuotaSecundario: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: COLORES.maderaOscura,
    marginTop: 2,
  },
  fechaCuota: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#52525B',
    marginTop: 4,
  },
  separadorTarjeta: {
    height: 1,
    backgroundColor: COLORES.grisMedio,
    marginVertical: 12,
  },
  filaPieCuota: {
    flexDirection: 'row',
    gap: 10,
  },
  botonDetalleCuota: {
    flex: 1,
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
  textoDetalleCuota: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12.5,
    color: COLORES.naranja,
  },
  botonEditarCuota: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORES.maderaOscura,
    backgroundColor: COLORES.blanco,
  },
  textoEditarCuota: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12.5,
    color: COLORES.maderaOscura,
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
    marginBottom: 11,
    paddingBottom: 9,
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
  filaPlanYMonto: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  columnaPlan: {
    flex: 1.25,
  },
  columnaMonto: {
    flex: 0.9,
  },
  selectorPlanBoton: {
    minHeight: 46,
    backgroundColor: COLORES.blanco,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORES.grisMedio,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  textoPlanSeleccionado: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: COLORES.negro,
  },
  textoPlaceholderPlan: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#6E706D',
  },
  cajaMontoAuto: {
    minHeight: 46,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORES.naranja,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  textoMontoAuto: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 14,
    color: COLORES.naranja,
  },
  listaPlanesDesplegada: {
    marginTop: 6,
    marginBottom: 12,
    maxHeight: 165,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORES.amarilloDorado,
    backgroundColor: COLORES.blanco,
    padding: 6,
  },
  textoSinPlanes: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12.5,
    color: COLORES.maderaOscura,
    padding: 8,
    textAlign: 'center',
  },
  itemPlanLista: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: '#FAFAFA',
  },
  itemPlanSeleccionado: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: COLORES.naranja,
  },
  infoItemPlan: {
    flex: 1,
    paddingRight: 8,
  },
  nombreItemPlan: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: COLORES.negro,
  },
  subItemPlan: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11.5,
    color: COLORES.maderaOscura,
  },
  montoItemPlan: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13,
    color: COLORES.naranja,
  },
  filaOpciones: {
    flexDirection: 'row',
    gap: 10,
  },
  opcionMetodo: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORES.grisMedio,
    backgroundColor: COLORES.blanco,
    justifyContent: 'center',
    alignItems: 'center',
  },
  opcionMetodoActiva: {
    borderColor: COLORES.naranja,
    backgroundColor: '#FFF7ED',
  },
  textoOpcionMetodo: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13.5,
    color: COLORES.maderaOscura,
  },
  textoOpcionMetodoActiva: {
    color: COLORES.naranja,
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