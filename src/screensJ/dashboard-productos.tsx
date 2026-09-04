import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../contextJ/Toast';
import { SoundService } from '../servicesJ/soundService';
import { ConfirmModal } from '../componentsZ/modal';
import { eliminarProducto, obtenerProductos } from '../servicesJ/productService';
import { IProductoPedido } from '../interfaces/IProductoPedido';

export default function ProductDashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  const [cargando, setCargando] = useState(true);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [productos, setProductos] = useState<IProductoPedido[]>([]);
  const [accion, setAccion] = useState<'eliminar' | 'editar'>('editar');
  const [cargoUsuario, setCargoUsuario] = useState<string | null>('bebidas');
  const [productoSeleccionado, setProductoSeleccionado] = useState<IProductoPedido | null>(null);

  const [mensajeModal, setMensajeModal] = useState<string>("");
  const [tituloModal, setTituloModal] = useState<string>("");
  const [actionModal, setActionModal] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    
      
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
      const respuesta = await obtenerProductos('bebidas');
  
      if (respuesta.exito) {
        setProductos(respuesta.datos || []);
        showToast('success', 'Productos cargados', 'Los productos se han cargado correctamente.');
        SoundService.reproducir("exito");
      } else {
        setMensajeError(respuesta.error);
        showToast('error', 'Error al cargar productos', mensajeError || 'Error desconocido');
        SoundService.reproducir('error');
      }
      setCargando(false);
    }
  
  
  const handleAddProduct = () => {
    router.push('/create-product' as any);
  };

  const handleEdit = (producto: IProductoPedido) => {
      router.push({
      pathname: '/create-product',
      params: { id: producto.id },
    });
  };
  const handleAction = (accion: 'eliminar' | 'editar', producto: IProductoPedido) => 
  {
    if(producto === null){
      showToast('error', 'Error', 'No se ha seleccionado ningún producto.');
      SoundService.reproducir('error');
      return;
    } else { 
      setAccion(accion);  
      setMensajeModal(`¿Estás seguro de que querés ${accion === 'eliminar' ? 'eliminar' : 'editar'} "${producto.nombre}"?`);
      setTituloModal(accion === 'eliminar' ? 'Eliminar Producto' : 'Editar Producto');
      setActionModal(accion === 'eliminar'? true : false);
      setProductoSeleccionado(producto);
      setModalVisible(true);
    }
  };

  const handleConfirmDelete = async () => {
    setModalVisible(false);
    setCargando(true);
    try{
      const respuesta = await eliminarProducto('bebidas', productoSeleccionado!.id);
      if (!respuesta.exito) 
        throw new Error(respuesta.error || 'Error desconocido al eliminar el producto.');
    
      await cargarDatos();
    } catch (error) {
      showToast('error', 'Error al eliminar', 'Ocurrió un problema al eliminar el producto.');
      SoundService.reproducir('error');
    } finally {
      setCargando(false);
    }
  };

  const handleModal = () => {
    if(productoSeleccionado === null) {
      showToast('error', 'Error', 'No se ha seleccionado ningún producto.');
      SoundService.reproducir('error');
    }else{
      if(accion === 'editar') {
        handleEdit(productoSeleccionado);
      } else if (accion === 'eliminar' ) {
        handleConfirmDelete();
      }
    }
    setModalVisible(false);
  };

  return (
  <View className="flex-1 bg-gray-100 p-4">
    <View className="flex-row items-center justify-between mb-4 mt-2">
      <View className="flex-1 pr-2">
        <Text className="text-2xl font-bold text-gray-900">Panel de Productos</Text>
        <Text className="text-xs text-gray-500">Gestión de la carta</Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleAddProduct}
        className="flex-row items-center bg-green-600 px-3.5 py-2.5 rounded-xl shadow-sm"
      >
        <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
        <Text className="text-white font-semibold text-sm ml-1.5">Agregar</Text>
      </TouchableOpacity>
    </View>

    {cargando ? (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    ) : (
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {productos.length === 0 ? (
          <View className="py-20 items-center justify-center bg-white rounded-2xl border border-gray-200 mt-2">
            <Ionicons name="fast-food-outline" size={54} color="#9CA3AF" />
            <Text className="text-gray-500 font-medium text-sm mt-3">
              No hay productos cargados en el menú.
            </Text>
          </View>
        ) : (
          productos.map((item) => (
            <View
              key={item.id}
              className="bg-white rounded-2xl p-3.5 mb-3 border border-gray-200 shadow-sm flex-row"
            >
              <View className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 relative self-center">
                <Image
                  source={{ uri: item.fotos[0] }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>

              <View className="flex-1 ml-3.5 justify-between">
                <View className="flex-row items-start justify-between">
                  <Text
                    className="font-bold text-gray-900 text-base flex-1 pr-2"
                    numberOfLines={1}
                  >
                    {item.nombre}
                  </Text>
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleAction('editar', item)}
                      className="w-7 h-7 rounded-lg bg-blue-50 items-center justify-center border border-blue-200 mr-1.5"
                    >
                      <Ionicons name="pencil" size={13} color="#2563EB" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleAction('eliminar', item)}
                      className="w-7 h-7 rounded-lg bg-red-50 items-center justify-center border border-red-200"
                    >
                      <Ionicons name="trash-outline" size={13} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text className="text-gray-500 text-xs my-1" numberOfLines={2}>
                  {item.descripcion}
                </Text>

                <View className="flex-row items-center justify-between mt-1">
                  <View className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex-row items-center">
                    <Ionicons name="time-outline" size={11} color="#D97706" />
                    <Text className="text-amber-700 text-[11px] font-medium ml-1">
                      {item.tiempo_elaboracion} min
                    </Text>
                  </View>

                  <Text className="font-extrabold text-gray-900 text-base">
                    ${item.precio.toLocaleString('es-AR')}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    )}

    <ConfirmModal
      visible={modalVisible}
      title={tituloModal}
      message={mensajeModal}
      confirmText="Si"
      cancelText="No"
      action={actionModal}
      onConfirm={handleModal}
      onCancel={() => {
        setModalVisible(false);
        setProductoSeleccionado(null);
      }}
    />
  </View>
  );
}