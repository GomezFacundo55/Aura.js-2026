import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { TouchableOpacity, View, Text, Image, ActivityIndicator } from "react-native";
import { getMyProfile, signOut, type UserProfile } from "@/lib/auth";
import { useToast } from "../../contextJ/Toast";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { SoundService } from "@/servicesJ/soundService";
import QrScannerModal from "@/components/ui/QRScanner";
import { crearUnaEspera, consultarEstadoEspera, consultarClienteEnListaDeEspera } from "@/servicesJ/listaDeEsperaService";
import { ConfirmModal } from "@/components/modal";

export default function HomeScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { showToast } = useToast();
  const router = useRouter();
  const [cargando, setCargando] = useState<boolean>(true);
  const [qrEscaneado, setQrEscaneado] = useState<boolean>(false);
  const [scannerVisible, setScannerVisible] = useState<boolean>(false);
  const [enListaDeEspera, setEnListaDeEspera] = useState<boolean>(false);
  const [esperaId, setEsperaId] = useState<string | null>(null);
  const [mostrarModal, setMostrarModal] = useState<boolean>(false);
  const [enEspera, setEnEspera] = useState<boolean>(false);
  const QR_INGRESO = "INGRESO_LOCAL";

  useEffect(() => {
    cargaDatosIniciales()
  }, []);

  const cargaDatosIniciales = async () => {
    try {
      const perfil = await getMyProfile();
      if(!perfil){
        router.replace("/log-in");
        return;
      }

      setProfile(perfil);

      if (perfil?.id) {
        const { exito, datos } = await consultarClienteEnListaDeEspera(perfil.id);

        if (exito && datos) {
          setQrEscaneado(true);
          setEnListaDeEspera(true);
          setEsperaId(datos.id);
        }
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error", "No se pudo cargar la información inicial");
    } finally {
      setCargando(false);
    }
  }

  const onScanPress = () => {
    setScannerVisible(true);
  };

  const onEncuestasPress = () => {
    //aun hay que hacer lo de las encuestas. esto es un recordatorio......
    if (!qrEscaneado) return;
  };

  const onListaEsperaPress = async () => {
    if (!qrEscaneado || profile === null) return;
    const { exito, datos, error } = await crearUnaEspera(profile.id);
    if (error || !datos) {
      showToast(
        "error",
        "Error al unirse a la lista de espera",
        error || "No se pudo registrar",
      );
      SoundService.reproducir("error");
    } else {
      console.log(datos);
      setEnListaDeEspera(true);
      setEsperaId(datos.id);
      SoundService.reproducir("exito");
      showToast("success", "¡Listo!", "Usted se añadio a la lista de espera.");
    }
  };

  const checkAprobacionListaEspera = async () => {
    if (!esperaId) {
      showToast("error", "Error", "No se encontró un turno activo.");
      return;
    }
    const { exito, datos, error } = await consultarEstadoEspera(esperaId);

    if (error || !datos) {
      await SoundService.reproducir("error");
      showToast("error", "Error", "No se pudo verificar el turno.");
      return;
    }

    if (datos.estado === "asignado" && datos.mesa_asignada_id) {
      await SoundService.reproducir("exito");
      showToast("success", "¡Mesa asignada!", "Accediendo a tu mesa...");

      router.push({
        pathname: "/mesa-home",
        params: { mesaId: datos.mesa_asignada_id, cliente_id: profile?.id },
      });
    } else {
      await SoundService.reproducir("error");
      showToast(
        "info",
        "Aguarde",
        "Aún no se le ha asignado una mesa. Por favor espere.",
      );
    }
  };

  const handleQrScanned = async (data: string) => {
    setScannerVisible(false);
    try {
      let esValido = false;

      try {
        const parsed = JSON.parse(data);
        if (parsed.tipo === QR_INGRESO) {
          esValido = true;
        }
      } catch {
        if (data.trim().toUpperCase() === QR_INGRESO) {
          esValido = true;
        }
      }

      if (esValido) {
        setQrEscaneado(true);
        await SoundService.reproducir("exito");
        showToast(
          "success",
          "¡Bienvenido!",
          "Ingreso al local validado correctamente.",
        );
      } else {
        await SoundService.reproducir("error");
        showToast(
          "error",
          "Código inválido",
          "El QR escaneado no es el de ingreso al local.",
        );
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
    } else {
      if (profile !== null) {
        router.replace("/log-in");
      }
    }
  };

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-transparent">
      <QrScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanned={handleQrScanned}
        title="Ingreso al Local"
      />

      <View className="flex-row items-center p-2">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={ () => { setMostrarModal(true) } }
          className="w-9 h-9 rounded-xl bg-red-500 items-center justify-center mr-3 shadow-sm"
        >
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-neutral-900">
          Bienvenido a Foodly
        </Text>
      </View>

      <View className="flex-1 p-5">
        <View className="bg-[#FFF4E6] rounded-3xl p-2 items-center mb-4 shadow-sm border border-white/60">
          <View className="relative">
            <Image
              source={{ uri: profile?.foto_url || "https://placehold.co/150" }}
              className="w-24 h-24 rounded-full border-4 border-white"
              resizeMode="cover"
            />
            <View className="absolute bottom-1 right-1 w-6 h-6 bg-orange-500 rounded-full border-2 border-white items-center justify-center">
              <Ionicons name="checkmark" size={14} color="#FFF" />
            </View>
          </View>

          <Text className="text-xl font-black text-[#1E2342] mt-3">
            ¡Hola, {profile?.nombres}!
          </Text>
        </View>

        <View className="bg-[#FFF4E6] rounded-3xl p-6 mb-4 items-center border border-white/60 shadow-sm">
          <View className="w-12 h-12 bg-white/80 rounded-2xl items-center justify-center mb-3">
            <Ionicons
              name={qrEscaneado ? "restaurant-outline" : "qr-code-outline"}
              size={28}
              color="#FF6B00"
            />
          </View>

          <Text className="text-lg font-black text-[#1E2342] text-center mb-2">
            {qrEscaneado
              ? "Opciones del local habilitadas"
              : "Escaneá el código QR del local"}
          </Text>

          <Text className="text-xs text-[#7A6C5E] text-center leading-5 px-2 mb-4">
            {qrEscaneado
              ? enListaDeEspera
                ? "Ya estás en la lista. El metre te notificará cuando tu mesa esté lista."
                : "Confirmaste tu ingreso al salón. Podés elegir una opción:"
              : "Al ingresar al local, escaneá el QR ubicado en la entrada para activar las opciones de atención."}
          </Text>

          <View className="w-full h-[1px] bg-[#F0DFC8] my-1" />

          <View className="w-full mt-3 space-y-2.5">
            <TouchableOpacity
              activeOpacity={qrEscaneado ? 0.7 : 1}
              onPress={onEncuestasPress}
              disabled={!qrEscaneado}
              className={`flex-row items-center p-3 rounded-2xl border ${
                qrEscaneado
                  ? "bg-white border-orange-200 shadow-sm"
                  : "bg-white/40 border-transparent opacity-50"
              }`}
            >
              <View className="w-9 h-9 rounded-xl bg-orange-100 items-center justify-center mr-3">
                <MaterialCommunityIcons
                  name="clipboard-text-outline"
                  size={20}
                  color="#FF6B00"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-[#1E2342]">
                  Visualizar encuestas
                </Text>
                <Text className="text-[11px] text-[#8A7B6D]">
                  Respondé y accedé a beneficios exclusivos
                </Text>
              </View>
              {qrEscaneado && (
                <Ionicons name="chevron-forward" size={18} color="#FF6B00" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={qrEscaneado && !enListaDeEspera ? 0.7 : 1}
              onPress={onListaEsperaPress}
              disabled={!qrEscaneado || enListaDeEspera}
              className={`flex-row items-center p-3 rounded-2xl border ${
                enListaDeEspera
                  ? "bg-amber-50 border-amber-200 opacity-90 shadow-sm"
                  : qrEscaneado
                    ? "bg-white border-orange-200 shadow-sm"
                    : "bg-white/40 border-transparent opacity-50"
              }`}
            >
              <View
                className={`w-9 h-9 rounded-xl items-center justify-center mr-3 ${enListaDeEspera ? "bg-amber-200" : "bg-orange-100"}`}
              >
                <MaterialCommunityIcons
                  name={
                    enListaDeEspera
                      ? "clock-check-outline"
                      : "account-clock-outline"
                  }
                  size={20}
                  color={enListaDeEspera ? "#B45309" : "#FF6B00"}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-[#1E2342]">
                  {enListaDeEspera
                    ? "En espera de asignación"
                    : "Lista de espera"}
                </Text>
                <Text className="text-[11px] text-[#8A7B6D]">
                  {enListaDeEspera
                    ? "Anotado. Esperando al metre"
                    : "Anotate para que te asignen una mesa"}
                </Text>
              </View>
              {qrEscaneado && !enListaDeEspera && (
                <Ionicons name="chevron-forward" size={18} color="#FF6B00" />
              )}
              {enListaDeEspera && (
                <Ionicons name="checkmark-circle" size={18} color="#cc6414" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {enListaDeEspera ? (
          <View className="bg-[#FFF4E6] rounded-3xl p-4 flex-row items-center justify-between border border-amber-300 shadow-sm">
            <View className="flex-row items-center pl-1 flex-1 mr-2">
              <View>
                <Text className="text-[10px] font-bold tracking-widest text-[#B45309] uppercase">
                  Turno solicitado
                </Text>
                <Text className="text-sm font-black text-[#1E2342]">
                  Acceder a mesas
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={checkAprobacionListaEspera}
              activeOpacity={0.8}
              className="bg-brand-500 px-4 py-2.5 rounded-2xl flex-row items-center"
            >
              <Ionicons
                name="list-circle-outline"
                size={16}
                color="white"
                style={{ marginRight: 4 }}
              />
              <Text className="text-white font-bold text-xs">Ir a mesas</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="bg-[#FFF4E6] rounded-3xl p-4 flex-row items-center justify-between border border-white/60 shadow-sm">
            <View className="pl-2">
              <Text className="text-[10px] font-bold tracking-widest text-[#9E8B79] uppercase">
                Ingreso al local
              </Text>
              <Text className="text-base font-black text-[#1E2342]">
                {qrEscaneado ? "Ingreso validado" : "Cámara lista"}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onScanPress}
              activeOpacity={0.85}
              disabled={qrEscaneado}
              className={`px-6 py-3.5 rounded-2xl flex-row items-center shadow-md ${
                qrEscaneado
                  ? "bg-brand-600 shadow-brand-600/30 opacity-90"
                  : "bg-[#FF6B00] shadow-orange-500/40"
              }`}
            >
              <Ionicons
                name={qrEscaneado ? "checkmark-circle" : "camera"}
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text className="text-white font-bold text-base">
                {qrEscaneado ? "Escaneado" : "Escanear QR"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <ConfirmModal
      visible={mostrarModal}
      title="Confirmar acción."
      message="¿Desea salir?"
      confirmText="Si"
      cancelText="No"
      action={false}
      onConfirm={logOut}
      onCancel={() => {
        setMostrarModal(false);
    }}
  />
    </View>
  );
}