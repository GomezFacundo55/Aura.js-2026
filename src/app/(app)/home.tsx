import { ConfirmModal } from "@/components/modal";
import QrScannerModal from "@/components/ui/QRScanner";
import { useMesaActual } from "@/hooks/useMesaActual";
import { usePedidoActivo } from "@/hooks/usePedidoActivo";
import type { Cuenta } from "@/interfaces/ICuenta";
import { getMyProfile, signOut, type UserProfile } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  consultarMesaPorQr,
  formatearPesos,
  obtenerUltimaCuentaCliente,
} from "@/servicesJ/cuentaService";
import {
  consultarClienteEnListaDeEspera,
  crearUnaEspera,
  vincularClienteAMesa,
} from "@/servicesJ/listaDeEsperaService";
import { confirmarRecepcion } from "@/servicesJ/pedidoService";
import { SoundService } from "@/servicesJ/soundService";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToast } from "../../contextJ/Toast";

type ScanMode = "ingreso" | "mesa";

// ─── Configuración visual del botón de estado dinámico ────────────────────────
type EstadoBoton =
  | "sin_pedido"
  | "confirmado"
  | "en_preparacion"
  | "listo"
  | "rechazado"
  | "entregado";

type McIcon = ComponentProps<typeof MaterialCommunityIcons>["name"];
type IoIcon = ComponentProps<typeof Ionicons>["name"];

const BOTON_ESTADO: Record<
  EstadoBoton,
  {
    label: (numeroMesa?: number | string) => string;
    subtitle: string;
    container: string;
    iconBox: string;
    icon: McIcon;
    iconColor: string;
    labelColor: string;
    subtitleColor: string;
    trailing?: { name: IoIcon; color: string };
  }
