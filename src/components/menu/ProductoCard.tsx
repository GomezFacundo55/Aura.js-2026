import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { ImageCarousel } from "@/components/menu/ImageCarousel";
import type { IProductoPedido } from "@/interfaces/IProductoPedido";

type ProductoCardProps = {
  producto: IProductoPedido;
};

export function ProductoCard({ producto }: ProductoCardProps) {
  const fotos = Array.isArray(producto.fotos) ? producto.fotos : [];

  return (
    <View className="mb-4 overflow-hidden rounded-3xl border border-white/60 bg-[#FFF4E6] shadow-sm">
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

        <View className="mt-3 self-start rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 flex-row items-center">
          <Ionicons name="time-outline" size={12} color="#D97706" />
          <Text className="ml-1 text-[12px] font-semibold text-amber-700">
            {producto.tiempo_elaboracion} min
          </Text>
        </View>
      </View>
    </View>
  );
}
