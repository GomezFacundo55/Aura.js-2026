import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Mesa, MesaTipo, MesaDisponibilidad } from "@/types/database";
import { actualizarEspera } from "@/servicesJ/listaDeEsperaService";
import { mesasServicio } from "@/lib/mesasServicio";
import { useToast } from "@/contextJ/Toast";
import { useLocalSearchParams } from "expo-router";


export default function AsignarMesaScreen() {
  const { showToast } = useToast();
  
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const { id, estado } = useLocalSearchParams<{ id: string, estado: string }>();

  const [paginaActual, setPaginaActual] = useState<number>(1);
  const elementosPorPagina = 4;
  const totalPaginas = Math.ceil(mesas.length / elementosPorPagina) || 1;
  const indiceInicio = (paginaActual - 1) * elementosPorPagina;
  const elementosPaginados = mesas.slice(
    indiceInicio,
    indiceInicio + elementosPorPagina
  );
  useEffect(()=>{
    cargarMesas();
  }, []);

  const cargarMesas = async () => {
    try {
      setCargando(true);
      const datosMesas = await mesasServicio.listar();
      setMesas(datosMesas);
    } catch (error) {
      showToast("error", "Error", "No se pudo cargar la lista de mesas")
    } finally {
      setCargando(false);
    }
  };

  const formatearTipo = (tipo: MesaTipo) => {
    switch (tipo) {
      case "vip":
        return "VIP";
      case "estandar":
        return "Estándar";
      case "movilidad_reducida":
        return "Movilidad Reducida";
      default:
        return tipo;
    }
  };

  const obtenerConfigDisponibilidad = (disp: MesaDisponibilidad) => {
    switch (disp) {
      case "vacia":
        return {
          texto: "Vacía",
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          textCol: "text-emerald-700",
          dotCol: "bg-emerald-500",
          icon: "checkmark-circle" as const,
        };
      case "reservada":
        return {
          texto: "Reservada",
          bg: "bg-amber-50",
          border: "border-amber-200",
          textCol: "text-amber-700",
          dotCol: "bg-amber-500",
          icon: "time" as const,
        };
      case "ocupada":
        return {
          texto: "Ocupada",
          bg: "bg-rose-50",
          border: "border-rose-200",
          textCol: "text-rose-700",
          dotCol: "bg-rose-500",
          icon: "close-circle" as const,
        };
    }
  };

  const asignarMesa = async (mesa: Mesa) => {
    if(mesa && mesa.disponibilidad === "vacia" && id){
        ///esto es el punto 10
        mesasServicio.actualizarDisponibilidad(mesa.id, "ocupada");
        actualizarEspera(id, mesa.id);
    }
  }

  return (
    <View className="flex-1 p-4 pt-5">
      <StatusBar style="dark" />

      <View className="flex-row items-center justify-between mb-4 px-1">
        <View>
          <Text className="text-neutral-400 font-bold text-[10px] tracking-widest uppercase">
            Asignar Mesa
          </Text>
          <Text className="text-2xl font-black text-neutral-900">
            Listado de mesas
          </Text>
        </View>

        <View className="bg-[#FF6B00] px-3 py-1.5 rounded-full shadow-sm">
          <Text className="text-white text-xs font-bold">
            {mesas.length} Mesas
          </Text>
        </View>
      </View>   
      {cargando ? (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text className="text-neutral-400 text-xs mt-2">Cargando mesas...</Text>
        </View>
      ) : (
      <ScrollView contentContainerClassName="pb-4" showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap justify-between">
          {elementosPaginados.map((mesa) => {
            const config = obtenerConfigDisponibilidad(mesa.disponibilidad);

            return (
              <View
                key={mesa.id}
                className="bg-brand-100 rounded-3xl p-3 mb-4 w-[48%] border border-orange-100 shadow-sm"
              >
                <View className="bg-neutral-800 self-start px-3 py-1 rounded-full mb-2">
                  <Text className="text-white font-bold text-xs">
                    Mesa {mesa.numero}
                  </Text>
                </View>

                <View className="bg-neutral-50 h-20 rounded-2xl items-center justify-center mb-3 border border-neutral-100">
                  <MaterialCommunityIcons
                    name="table-furniture"
                    size={40}
                    color="#D1D5DB"
                  />
                </View>

                <Text className="text-neutral-900 font-bold text-sm capitalize">
                  {formatearTipo(mesa.tipo)}
                </Text>
                <View className="flex-row items-center mb-2">
                  <Ionicons name="people-outline" size={13} color="#9CA3AF" style={{ marginRight: 4 }} />
                  <Text className="text-neutral-400 text-xs">
                    {mesa.comensales} personas
                  </Text>
                </View>

                <Text className="text-[9px] font-bold text-neutral-400 uppercase mb-1">
                  { mesa.disponibilidad === "vacia" ? "Se puede asignar." : "No se puede asignar" }
                </Text>

                <TouchableOpacity
                    disabled={mesa.disponibilidad !== "vacia"}
                    activeOpacity={.5}
                    onPress={()=>{asignarMesa(mesa)}}
                    className={`flex-row items-center justify-center py-2 rounded-xl border ${config.bg} ${config.border}`}
                >
                  <Ionicons name={config.icon} size={14} color={config.dotCol.replace('bg-', '')} style={{ marginRight: 4 }} />
                  <Text className={`text-xs font-bold ${config.textCol}`}>
                    {config.texto}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {mesas.length > 0 && (
          <View className="flex-row items-center justify-between py-3 mt-2 bg-white/60 p-3 rounded-2xl border border-neutral-200/60">
            <TouchableOpacity
              disabled={paginaActual === 1}
              onPress={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
              className={`px-3 py-1.5 rounded-xl border flex-row items-center ${
                paginaActual === 1
                  ? "bg-neutral-200 border-neutral-300 opacity-50"
                : "bg-orange-100 border-neutral-300 shadow-sm"
              }`}
            >
              <Ionicons name="chevron-back" size={14} color="#374151" />
              <Text className="text-xs font-bold text-neutral-700 ml-1">
                Anterior
              </Text>
            </TouchableOpacity>

            <Text className="text-xs font-semibold text-neutral-600">
              Página {paginaActual} de {totalPaginas}
            </Text>

            <TouchableOpacity
              disabled={paginaActual >= totalPaginas}
              onPress={() =>
                setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))
              }
              className={`px-3 py-1.5 rounded-xl border flex-row items-center ${
                paginaActual >= totalPaginas
                  ? "bg-neutral-200 border-neutral-300 opacity-50"
                  : "bg-orange-100 border-neutral-300 shadow-sm"
              }`}
            >
              <Text className="text-xs font-bold text-neutral-700 mr-1">
                Siguiente
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#374151" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      )}
    </View>
  );
}