> = {
  sin_pedido: {
    label: (n) => `Mesa ${n} - asignada`,
    subtitle: "Elegí tu plato o consultá al mozo",
    container: "bg-brand-400 border-amber-200 opacity-90",
    iconBox: "bg-black",
    icon: "table-chair",
    iconColor: "#FFFFFF",
    labelColor: "text-[#1E2342]",
    subtitleColor: "text-black",
  },
  // 1. El mozo confirmó el pedido
  confirmado: {
    label: () => "Pedido confirmado por el mozo",
    subtitle: "Ya lo enviamos a cocina y barra",
    container: "bg-sky-100 border-sky-300",
    iconBox: "bg-sky-200",
    icon: "clipboard-check-outline",
    iconColor: "#0369A1",
    labelColor: "text-sky-900",
    subtitleColor: "text-sky-700",
  },
  // 2. Cocina / barra preparando
  en_preparacion: {
    label: () => "Tu pedido está en preparación",
    subtitle: "En breve te lo van a traer",
    container: "bg-amber-100 border-amber-300",
    iconBox: "bg-amber-200",
    icon: "chef-hat",
    iconColor: "#B45309",
    labelColor: "text-amber-900",
    subtitleColor: "text-amber-700",
  },
  // 3. Listo: el cartel se vuelve botón
  listo: {
    label: () => "Confirmar recepción",
    subtitle: "Tocá para confirmar",
    container: "bg-emerald-500 border-emerald-600",
    iconBox: "bg-emerald-600",
    icon: "bell-ring-outline",
    iconColor: "#FFFFFF",
    labelColor: "text-white",
    subtitleColor: "text-emerald-100",
    trailing: { name: "chevron-forward", color: "#FFFFFF" },
  },
  // 4. Rechazado: también es tocable, lleva al menú
  rechazado: {
    label: () => "Pedido rechazado",
    subtitle: "Tocá para hacer un pedido nuevo",
    container: "bg-red-100 border-red-300",
    iconBox: "bg-red-200",
    icon: "close-circle-outline",
    iconColor: "#DC2626",
    labelColor: "text-red-900",
    subtitleColor: "text-red-700",
    trailing: { name: "chevron-forward", color: "#DC2626" },
  },
  entregado: {
    label: () => "Pedido recibido",
    subtitle: "¡Gracias! Ya podés pedir la cuenta",
    container: "bg-emerald-100 border-emerald-300",
    iconBox: "bg-emerald-200",
    icon: "check-decagram",
    iconColor: "#059669",
    labelColor: "text-[#1E2342]",
    subtitleColor: "text-black",
    trailing: { name: "checkmark-circle", color: "#059669" },
  },
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { showToast } = useToast();
  const router = useRouter();
  const [cargando, setCargando] = useState<boolean>(true);

  const [qrEscaneado, setQrEscaneado] = useState<boolean>(false);
  const [scannerVisible, setScannerVisible] = useState<boolean>(false);
  const [scanMode, setScanMode] = useState<ScanMode>("ingreso");

  const [enListaDeEspera, setEnListaDeEspera] = useState<boolean>(false);
  const [esperaId, setEsperaId] = useState<string | null>(null);
  const [mesaHabilitada, setMesaHabilitada] = useState<boolean>(false);
  const [mostrarModal, setMostrarModal] = useState<boolean>(false);

  const { mesa, tieneMesa, mesaVinculada, refetch } = useMesaActual(
    profile?.id,
  );
  const refetchMesaRef = useRef(refetch);
  refetchMesaRef.current = refetch;

  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  const [cuentaActual, setCuentaActual] = useState<Cuenta | null>(null);
  const keyCuentaCerrada = (cuentaId: string) => `cuenta_cerrada_${cuentaId}`;
  const { pedido: pedidoActivo, refetch: refetchPedido } = usePedidoActivo(
    mesa?.id,
    profile?.id, // filtra por cliente para no heredar pedidos de otros
  );

  // Ref para que el canal realtime (deps []) no use una función vieja
  const refetchPedidoRef = useRef(refetchPedido);
  refetchPedidoRef.current = refetchPedido;

  // pedidoEntregado no viene del hook (la query excluye ese estado para evitar
  // que futuros clientes en la misma mesa lo hereden). Se rastrea localmente.
  const [pedidoConfirmadoLocal, setPedidoConfirmadoLocal] = useState(false);

  // El rechazo también se rastrea localmente: la query puede excluir "rechazado"
  // para que el cliente pueda hacer un pedido nuevo.
  const [pedidoRechazado, setPedidoRechazado] = useState(false);

  const estadoPedido = pedidoActivo?.estado;
  const mozoConfirmoPedido =
    estadoPedido === "confirmado" ||
    estadoPedido === "en_preparacion" ||
    estadoPedido === "listo";
  const pedidoListo = estadoPedido === "listo";
  const pedidoEntregado = pedidoConfirmadoLocal;
  const esClienteRegistrado = profile?.perfil === "cliente_registrado";
  const puedeJugar = (mozoConfirmoPedido || pedidoEntregado) && esClienteRegistrado;
  const [confirmandoRecepcion, setConfirmandoRecepcion] = useState(false);

  // Key de AsyncStorage para persistir la confirmación entre reinicios de la app
  const keyPedidoConfirmado = (cId: string, mId: string) => `pedido_confirmado_${cId}_${mId}`;

  const keyIngreso = (clienteId: string) => `ingreso_${clienteId}`;

  const QR_INGRESO = "INGRESO_LOCAL";

  const paso: "ingreso" | "espera" | "escanear_mesa" | "vinculado" =
    !qrEscaneado
      ? "ingreso"
      : !tieneMesa
        ? "espera"
        : !mesaVinculada
          ? "escanear_mesa"
          : "vinculado";

  const esCasoA = paso === "ingreso";
  const esCasoB = paso === "espera";

  useFocusEffect(
    useCallback(() => {
      let canalEspera: any = null;
      let canalPedido: any = null;
      let canalCuenta: any = null;

      const inicializarPantalla = async () => {
        await cargaDatosIniciales();

        const perfilActual = await getMyProfile();
        if (!perfilActual?.id) return;

        const nombreCanal = `espera-cliente-${perfilActual.id}`;

        const canalExistente = supabase
          .getChannels()
          .find((c) => c.topic === `realtime:${nombreCanal}`);

        if (canalExistente) {
          supabase.removeChannel(canalExistente);
        }

        canalEspera = supabase
          .channel(nombreCanal)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "lista_espera",
              filter: `cliente_id=eq.${perfilActual.id}`,
            },
            async (payload) => {
              const registroActualizado = payload.new as any;

              if (
                registroActualizado.estado === "asignado" &&
                registroActualizado.mesa_asignada_id
              ) {
                setMesaHabilitada(true);
                await SoundService.reproducir("exito");
                showToastRef.current(
                  "success",
                  "¡Mesa asignada!",
                  "El metre te asignó una mesa. Ya podés ingresar.",
                );
                await refetchMesaRef.current();
              }
            },
          )
          .subscribe();
        const nombreCanalCuenta = `cuenta-cliente-home-${perfilActual.id}`;
        const canalCuentaExistente = supabase
          .getChannels()
          .find((c) => c.topic === `realtime:${nombreCanalCuenta}`);
        if (canalCuentaExistente) {
          supabase.removeChannel(canalCuentaExistente);
        }

        canalCuenta = supabase
          .channel(nombreCanalCuenta)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "cuentas",
              filter: `cliente_id=eq.${perfilActual.id}`,
            },
            async (payload) => {
              const cuenta = payload.new as Cuenta;
              if (!cuenta?.id) return;
              if (cuenta.estado === "confirmada") {
                await refetchMesaRef.current();
                await cargaDatosIniciales();
              } else {
                setCuentaActual(cuenta);
              }
            },
          )
          .subscribe();

        const nombreCanalPedido = `pedido-cliente-${perfilActual.id}`;
        const canalPedidoExistente = supabase
          .getChannels()
          .find((c) => c.topic === `realtime:${nombreCanalPedido}`);

        if (canalPedidoExistente) {
          supabase.removeChannel(canalPedidoExistente);
        }

        canalPedido = supabase
          .channel(nombreCanalPedido)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "pedidos",
              filter: `cliente_id=eq.${perfilActual.id}`,
            },
            async (payload) => {
              const pedidoActualizado = payload.new as any;

              // Clave: refrescar el estado que consume el botón
              await refetchPedidoRef.current();

              switch (pedidoActualizado.estado) {
                case "rechazado":
                  setPedidoRechazado(true);
                  await SoundService.reproducir("error");
                  showToastRef.current(
                    "error",
                    "¡Pedido rechazado!",
                    "El mozo no ha aceptado tu pedido.",
                  );
                  break;
                case "confirmado":
                  await SoundService.reproducir("exito");
                  showToastRef.current(
                    "success",
                    "¡Pedido confirmado!",
                    "El mozo ha aceptado tu pedido.",
                  );
                  break;
                case "en_preparacion":
                  await SoundService.reproducir("exito");
                  showToastRef.current(
                    "success",
                    "¡Pedido en preparación!",
                    "Tus productos estarán en cualquier momento.",
                  );
                  break;
                case "listo":
                  await SoundService.reproducir("exito");
                  showToastRef.current(
                    "success",
                    "¡Pedido listo!",
                    "Confirmá la recepción cuando te lo entreguen.",
                  );
                  break;
              }
            },
          )
          .subscribe();

        // Sincroniza el pedido al volver a la pantalla (ej: desde el menú)
        refetchPedidoRef.current();
      };

      inicializarPantalla();

      return () => {
        if (canalEspera) {
          supabase.removeChannel(canalEspera);
        }
        if (canalPedido) {
          supabase.removeChannel(canalPedido);
        }
        if (canalCuenta) {
          supabase.removeChannel(canalCuenta);
        }
      };
    }, []),
  );

  useEffect(() => {
    if (tieneMesa && !qrEscaneado) {
      setQrEscaneado(true);
    }
  }, [tieneMesa, qrEscaneado]);

  // Limpiar los flags locales cuando el cliente pierde la mesa (nueva sesión)
  useEffect(() => {
    if (!mesa?.id) {
      setPedidoConfirmadoLocal(false);
      setPedidoRechazado(false);
    }
  }, [mesa?.id]);

  // Sincronizar pedidoRechazado con el estado que llega de la query.
  // - Si el pedido activo viene como "rechazado" (ej: re-login) → activar el flag.
  // - Si llega un pedido nuevo con otro estado → limpiar el flag.
  useEffect(() => {
    if (!pedidoActivo?.id) return;
    if (pedidoActivo.estado === "rechazado") {
      setPedidoRechazado(true);
    } else {
      setPedidoRechazado(false);
    }
  }, [pedidoActivo?.id, pedidoActivo?.estado]);

  // Leer si el cliente ya confirmó la recepción en esta mesa (persiste entre reinicios)
  useEffect(() => {
    if (!profile?.id || !mesa?.id) return;
    AsyncStorage.getItem(keyPedidoConfirmado(profile.id, mesa.id)).then((val) => {
      if (val === "1") setPedidoConfirmadoLocal(true);
    });
  }, [profile?.id, mesa?.id]);

  const cargaDatosIniciales = async () => {
    try {
      const perfil = await getMyProfile();
      if (!perfil) {
        router.replace("/log-in");
        return;
      }
      setProfile(perfil);

      if (perfil?.id) {
        await verificarCierreDeCuenta(perfil.id);

        const [{ exito, datos }, ingresoGuardado] = await Promise.all([
          consultarClienteEnListaDeEspera(perfil.id),
          AsyncStorage.getItem(keyIngreso(perfil.id)),
        ]);

        if (exito && datos) {
          if (datos.estado === "asignado" || datos.estado === "vinculado") {
            setMesaHabilitada(true);
          }
          setQrEscaneado(true);
          setEnListaDeEspera(true);
          setEsperaId(datos.id);
        } else if (ingresoGuardado !== null) {
          setQrEscaneado(true);
        }
      }
    } catch (err) {
      console.error(err);
      showToastRef.current("error", "Error", "No se pudo cargar la información inicial");
    } finally {
      setCargando(false);
    }
  };

  const verificarCierreDeCuenta = async (clienteId: string) => {
    const { exito, datos: ultima } = await obtenerUltimaCuentaCliente(clienteId);
    if (!exito) return;

    if (ultima?.estado === "confirmada") {
      const yaProcesada = await AsyncStorage.getItem(keyCuentaCerrada(ultima.id));
      if (!yaProcesada) {
        await AsyncStorage.multiRemove([
          keyIngreso(clienteId),
          keyPedidoConfirmado(clienteId, ultima.mesa_id),
        ]);
        await AsyncStorage.setItem(keyCuentaCerrada(ultima.id), "1");
        setQrEscaneado(false);
        setEnListaDeEspera(false);
        setEsperaId(null);
        setMesaHabilitada(false);
        setPedidoConfirmadoLocal(false);
        setPedidoRechazado(false);
      }
      setCuentaActual(null);
    } else {
      setCuentaActual(ultima ?? null);
    }
  };

  const onPedirCuentaPress = () => {
    if (!mesa?.id) return;
    router.push({ pathname: "/cuenta", params: { mesaId: mesa.id } });
  };

  const onScanPress = () => {
    setScanMode(paso === "escanear_mesa" ? "mesa" : "ingreso");
    setScannerVisible(true);
  };

  // Encuestas completas (con posibilidad de responder) — sólo post-entrega
  const onEncuestasPress = () => {
    if (!pedidoEntregado) return;
    router.push({
      pathname: "/encuestas",
      params: {
        mesaId: mesa?.id,
        esperaId: esperaId ?? undefined,
      },
    });
  };

  // Solo estadísticas — disponible desde que el cliente ingresó al local
  const onVerEstadisticasPress = () => {
    router.push({
      pathname: "/encuestas",
      params: {
        soloGraficos: "1",
      },
    });
  };

  const onConfirmarRecepcion = async () => {
    if (!pedidoActivo || !mozoConfirmoPedido || confirmandoRecepcion) return;
    setConfirmandoRecepcion(true);
    const { exito, error } = await confirmarRecepcion(pedidoActivo.id);
    setConfirmandoRecepcion(false);
    if (!exito) {
      showToast("error", "Error", error || "No se pudo confirmar la recepción.");
      SoundService.reproducir("error");
      return;
    }
    // Persistir localmente para mostrar el estado final incluso tras refresh
    if (profile?.id && mesa?.id) {
      await AsyncStorage.setItem(keyPedidoConfirmado(profile.id, mesa.id), "1");
    }
    setPedidoConfirmadoLocal(true);
    await refetchPedido();
    SoundService.reproducir("exito");
    showToast("success", "¡Pedido confirmado!", "Ya podés pedir la cuenta o dejar tu opinión.");
  };

  const onListaEsperaPress = async () => {
    if (!qrEscaneado || profile === null || mesaHabilitada === true) return;
    const { exito, datos, error } = await crearUnaEspera(
      profile.id,
      `${profile.nombres} ${profile.apellidos}`,
    );
    if (error || !datos) {
      showToast(
        "error",
        "Error al unirse a la lista de espera",
        error || "No se pudo registrar",
      );
      SoundService.reproducir("error");
    } else {
      setEnListaDeEspera(true);
      setEsperaId(datos.id);
      SoundService.reproducir("exito");
      showToast("success", "¡Listo!", "Usted se añadió a la lista de espera.");
    }
  };

  const handleIngresoQr = async (data: string) => {
    let esValido = false;
    try {
      const parsed = JSON.parse(data);
      if (parsed.tipo === QR_INGRESO) esValido = true;
    } catch {
      if (data.trim().toUpperCase() === QR_INGRESO) esValido = true;
    }

    if (esValido) {
      setQrEscaneado(true);
      if (profile) {
        await AsyncStorage.setItem(keyIngreso(profile.id), "1");
      }
      await SoundService.reproducir("exito");
      showToast(
        "success",
        "¡Bienvenido!",
        "Ingreso al local validado correctamente.",
      );
    } else {
      const { exito, datos } = await consultarMesaPorQr(data);
      if (exito && datos) {
        if (datos.disponibilidad === "vacia") {
          await SoundService.reproducir("info");
          showToast(
            "info",
            `Mesa ${datos.numero} libre`,
            "Para ocuparla primero escaneá el QR de ingreso y anotate en la lista de espera.",
          );
        } else {
          await SoundService.reproducir("error");
          showToast(
            "error",
            `Mesa ${datos.numero} ocupada`,
            "Esta mesa no está disponible en este momento.",
          );
        }
        return;
      }
      await SoundService.reproducir("error");
      showToast(
        "error",
        "Código inválido",
        "El QR escaneado no es el de ingreso al local.",
      );
    }
  };

  const handleMesaQr = async (data: string) => {
    if (!mesa || !profile) return;

    let mesaIdEscaneada: string | null = null;
    try {
      const parsed = JSON.parse(data);
      mesaIdEscaneada = parsed.mesaId ?? parsed.id ?? null;
    } catch {
      mesaIdEscaneada = data.trim();
    }

    if (mesaIdEscaneada !== mesa.id) {
      await SoundService.reproducir("error");
      showToast(
        "error",
        "Mesa incorrecta",
        "Este QR no corresponde a tu mesa asignada.",
      );
      return;
    }

    const { exito, error } = await vincularClienteAMesa(profile.id, mesa.id);
    if (!exito) {
      await SoundService.reproducir("error");
      showToast(
        "error",
        "Error",
        error || "No se pudo vincular la mesa. Reintentá.",
      );
      return;
    }

    // Limpiar el flag de confirmación de recepción para esta mesa,
    // por si el cliente ya la había usado antes y confirmó un pedido previo.
    // Sin esto, AsyncStorage devuelve "1" y muestra "Pedido recibido" de inmediato.
    await AsyncStorage.removeItem(keyPedidoConfirmado(profile.id, mesa.id));
    setPedidoConfirmadoLocal(false);
    setPedidoRechazado(false);

    await refetch();
    await SoundService.reproducir("exito");
    showToast(
      "success",
      "¡Mesa vinculada!",
      "Ya podés ver el menú y consultar al mozo.",
    );
  };

  const handleQrScanned = async (data: string) => {
    setScannerVisible(false);
    try {
      if (scanMode === "ingreso") {
        await handleIngresoQr(data);
      } else {
        await handleMesaQr(data);
      }
    } catch (e) {
      showToast("error", "Error", "Ocurrió un error al procesar el código.");
    }
  };

  const logOut = async () => {
    const { error } = await signOut();
    if (error) {
      await SoundService.reproducir("error");
      showToast("error", "Error", "Error al cerrar sesión");
    } else if (profile !== null) {
      router.replace("/log-in");
    }
  };

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  // ─── Estado del botón dinámico de mesa/pedido ───────────────────────────────
  const estadoBoton: EstadoBoton = pedidoEntregado
    ? "entregado"
    : pedidoRechazado || estadoPedido === "rechazado"
      ? "rechazado"
      : estadoPedido === "listo"
        ? "listo"
        : estadoPedido === "en_preparacion"
          ? "en_preparacion"
          : estadoPedido === "confirmado"
            ? "confirmado"
            : "sin_pedido";

  const cfg = BOTON_ESTADO[estadoBoton];

  // Es presionable cuando el pedido está listo (confirmar) o fue rechazado (ir al menú)
  const isMesaBtnPressable =
    (estadoBoton === "listo" || estadoBoton === "rechazado") &&
    !confirmandoRecepcion;

  const onBotonEstadoPress = () => {
    if (estadoBoton === "listo") {
      onConfirmarRecepcion();
    } else if (estadoBoton === "rechazado") {
      setPedidoRechazado(false);
      router.push({ pathname: "/menu", params: { mesaId: mesa?.id } });
    }
  };

  return (
    <View className="flex-1 bg-transparent">
      <QrScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanned={handleQrScanned}
        title={
          scanMode === "ingreso"
            ? "Ingreso al Local"
            : "Escaneá el QR de tu mesa"
        }
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16),
        }}
      >
        <View className="flex-1 px-5">
          <View className="bg-[#FFF4E6] rounded-3xl p-4 items-center mb-2 shadow-sm border border-white/60 relative">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setMostrarModal(true)}
              className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-red-500 items-center justify-center shadow-sm z-10"
            >
              <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View className="flex-row items-end -ml-10">
              <View className="relative mt-1">
                <Image
                  source={{
                    uri: profile?.foto_url || "https://placehold.co/150",
                  }}
                  className="w-20 h-20 rounded-full border-4 border-white"
                  resizeMode="cover"
                />
                <View className="absolute bottom-1 right-1 w-6 h-6 bg-orange-500 rounded-full border-2 border-white items-center justify-center">
                  <Ionicons name="checkmark" size={14} color="#FFF" />
                </View>
              </View>
              <Text className="text-[22px] font-black text-[#1E2342] mb-3 ml-2">
                ¡Hola, {profile?.nombres}!
              </Text>
            </View>
          </View>

          {/* ── Bloque pre-vinculación: lista de espera (sin encuestas) ────────── */}
          {qrEscaneado && !mesaVinculada && (
            <View
              className={`bg-[#FFF4E6] rounded-3xl p-6 border border-white/60 shadow-sm ${esCasoB ? "flex-1 justify-between mb-2" : "mb-4"
                }`}
            >
              <View className="w-full items-center">
                <View className="w-17 h-17 bg-white/80 rounded-2xl items-center justify-center mb-2">
                  <Ionicons
                    name="restaurant-outline"
                    size={40}
                    color="#FF6B00"
                  />
                </View>
                <Text className="text-2xl font-black text-[#1E2342] text-center mb-1">
                  Opciones del local habilitadas
                </Text>
                <View className="w-full h-[3px] bg-[#F0DFC8] my-2" />

                <View className="w-full mt-1 space-y-2.5">
                  {/* Botón lista de espera / mesa asignada */}
                  <TouchableOpacity
                    onPress={onListaEsperaPress}
                    disabled={enListaDeEspera || mesaHabilitada || tieneMesa}
                    className={`flex-row items-center p-3 rounded-2xl border ${mesaHabilitada || tieneMesa
                      ? "bg-brand-400 border-amber-200 opacity-90 shadow-sm"
                      : enListaDeEspera
                        ? "bg-brand-100 border-amber-200 opacity-90 shadow-sm"
                        : "bg-white border-orange-200 shadow-sm"
                      }`}
                  >
                    <View
                      className={`w-15 h-15 rounded-xl items-center justify-center mr-3 overflow-hidden ${tieneMesa
                        ? "bg-black"
                        : enListaDeEspera
                          ? "bg-orange-300"
                          : "bg-orange-100"
                        }`}
                    >
                      <MaterialCommunityIcons
                        name={
                          tieneMesa
                            ? "table-chair"
                            : enListaDeEspera
                              ? "clock-check-outline"
                              : "account-clock-outline"
                        }
                        size={30}
                        color={
                          tieneMesa
                            ? "#FFFFFF"
                            : enListaDeEspera
                              ? "#B45309"
                              : "#FF6B00"
                        }
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xl font-bold text-[#1E2342]">
                        {tieneMesa
                          ? `Mesa ${mesa?.numero} - asignada`
                          : enListaDeEspera
                            ? "En espera de asignación"
                            : "Lista de espera"}
                      </Text>
                      <Text
                        className={`text-[13px] font-semibold ${tieneMesa ? "text-white" : "text-[#8A7B6D]"}`}
                      >
                        {tieneMesa
                          ? "Escaneá el QR de tu mesa"
                          : enListaDeEspera
                            ? "Anotado. Esperando al metre"
                            : "Clickeá para anotarte"}
                      </Text>
                    </View>
                    {!enListaDeEspera && !tieneMesa && (
                      <Ionicons
                        name="chevron-forward"
                        size={25}
                        color="#FF6B00"
                      />
                    )}
                    {(enListaDeEspera || tieneMesa) && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={tieneMesa ? "#FFFFFF" : "#cc6414"}
                      />
                    )}
                  </TouchableOpacity>

                  {/* ── Ver estadísticas de encuestas (siempre visible tras escanear QR) ── */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={onVerEstadisticasPress}
                    className="flex-row items-center mt-1 p-3 rounded-2xl border bg-white border-orange-200 shadow-sm"
                  >
                    <View className="w-15 h-15 rounded-xl bg-orange-100 items-center justify-center mr-3">
                      <MaterialCommunityIcons
                        name="chart-box-outline"
                        size={30}
                        color="#FF6B00"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xl font-bold text-[#1E2342]">
                        Ver encuestas
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#FF6B00" />
                  </TouchableOpacity>
                </View>
              </View>

              {esCasoB && (
                <View
                  className={`w-full mt-2 p-4 rounded-2xl border items-center ${enListaDeEspera
                    ? "bg-brand-100 border-amber-200"
                    : "bg-[#ffff] border-orange-200"
                    }`}
                >
                  <View
                    className={`w-14 h-14 mb-2 rounded-2xl items-center justify-center ${enListaDeEspera ? "bg-orange-300" : "bg-orange-100"
                      }`}
                  >
                    <Ionicons
                      name={
                        enListaDeEspera
                          ? "hourglass-outline"
                          : "information-circle-outline"
                      }
                      size={30}
                      color={enListaDeEspera ? "#B45309" : "#FF6B00"}
                    />
                  </View>
                  <Text className="text-[25px] font-black text-[#1E2342] text-center mb-5">
                    {enListaDeEspera
                      ? "Estás en la lista de espera"
                      : "Siguiente paso:\n solicitar mesa"}
                  </Text>
                  <Text className="text-[15px] font-semibold text-[#8A7B6D] text-center leading-4">
                    {enListaDeEspera
                      ? "El metre te asignará una mesa disponible en breve. Podés mirar las encuestas mientras esperás."
                      : "Tocá en 'Lista de espera' para registrar tu turno y que el local pueda asignarte una mesa."}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ── Pantalla QR (ingreso o escanear mesa) ──────────────────────────── */}
          {(paso === "ingreso" || paso === "escanear_mesa") && (
            <View className="bg-[#FFF4E6] rounded-3xl p-6 flex-1 items-center justify-between border border-white/60 shadow-sm mb-5">
              <View className="w-full items-center">
                <Text className="text-[25px] font-bold tracking-widest text-[#9E8B79] uppercase text-center -mb-5">
                  {paso === "ingreso" ? "Ingreso al local" : "Tu mesa asignada"}
                </Text>
                <Text className="text-4xl font-black text-[#1E2342] text-center mt-10">
                  {paso === "ingreso" ? "Cámara lista" : `Mesa ${mesa?.numero}`}
                </Text>
              </View>

              {paso === "ingreso" && (
                <View className="items-center my-auto py-4">
                  <View className="w-30 h-30 rounded-3xl bg-white/90 items-center justify-center border border-orange-200 shadow-sm mb-3">
                    <Ionicons
                      name="qr-code-outline"
                      size={60}
                      color="#FF6B00"
                    />
                  </View>
                  <Text className="text-xl font-semibold text-[#8A7B6D] text-center max-w-[260px] leading-4">
                    Escaneá el código QR en la entrada del local para acceder a las opciones de espera y encuestas.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={onScanPress}
                activeOpacity={0.85}
                className="w-full py-3.5 rounded-2xl flex-row items-center justify-center shadow-md bg-[#FF6B00] shadow-orange-500/40"
              >
                <Ionicons
                  name="camera"
                  size={30}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-white font-bold text-xl">
                  {paso === "ingreso"
                    ? "Escanear QR de ingreso"
                    : "Escanear QR de la mesa"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Bloque VINCULADO: Mesa confirmada ──────────────────────────────── */}
          {mesaVinculada && (
            <View className="bg-[#FFF4E6] rounded-3xl p-6 mb-2 items-center border border-white/60 shadow-sm flex-1 justify-between">
              <View className="w-full items-center">
                <View className="flex-1 items-center justify-center gap-2 flex-wrap">

                  {mesa?.tipo && (
                    <View
                      className={`flex-row items-center px-2.5 py-1 rounded-full ${mesa.tipo === "vip"
                        ? "bg-amber-100 border border-amber-300"
                        : mesa.tipo === "movilidad_reducida"
                          ? "bg-violet-100 border border-violet-300"
                          : "bg-sky-100 border border-sky-300"
                        }`}
                    >
                      <MaterialCommunityIcons
                        name={
                          mesa.tipo === "vip"
                            ? "crown-outline"
                            : mesa.tipo === "movilidad_reducida"
                              ? "wheelchair-accessibility"
                              : "table-furniture"
                        }
                        size={20}
                        color={
                          mesa.tipo === "vip"
                            ? "#B45309"
                            : mesa.tipo === "movilidad_reducida"
                              ? "#7C3AED"
                              : "#0369A1"
                        }
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        className={`text-lg font-bold ${mesa.tipo === "vip"
                          ? "text-amber-700"
                          : mesa.tipo === "movilidad_reducida"
                            ? "text-violet-700"
                            : "text-sky-700"
                          }`}
                      >
                        {mesa.tipo === "vip"
                          ? "VIP"
                          : mesa.tipo === "movilidad_reducida"
                            ? "Movilidad reducida"
                            : "Estándar"}
                      </Text>
                    </View>
                  )}
                  <Text className="text-3xl font-black text-[#1E2342] text-center">
                    Mesa {mesa?.numero}
                  </Text>
                </View>
                <View className="w-full h-[2px] bg-[#F0DFC8] my-3" />
              </View>
              <View className="w-full space-y-2.5 my-auto">

                {/* ── Botón de estado dinámico (mesa/pedido) ── */}
                <TouchableOpacity
                  activeOpacity={isMesaBtnPressable ? 0.75 : 1}
                  onPress={isMesaBtnPressable ? onBotonEstadoPress : undefined}
                  disabled={!isMesaBtnPressable}
                  className={`flex-row h-40 items-center p-3 -mt-5 mb-5 rounded-2xl border shadow-sm ${cfg.container}`}
                >
                  <View
                    className={`w-15 h-15 rounded-xl items-center justify-center mr-3 ${cfg.iconBox}`}
                  >
                    {confirmandoRecepcion ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <MaterialCommunityIcons
                        name={cfg.icon}
                        size={35}
                        color={cfg.iconColor}
                      />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className={`text-2xl font-bold ${cfg.labelColor}`}>
                      {cfg.label(mesa?.numero)}
                    </Text>
                    <Text
                      className={`text-[15px] font-semibold ${cfg.subtitleColor}`}
                    >
                      {cfg.subtitle}
                    </Text>
                  </View>
                  {cfg.trailing && (
                    <Ionicons
                      name={cfg.trailing.name}
                      size={20}
                      color={cfg.trailing.color}
                    />
                  )}
                </TouchableOpacity>

                {/* ── Ver encuestas (oculto mientras el pedido esté en curso y después de que el cliente confirme recepción) ── */}
                {!mozoConfirmoPedido && !pedidoEntregado && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={onVerEstadisticasPress}
                    className="flex-row items-center mb-2 p-3 rounded-2xl border bg-white border-orange-200 shadow-sm"
                  >
                    <View className="w-15 h-15 rounded-xl bg-orange-100 items-center justify-center mr-3">
                      <MaterialCommunityIcons
                        name="chart-box-outline"
                        size={40}
                        color="#FF6B00"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-2xl font-bold text-[#1E2342]">
                        Ver encuestas
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#FF6B00" />
                  </TouchableOpacity>
                )}

                {/* ── Ver menú (oculto cuando el pedido fue confirmado por el cliente) ── */}
                {!pedidoEntregado && (
                  <>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() =>
                        router.push({
                          pathname: "/menu",
                          params: { mesaId: mesa?.id },
                        })
                      }
                      className="flex-row items-center h-25 p-3 mb-1 rounded-2xl border bg-white border-orange-200 shadow-sm"
                    >
                      <View className="w-15 h-15 rounded-xl bg-orange-100 items-center justify-center mr-3">
                        <MaterialCommunityIcons
                          name="silverware-fork-knife"
                          size={40}
                          color="#FF6B00"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-2xl font-bold text-[#1E2342]">
                          Ver menú
                        </Text>
                        <Text className="text-base text-[#8A7B6D]">
                          Comidas y bebidas
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#FF6B00" />
                    </TouchableOpacity>

                    <View className="w-full h-[2px] bg-[#F0DFC8] my-3" />
                  </>
                )}

                {/* ── Chateá con el mozo ── */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({
                      pathname: "/chat",
                      params: { mesaId: mesa?.id },
                    })
                  }
                  className="flex-row items-center p-3 rounded-2xl border bg-white border-orange-200 shadow-sm"
                >
                  <View className="w-10 h-10 rounded-xl bg-orange-100 items-center justify-center mr-3">
                    <MaterialCommunityIcons
                      name="chat-outline"
                      size={30}
                      color="#FF6B00"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xl font-bold text-[#1E2342]">
                      Chateá con el mozo
                    </Text>
                    <Text className="text-base text-[#8A7B6D]">
                      Consultas en vivo
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#FF6B00" />
                </TouchableOpacity>

                {/* ── Juegos (visibles sólo cuando el mozo confirmó el pedido) ── */}
                {puedeJugar && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      router.push({
                        pathname: "/juegos",
                        params: { mesaId: mesa?.id },
                      })
                    }
                    className="flex-row items-center p-3 mt-1 rounded-2xl border bg-white border-orange-200 shadow-sm"
                  >
                    <View className="w-10 h-10 rounded-xl bg-orange-100 items-center justify-center mr-3">
                      <MaterialCommunityIcons
                        name="gamepad-variant-outline"
                        size={30}
                        color="#FF6B00"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xl font-bold text-[#1E2342]">
                        Juegos y descuentos
                      </Text>
                      <Text className="text-[13px] text-[#8A7B6D]">
                        Ganá hasta 20% de descuento
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#FF6B00" />
                  </TouchableOpacity>
                )}

                {/* ── Ver encuestas (sólo cuando el cliente confirmó recepción) ── */}
                {pedidoEntregado && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={onEncuestasPress}
                    className="flex-row items-center p-3 mt-1 rounded-2xl border bg-white border-orange-200 shadow-sm"
                  >
                    <View className="w-10 h-10 rounded-xl bg-orange-100 items-center justify-center mr-3">
                      <MaterialCommunityIcons
                        name="clipboard-text-outline"
                        size={30}
                        color="#FF6B00"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xl font-bold text-[#1E2342]">
                        Ver encuestas
                      </Text>
                      <Text className="text-[14px] text-[#8A7B6D]">
                        Dejá tu opinión
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#FF6B00" />
                  </TouchableOpacity>
                )}

                {/* ── Pedir la cuenta (sólo cuando el cliente confirmó recepción) ── */}
                {pedidoEntregado && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={onPedirCuentaPress}
                    className="flex-row items-center p-3 mt-1 rounded-2xl border bg-white border-orange-200 shadow-sm"
                  >
                    <View className="w-10 h-10 rounded-xl bg-orange-100 items-center justify-center mr-3">
                      <MaterialCommunityIcons
                        name="receipt"
                        size={30}
                        color="#FF6B00"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xl font-bold text-[#1E2342]">
                        {!cuentaActual
                          ? "Pedir la cuenta"
                          : cuentaActual.estado === "pagada"
                            ? "Pago en revisión"
                            : cuentaActual.propina_porcentaje == null
                              ? "Ver mi cuenta"
                              : "Pagar la cuenta"}
                      </Text>
                      <Text className="text-[14px] text-[#8A7B6D]">
                        {!cuentaActual
                          ? "Solicitá el resumen de tu consumo"
                          : cuentaActual.estado === "pagada"
                            ? "Esperando la confirmación del mozo"
                            : cuentaActual.propina_porcentaje == null
                              ? "Falta escanear el QR de propina"
                              : `Total: ${formatearPesos(cuentaActual.total)}`}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#FF6B00" />
                  </TouchableOpacity>
                )}

              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <ConfirmModal
        visible={mostrarModal}
        title="Confirmar acción."
        message="¿Desea salir?"
        confirmText="Si"
        cancelText="No"
        action={false}
        onConfirm={logOut}
        onCancel={() => setMostrarModal(false)}
      />
    </View>
  );
}
