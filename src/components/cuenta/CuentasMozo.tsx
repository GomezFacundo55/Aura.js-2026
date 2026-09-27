import { ConfirmModal } from "@/components/modal";
import LogoSpinner from "@/components/ui/LogoSpinner";
import type { Cuenta } from "@/interfaces/ICuenta";
import { supabase } from "@/lib/supabase";
import {
  confirmarPagoYLiberarMesa,
  formatearFechaHora,
  formatearPesos,
  METODOS_PAGO,
  NIVELES_PROPINA,
  obtenerCuentasAbiertas,
} from "@/servicesJ/cuentaService";
import { SoundService } from "@/servicesJ/soundService";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useToast } from "../../contextJ/Toast";

type Props = { mozoId: string };

export default function CuentasMozo({ mozoId }: Props) {
  const { showToast } = useToast();
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [aConfirmar, setAConfirmar] = useState<Cuenta | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  const cargar = useCallback(async (mostrarSpinner = true) => {
    if (mostrarSpinner) setCargando(true);
    const { exito, datos, error } = await obtenerCuentasAbiertas();
    if (exito && datos) {
      setCuentas(datos);
    } else {
      await SoundService.reproducir("error");
      showToast("error", "Error", error ?? "No se pudieron cargar las cuentas.");
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();

    const topic = "cuentas-mozo-listado";
    const existente = supabase.getChannels().find((c) => c.topic === `realtime:${topic}`);
    if (existente) supabase.removeChannel(existente);

    const canal = supabase
      .channel(topic)
      .on("postgres_changes", { event: "*", schema: "public", table: "cuentas" }, () => {
        cargar(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [cargar]);

  const onConfirmarPago = async () => {
    if (!aConfirmar) return;
    const cuenta = aConfirmar;
    setAConfirmar(null);
    setConfirmando(true);

    const { exito, error } = await confirmarPagoYLiberarMesa(cuenta, mozoId);
    setConfirmando(false);

    if (!exito) {
      await SoundService.reproducir("error");
      showToast("error", "No se pudo confirmar", error ?? "Intentá nuevamente.");
      return;
    }

    await SoundService.reproducir("exito");
    showToast("success", "Pago confirmado", `La mesa ${cuenta.mesa_numero} quedó libre.`);
    await cargar(false);
  };

  if (cargando || confirmando) {
    return (
      <View className="flex-1 items-center justify-center">
        <LogoSpinner mensaje={confirmando ? "Confirmando pago..." : "Cargando cuentas..."} />
      </View>
    );
  }

  return (
    <>
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ flexGrow: 1 }}>
        {cuentas.length === 0 ? (
          <View className="flex-1 mb-4 items-center justify-center bg-white rounded-2xl border border-orange-200 mt-2 p-6">
            <MaterialCommunityIcons name="receipt" size={72} color="#FF6B00" />
            <Text className="text-xl font-bold text-[#1E2342] mt-3 text-center">
              No hay cuentas pendientes.
            </Text>
            <Text className="text-base font-semibold text-[#8A7B6D] mt-1 text-center">
              Cuando un cliente pida la cuenta te va a llegar una notificación.
            </Text>
          </View>
        ) : (
          cuentas.map((cuenta) => {
            const pagada = cuenta.estado === "pagada";
            return (
              <View
                key={cuenta.id}
                className={`rounded-2xl p-4 mb-4 border-2 shadow-sm ${
                  pagada ? "bg-emerald-50 border-emerald-400" : "bg-orange-100 border-orange-200"
                }`}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="table-chair" size={26} color="#1E2342" />
                    <Text className="text-2xl font-black text-[#1E2342] ml-2">
                      Mesa {cuenta.mesa_numero}
                    </Text>
                  </View>
                  <View
                    className={`px-3 py-1 rounded-full ${pagada ? "bg-emerald-500" : "bg-amber-400"}`}
                  >
                    <Text className="text-sm font-bold text-white">
                      {pagada ? "PAGADA" : "CUENTA PEDIDA"}
                    </Text>
                  </View>
                </View>

                <Text className="text-base font-semibold text-[#5A6275]">
                  {cuenta.cliente_nombre ?? "Cliente"} · {formatearFechaHora(pagada ? cuenta.pagada_at : cuenta.created_at)}
                </Text>

                <View className="h-px bg-orange-200 my-3" />

                <View className="flex-row justify-between">
                  <Text className="text-base font-semibold text-[#5A6275]">Subtotal</Text>
                  <Text className="text-base font-bold text-[#1E2342]">{formatearPesos(cuenta.subtotal)}</Text>
                </View>
                {cuenta.descuento_porcentaje > 0 && (
                  <View className="flex-row justify-between mt-1">
                    <Text className="text-base font-semibold text-[#5A6275]">
                      Descuento juegos ({cuenta.descuento_porcentaje}%)
                    </Text>
                    <Text className="text-base font-bold text-emerald-700">
                      - {formatearPesos(cuenta.descuento_monto)}
                    </Text>
                  </View>
                )}
                <View className="flex-row justify-between mt-1">
                  <Text className="text-base font-semibold text-[#5A6275]">Propina</Text>
                  <Text className="text-base font-bold text-[#1E2342]">
                    {cuenta.propina_nivel
                      ? `${NIVELES_PROPINA[cuenta.propina_nivel].etiqueta} (${cuenta.propina_porcentaje}%) + ${formatearPesos(cuenta.propina_monto)}`
                      : "Sin elegir todavía"}
                  </Text>
                </View>

                <View className="flex-row justify-between items-center mt-3">
                  <Text className="text-xl font-black text-[#1E2342]">TOTAL</Text>
                  <Text className="text-2xl font-black text-[#1E2342]">
                    {cuenta.total != null ? formatearPesos(cuenta.total) : "-"}
                  </Text>
                </View>

                {pagada ? (
                  <>
                    <Text className="text-base font-semibold text-emerald-800 mt-1">
                      Pagó con {cuenta.metodo_pago ? METODOS_PAGO[cuenta.metodo_pago] : "-"}
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => setAConfirmar(cuenta)}
                      className="mt-3 bg-emerald-600 py-4 rounded-xl flex-row items-center justify-center"
                    >
                      <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                      <Text className="text-white text-lg font-bold ml-2">
                        Confirmar pago y liberar mesa
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View className="mt-3 flex-row items-center justify-center bg-amber-100 py-3 rounded-xl">
                    <Ionicons name="hourglass-outline" size={20} color="#B45309" />
                    <Text className="text-base font-bold text-amber-800 ml-2">
                      Esperando el pago del cliente
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <ConfirmModal
        visible={!!aConfirmar}
        title="Confirmar pago"
        message={
          aConfirmar
            ? `¿Confirmás que la mesa ${aConfirmar.mesa_numero} pagó ${formatearPesos(aConfirmar.total)}? La mesa va a quedar libre.`
            : ""
        }
        confirmText="Confirmar"
        cancelText="Cancelar"
        onConfirm={onConfirmarPago}
        onCancel={() => setAConfirmar(null)}
      />
    </>
  );
}
