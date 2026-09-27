import LogoSpinner from "@/components/ui/LogoSpinner";
import QrScannerModal from "@/components/ui/QRScanner";
import type { Cuenta, ItemCuenta, MetodoPago } from "@/interfaces/ICuenta";
import { getMyProfile } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  aplicarPropina,
  formatearPesos,
  interpretarQrPropina,
  METODOS_PAGO,
  NIVELES_PROPINA,
  pagarCuenta,
  solicitarCuenta,
} from "@/servicesJ/cuentaService";
import { SoundService } from "@/servicesJ/soundService";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToast } from "../../contextJ/Toast";

const METODO_ICONOS: Record<MetodoPago, keyof typeof MaterialCommunityIcons.glyphMap> = {
  dinero_en_cuenta: "wallet-outline",
  tarjeta_debito: "credit-card-outline",
  tarjeta_credito: "credit-card-multiple-outline",
};

export default function CuentaScreen() {
  const { mesaId } = useLocalSearchParams<{ mesaId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [cuenta, setCuenta] = useState<Cuenta | null>(null);
  const [items, setItems] = useState<ItemCuenta[]>([]);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [aplicandoPropina, setAplicandoPropina] = useState(false);
  const [metodo, setMetodo] = useState<MetodoPago | null>(null);
  const [procesandoPago, setProcesandoPago] = useState(false);

  const volverAlInicio = () => router.replace("/(app)/home");

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);

    const perfil = await getMyProfile();
    if (!perfil || !mesaId) {
      setErrorCarga("No pudimos identificar tu mesa.");
      setCargando(false);
      return;
    }

    const { exito, datos, error } = await solicitarCuenta(
      perfil.id,
      `${perfil.nombres} ${perfil.apellidos ?? ""}`.trim(),
      mesaId,
    );

    if (!exito || !datos) {
      setErrorCarga(error ?? "No se pudo generar la cuenta.");
      await SoundService.reproducir("error");
    } else {
      setCuenta(datos.cuenta);
      setItems(datos.items);
      if (datos.cuenta.metodo_pago) setMetodo(datos.cuenta.metodo_pago);
      if (datos.nueva) {
        await SoundService.reproducir("exito");
        showToast("success", "Cuenta solicitada", "Le avisamos al mozo que pediste la cuenta.");
      }
    }
    setCargando(false);
  }, [mesaId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!cuenta?.id) return;
    const topic = `cuenta_cliente_${cuenta.id}`;
    const existente = supabase.getChannels().find((c) => c.topic === `realtime:${topic}`);
    if (existente) supabase.removeChannel(existente);

    const canal = supabase
      .channel(topic)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "cuentas", filter: `id=eq.${cuenta.id}` },
        (payload) => {
          const nueva = payload.new as Cuenta;
          setCuenta((prev) =>
            prev
              ? {
                  ...prev,
                  ...nueva,
                  total: nueva.total == null ? null : Number(nueva.total),
                  propina_monto: nueva.propina_monto == null ? null : Number(nueva.propina_monto),
                }
              : prev,
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [cuenta?.id]);

  const onQrPropina = async (data: string) => {
    setScannerVisible(false);
    if (!cuenta) return;

    const nivel = interpretarQrPropina(data);
    if (!nivel) {
      await SoundService.reproducir("error");
      showToast("error", "Código inválido", "Ese QR no es uno de los códigos de propina.");
      return;
    }

    setAplicandoPropina(true);
    const { exito, datos, error } = await aplicarPropina(cuenta, nivel);
    setAplicandoPropina(false);

    if (!exito || !datos) {
      await SoundService.reproducir("error");
      showToast("error", "Error", error ?? "No se pudo registrar la propina.");
      return;
    }

    setCuenta(datos);
    await SoundService.reproducir("exito");
    showToast(
      "success",
      `Propina: ${NIVELES_PROPINA[nivel].etiqueta}`,
      `Se agregó un ${NIVELES_PROPINA[nivel].porcentaje}% a tu cuenta.`,
    );
  };

  const onPagar = async () => {
    if (!cuenta || procesandoPago) return;
    if (!metodo) {
      await SoundService.reproducir("error");
      showToast("error", "Elegí un medio de pago", "Seleccioná cómo querés pagar.");
      return;
    }

    setProcesandoPago(true);
    await new Promise((r) => setTimeout(r, 2200));
    const { exito, datos, error } = await pagarCuenta(cuenta, metodo);
    setProcesandoPago(false);

    if (!exito || !datos) {
      await SoundService.reproducir("error");
      showToast("error", "No se pudo pagar", error ?? "Intentá nuevamente.");
      return;
    }

    setCuenta(datos);
    await SoundService.reproducir("exito");
    showToast("success", "¡Pago realizado!", "Esperá la confirmación del mozo.");
  };

  if (cargando) {
    return (
      <View className="flex-1 items-center justify-center bg-transparent">
        <LogoSpinner mensaje="Preparando tu cuenta..." />
      </View>
    );
  }

  if (errorCarga || !cuenta) {
    return (
      <View
        className="flex-1 bg-transparent px-5"
        style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <View className="flex-1 bg-[#FFF4E6] rounded-3xl p-6 border border-white/60 shadow-sm justify-between">
          <View className="flex-1 items-center justify-center">
            <View className="w-28 h-28 rounded-3xl bg-orange-100 items-center justify-center mb-5">
              <Ionicons name="alert-circle-outline" size={70} color="#FF6B00" />
            </View>
            <Text className="text-3xl font-black text-[#1E2342] text-center mb-3">
              No pudimos generar tu cuenta
            </Text>
            <Text className="text-lg font-semibold text-[#8A7B6D] text-center">{errorCarga}</Text>
          </View>
          <TouchableOpacity
            onPress={volverAlInicio}
            activeOpacity={0.85}
            className="w-full py-3.5 rounded-2xl items-center justify-center shadow-md bg-[#FF6B00] shadow-orange-500/40"
          >
            <Text className="text-white font-bold text-xl">Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const propinaElegida = cuenta.propina_porcentaje != null && cuenta.propina_nivel != null;

  const encabezado = (
    <View className="flex-row items-center justify-between mb-2">
      <TouchableOpacity
        onPress={volverAlInicio}
        activeOpacity={0.7}
        className="w-11 h-11 rounded-xl bg-white border border-orange-200 items-center justify-center shadow-sm"
      >
        <Ionicons name="arrow-back" size={24} color="#FF6B00" />
      </TouchableOpacity>
      <Text className="text-2xl font-black text-[#1E2342]">Mesa {cuenta.mesa_numero}</Text>
      <View className="w-11 h-11" />
    </View>
  );

  if (cuenta.estado === "solicitada" && !propinaElegida) {
    return (
      <View
        className="flex-1 bg-transparent px-5"
        style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <QrScannerModal
          visible={scannerVisible}
          onClose={() => setScannerVisible(false)}
          onScanned={onQrPropina}
          title="QR de propina"
        />

        {encabezado}

        <View className="flex-1 bg-[#FFF4E6] rounded-3xl p-6 border border-white/60 shadow-sm justify-between">
          <View className="items-center">
            <View className="w-20 h-20 bg-white/80 rounded-2xl items-center justify-center mb-2">
              <MaterialCommunityIcons name="qrcode-scan" size={48} color="#FF6B00" />
            </View>
            <Text className="text-2xl font-black text-[#1E2342] text-center">
              ¿Cómo te atendimos?
            </Text>
            <Text className="text-base font-semibold text-[#8A7B6D] text-center mt-1">
              Escaneá el QR de propina según tu nivel de satisfacción para generar la cuenta.
            </Text>
            <View className="w-full h-[3px] bg-[#F0DFC8] my-3" />
          </View>

          <View className="w-full">
            {(Object.keys(NIVELES_PROPINA) as (keyof typeof NIVELES_PROPINA)[]).map((nivel) => (
              <View
                key={nivel}
                className="flex-row items-center justify-between p-3 mb-2 rounded-2xl bg-white border border-orange-200 shadow-sm"
              >
                <Text className="text-xl font-bold text-[#1E2342]">
                  {NIVELES_PROPINA[nivel].etiqueta}
                </Text>
                <Text className="text-xl font-black text-[#FF6B00]">
                  {NIVELES_PROPINA[nivel].porcentaje}%
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => setScannerVisible(true)}
            disabled={aplicandoPropina}
            activeOpacity={0.85}
            className="w-full py-3.5 mt-2 rounded-2xl flex-row items-center justify-center shadow-md bg-[#FF6B00] shadow-orange-500/40"
          >
            <Ionicons name="camera" size={30} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text className="text-white font-bold text-xl">Escanear QR de propina</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={aplicandoPropina} transparent animationType="fade">
          <View className="flex-1 bg-black/50 items-center justify-center">
            <View className="bg-[#FFF4E6] rounded-3xl p-8">
              <LogoSpinner mensaje="Aplicando propina..." />
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  if (cuenta.estado === "pagada" || cuenta.estado === "confirmada") {
    const confirmada = cuenta.estado === "confirmada";
    return (
      <View
        className="flex-1 bg-transparent px-5"
        style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <View className="flex-1 bg-[#FFF4E6] rounded-3xl p-6 border border-white/60 shadow-sm justify-between">
          <View className="flex-1 items-center justify-center">
            <View
              className={`w-28 h-28 rounded-full items-center justify-center mb-4 ${
                confirmada ? "bg-emerald-200" : "bg-orange-100"
              }`}
            >
              <Ionicons
                name={confirmada ? "checkmark-done" : "checkmark"}
                size={70}
                color={confirmada ? "#059669" : "#FF6B00"}
              />
            </View>
            <Text className="text-3xl font-black text-[#1E2342] text-center">
              {confirmada ? "¡Pago confirmado!" : "¡Listo! Pagaste"}
            </Text>
            <Text className="text-5xl font-black text-[#FF6B00] text-center mt-2">
              {formatearPesos(cuenta.total)}
            </Text>
            <Text className="text-lg font-semibold text-[#8A7B6D] text-center mt-2">
              {confirmada
                ? `La mesa ${cuenta.mesa_numero} quedó libre. ¡Gracias por tu visita!`
                : `Mesa ${cuenta.mesa_numero} · ${cuenta.metodo_pago ? METODOS_PAGO[cuenta.metodo_pago] : ""}`}
            </Text>
          </View>

          {confirmada ? (
            <TouchableOpacity
              onPress={volverAlInicio}
              activeOpacity={0.85}
              className="w-full py-3.5 rounded-2xl items-center justify-center shadow-md bg-[#FF6B00] shadow-orange-500/40"
            >
              <Text className="text-white font-bold text-xl">Volver al inicio</Text>
            </TouchableOpacity>
          ) : (
            <View className="w-full p-4 rounded-2xl border bg-amber-100 border-amber-300 items-center">
              <LogoSpinner tamaño={60} />
              <Text className="text-xl font-black text-amber-900 text-center mt-3">
                Esperando la confirmación del mozo
              </Text>
              <Text className="text-[15px] font-semibold text-amber-700 text-center mt-1">
                Te avisamos apenas confirme el pago.
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-transparent"
      style={{ paddingTop: Math.max(insets.top, 16) }}
    >
      <QrScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanned={onQrPropina}
        title="QR de propina"
      />

      <View className="px-5">
        {encabezado}
        <View className="bg-[#FF6B00] rounded-3xl p-4 items-center shadow-md shadow-orange-500/40 mb-2">
          <Text className="text-lg font-semibold text-white">Total a pagar</Text>
          <Text className="text-5xl font-black text-white mt-1">{formatearPesos(cuenta.total)}</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-[#FFF4E6] rounded-3xl p-5 mb-2 border border-white/60 shadow-sm">
          <Text className="text-xl font-black text-[#1E2342] mb-1">Detalle de tu consumo</Text>

          {items.map((item, idx) => (
            <View
              key={item.id ?? `${item.nombre_producto}-${idx}`}
              className="flex-row items-center justify-between py-2 border-b border-[#F0DFC8]"
            >
              <View className="flex-1 pr-3">
                <Text className="text-lg font-bold text-[#1E2342]">
                  {item.cantidad} x {item.nombre_producto}
                </Text>
                <Text className="text-base font-semibold text-[#8A7B6D]">
                  {formatearPesos(item.precio_unitario)} c/u
                </Text>
              </View>
              <Text className="text-lg font-bold text-[#1E2342]">
                {formatearPesos(item.precio_unitario * item.cantidad)}
              </Text>
            </View>
          ))}

          <View className="flex-row justify-between mt-3">
            <Text className="text-lg font-semibold text-[#8A7B6D]">Subtotal</Text>
            <Text className="text-lg font-bold text-[#1E2342]">{formatearPesos(cuenta.subtotal)}</Text>
          </View>

          <View className="flex-row justify-between mt-2">
            <Text className="text-lg font-semibold text-[#8A7B6D] flex-1 pr-2">
              {cuenta.descuento_porcentaje > 0
                ? `Descuento por juegos (${cuenta.descuento_porcentaje}%)`
                : "Descuento por juegos"}
            </Text>
            <Text
              className={`text-lg font-bold ${cuenta.descuento_porcentaje > 0 ? "text-emerald-700" : "text-[#8A7B6D]"}`}
            >
              {cuenta.descuento_porcentaje > 0
                ? `- ${formatearPesos(cuenta.descuento_monto)}`
                : "Sin descuento"}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mt-2">
            <View className="flex-1 pr-2">
              <Text className="text-lg font-semibold text-[#8A7B6D]">
                Propina · {NIVELES_PROPINA[cuenta.propina_nivel!].etiqueta} ({cuenta.propina_porcentaje}%)
              </Text>
              <TouchableOpacity onPress={() => setScannerVisible(true)} activeOpacity={0.7}>
                <Text className="text-base font-bold text-[#FF6B00]">Cambiar (escanear otro QR)</Text>
              </TouchableOpacity>
            </View>
            <Text className="text-lg font-bold text-[#1E2342]">
              + {formatearPesos(cuenta.propina_monto)}
            </Text>
          </View>

          <View className="w-full h-[3px] bg-[#F0DFC8] my-3" />

          <View className="flex-row justify-between items-center">
            <Text className="text-2xl font-black text-[#1E2342]">TOTAL</Text>
            <Text className="text-3xl font-black text-[#FF6B00]">{formatearPesos(cuenta.total)}</Text>
          </View>
        </View>

        <View className="bg-[#FFF4E6] rounded-3xl p-5 border border-white/60 shadow-sm flex-1">
          <Text className="text-xl font-black text-[#1E2342] mb-2">¿Cómo querés pagar?</Text>
          {(Object.keys(METODOS_PAGO) as MetodoPago[]).map((m) => {
            const activo = metodo === m;
            return (
              <TouchableOpacity
                key={m}
                activeOpacity={0.7}
                onPress={() => setMetodo(m)}
                className={`flex-row items-center p-3 mb-2 rounded-2xl border shadow-sm ${
                  activo ? "bg-brand-100 border-[#FF6B00]" : "bg-white border-orange-200"
                }`}
              >
                <View className="w-12 h-12 rounded-xl bg-orange-100 items-center justify-center mr-3">
                  <MaterialCommunityIcons name={METODO_ICONOS[m]} size={28} color="#FF6B00" />
                </View>
                <Text className="flex-1 text-lg font-bold text-[#1E2342]">{METODOS_PAGO[m]}</Text>
                <Ionicons
                  name={activo ? "radio-button-on" : "radio-button-off"}
                  size={26}
                  color={activo ? "#FF6B00" : "#8A7B6D"}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View className="px-5 pt-2" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <TouchableOpacity
          onPress={onPagar}
          disabled={procesandoPago}
          activeOpacity={0.85}
          className={`w-full py-3.5 rounded-2xl flex-row items-center justify-center shadow-md shadow-orange-500/40 ${
            metodo ? "bg-[#FF6B00]" : "bg-orange-300"
          }`}
        >
          <MaterialCommunityIcons name="cash-check" size={28} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text className="text-white font-bold text-xl">Pagar {formatearPesos(cuenta.total)}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={procesandoPago || aplicandoPropina} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center">
          <View className="bg-[#FFF4E6] rounded-3xl p-8">
            <LogoSpinner mensaje={procesandoPago ? "Procesando el pago..." : "Aplicando propina..."} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
