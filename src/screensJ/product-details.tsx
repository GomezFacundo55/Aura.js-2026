import{ useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../contextJ/Toast';
import { SoundService } from '@/servicesJ/soundService';
import { obtenerUnProducto, tabla } from '../servicesJ/productService';
import { IProductoPedido } from '@/interfaces/IProductoPedido';

export default function ProductDetail() {
  const { showToast } = useToast();
  const router = useRouter();
  const { id, cargo } = useLocalSearchParams<{ id?: string; cargo: tabla }>();

  const [product, setProduct] = useState<IProductoPedido | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);

  useEffect(() => {
    cargarProducto();
  }, [id]);

  const onBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/dashboard');
    }
  };

  const cargarProducto = async () => {
    if (!id) {
      setCargando(false);
      return;
    }

    setCargando(true);
    try {
      const respuesta = await obtenerUnProducto(cargo, id);
      if (!respuesta.exito) {
        throw new Error(respuesta.error || 'Error desconocido al obtener el producto.');
      }

      const prod = respuesta.datos ? respuesta.datos[0] : null;
      if (prod) {
        setProduct(prod as IProductoPedido);
      }
    } catch (err) {
      showToast('error', 'Error al cargar producto', 'Ocurrió un problema al obtener los datos del producto.');
      await SoundService.reproducir('error');
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#EA580C" />
        <Text className="text-gray-500 font-medium text-xs mt-3">Cargando producto...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <Ionicons name="alert-circle-outline" size={50} color="#DC2626" />
        <Text className="text-gray-800 font-bold text-base mt-2">Producto no encontrado</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onBack}
          className="mt-4 px-6 py-2.5 rounded-xl"
        >
          <Text className="text-white font-semibold text-sm">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fotos = product.fotos || [];
  const fotoPrincipal = fotos[selectedPhotoIndex] || fotos[0];

  return (
    <View className="flex-1 justify-between p-5">
      
      <Text className="text-xl font-bold text-gray-800">
        Detalles del Producto
      </Text>
      <View className="mt-2">
        <View className="w-full aspect-[16/10] rounded-2xl overflow-hidden bg-gray-100 border border-orange-200 shadow-sm relative">
          {fotoPrincipal ? (
            <Image
              source={{ uri: fotoPrincipal }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center bg-gray-200">
              <Ionicons name="image-outline" size={40} color="#9CA3AF" />
            </View>
          )}

          <View className="absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded-md">
            <Text className="text-[11px] font-bold text-white">
              {selectedPhotoIndex + 1} / {fotos.length || 3}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-2.5 mt-2.5">
          {fotos.map((foto, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.8}
              onPress={() => setSelectedPhotoIndex(idx)}
              className={`flex-1 aspect-[4/3] rounded-xl overflow-hidden border-2 bg-white ${
                selectedPhotoIndex === idx
                  ? 'border-orange-500 ring-2 ring-orange-200'
                  : 'border-gray-200 opacity-60'
              }`}
            >
              {foto ? (
                <Image
                  source={{ uri: foto }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full items-center justify-center bg-gray-100">
                  <Ionicons name="image-outline" size={20} color="#9CA3AF" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="bg-orange-100 rounded-2xl p-4 border border-orange-200 shadow-sm">
        <View className="flex-row items-start justify-between gap-2">
          <Text
            className="text-xl font-bold text-gray-900 flex-1 leading-tight"
            numberOfLines={2}
          >
            {product.nombre}
          </Text>
          <View className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex-row items-center shrink-0">
            <Ionicons name="time-outline" size={13} color="#D97706" />
            <Text className="text-amber-700 text-xs font-semibold ml-1">
              {product.tiempo_elaboracion} min
            </Text>
          </View>
        </View>

        <View className="h-px bg-gray-100 my-2.5" />

        <Text
          className="text-gray-600 text-xs leading-relaxed"
          numberOfLines={4}
        >
          {product.descripcion || 'Sin descripción detallada.'}
        </Text>
      </View>

      <View className="bg-orange-100 rounded-2xl px-4 py-3 border border-orange-200 flex-row items-center justify-between mb-1 shadow-sm">
        <View>
          <Text className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">
            Precio actual
          </Text>
          <Text className="text-2xl font-black text-gray-900">
            ${Number(product.precio).toLocaleString('es-AR')}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onBack}
          className="bg-orange-500 px-5 py-2.5 rounded-xl shadow-sm"
        >
          <Text className="text-white font-bold text-sm">Cerrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}