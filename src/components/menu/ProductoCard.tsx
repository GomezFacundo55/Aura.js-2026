import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { ImageCarousel } from "@/components/menu/ImageCarousel";
import type { IProductoPedido } from "@/interfaces/IProductoPedido";

type ProductoCardProps = {
  producto: IProductoPedido;
  cantidad?: number;
  onCambiarCantidad?: (nuevaCantidad: number) => void;
  disabled?: boolean;
};

export function ProductoCard({
  producto,
  cantidad = 0,
  onCambiarCantidad,
  disabled = false,
}: ProductoCardProps) {
  const fotos = Array.isArray(producto.fotos) ? producto.fotos : [];

  const incrementar = () => {
    if (disabled || !onCambiarCantidad) return;
    onCambiarCantidad(cantidad + 1);
  };

  const decrementar = () => {
    if (disabled || !onCambiarCantidad) return;
    onCambiarCantidad(Math.max(0, cantidad - 1));
  };

  return (
    <View
      className={`mb-4 overflow-hidden rounded-3xl border shadow-sm ${
        cantidad > 0 ? "border-orange-300 bg-[#FFEBD6]" : "border-white/60 bg-[#FFF4E6]"
      }`}
    >
      <ImageCarousel uris={fotos} />

      <View className="p-2">
        <View className="flex-row items-start justify-between gap-2">
          <Text className="flex-1 text-2xl -mb-2 font-black text-[#1E2342]" numberOfLines={2}>
            {producto.nombre}
          </Text>
          <Text className="text-xl font-extrabold text-[#1E2342]">
            ${Number(producto.precio).toLocaleString("es-AR")}
          </Text>
        </View>

        <Text className="text-ls leading-5 text-[#7A6C5E]">
          {producto.descripcion || "Sin descripción."}
        </Text>

        <View className="mt-3 flex-row items-center justify-between">
          <View className="self-start rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 flex-row items-center">
            <Ionicons name="time-outline" size={12} color="#D97706" />
            <Text className="ml-1 text-[12px] font-semibold text-amber-700">
              {producto.tiempo_elaboracion} min
            </Text>
          </View>

          {cantidad === 0 ? (
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={disabled}
              onPress={incrementar}
              className={`flex-row items-center px-3 py-1.5 rounded-xl ${
                disabled ? "bg-neutral-300" : "bg-[#FF6B00]"
              }`}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text className="ml-1 text-white font-bold text-xs">Agregar</Text>
            </TouchableOpacity>
          ) : (
            <View className="flex-row items-center bg-white rounded-xl border border-orange-200 overflow-hidden">
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={disabled}
                onPress={decrementar}
                className="w-8 h-8 items-center justify-center"
              >
                <Ionicons name="remove" size={16} color="#FF6B00" />
              </TouchableOpacity>
              <Text className="w-6 text-center font-bold text-[#1E2342]">{cantidad}</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={disabled}
                onPress={incrementar}
                className="w-8 h-8 items-center justify-center"
              >
                <Ionicons name="add" size={16} color="#FF6B00" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
