import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../contextJ/Toast';
import { ImageSlot } from '../components/ImageSlot';
import { pickImageHelper } from '@/servicesJ/imagePickerService';
import { ImageSourceOption } from '@/interfaces/IPickImageOptios';
import { SoundService } from '@/servicesJ/soundService';
import { ConfirmModal } from '../components/modal';
import { crearProducto, obtenerUnProducto, actualizarProducto, verificarNombreExistente, tabla } from '../servicesJ/productService';
import { IProductFormData } from '@/interfaces/IProductoForm';
import { IProductoPedido } from '@/interfaces/IProductoPedido';


export default function CreateProduct() {
  const { showToast } = useToast();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [price, setPrice] = useState('');
  const [images, setImages] = useState<[string, string, string]>(["", "", ""]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDosVisible, setModalDosVisible] = useState(false);
  const { id, cargo } = useLocalSearchParams<{ id?: string, cargo: tabla }>();
  const tablaSeleccionada: tabla = cargo;
  const [isEditing, setIsEditing] = useState(Boolean(id));
  const [product, setProduct] = useState<IProductoPedido | null>(null);

  useEffect(() => {
    if (isEditing) {
      cargarProducto();
    }
  }, [id]);

  const autocompleteFormData = (prod: IProductoPedido) => {
  setName(prod.nombre);
  setDescription(prod.descripcion);
  setPrepTime(prod.tiempo_elaboracion.toString());
  setPrice(prod.precio.toString());
  setImages(prod.fotos && prod.fotos.length === 3 ? prod.fotos : ["", "", ""]);
};

  const cargarProducto = async () => {
    if(!id) return;
    try {
      const respuesta = await obtenerUnProducto(tablaSeleccionada, id!);
      if(!respuesta.exito)
        throw new Error(respuesta.error || 'Error desconocido al obtener el producto.');

      const producto = respuesta.datos ? respuesta.datos[0] : null;
      if(producto) {
        setProduct(producto as IProductoPedido);
        autocompleteFormData(producto as IProductoPedido);
      }
    } catch (err) {
      showToast('error', 'Error al cargar producto', 'Ocurrió un problema al obtener los datos del producto.');
      await SoundService.reproducir('error');
    }
  }

  const handlePickImage = (index: number) => {
    Alert.alert(
      'Seleccionar Foto',
      '¿De dónde querés obtener la imagen?',
      [
        {
          text: 'Cámara',
          onPress: () => openPicker(index, 'camera'),
        },
        {
          text: 'Galería',
          onPress: () => openPicker(index, 'gallery'),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const openPicker = async (index: number, source: ImageSourceOption) => {
    try {
      const uri = await pickImageHelper({ source });
    if (uri) {
      setImages((prev) => {
        const updated: [string, string, string] = [...prev];
        updated[index] = uri;
        return updated;
      });
    }
    } catch (error) {
      await SoundService.reproducir('error');
      showToast('error', 'Error', 'No se pudo cargar la imagen.');
    }
  };

  const validFormData = () => {
    if (!name.trim()) {
      showToast('error', 'Campo incompleto', 'Ingresar el nombre del producto.');
      return false;
    }
    if (!description.trim()) {
      showToast('error', 'Campo incompleto', 'Ingresar una descripción.');
      return false;
    }
    if (!prepTime.trim() || isNaN(Number(prepTime)) || Number(prepTime) <= 0) {
      showToast('error', 'Dato inválido', 'Ingresar un tiempo de elaboración válido en minutos.');
      return false;
    }
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      showToast('error', 'Dato inválido', 'Ingresar un precio válido.');
      return false;
    }

    const pendingImages = images.filter((img) => img === "");
    if (pendingImages.length > 0) {
      showToast('info', 'Fotos requeridas', 'Debes cargar las 3 fotos del producto.');
      return false;
    }
    return true;
  }

  const clearFormData = () => {
    setName('');
    setDescription('');
    setPrepTime('');
    setPrice('');
    setImages(["", "", ""]);
  }
  const modalConfirm = async () => {
    if(!validFormData()) {
      await SoundService.reproducir('error');
      return;
    }
    setLoading(true);
    try{
      const checkNameResponse = await verificarNombreExistente(tablaSeleccionada, name, product?.id);
      if (checkNameResponse.existe) {
        await SoundService.reproducir('error');
        showToast('error', 'Nombre existente', 'Ya existe un producto con ese nombre.');
        return;
      }
      setModalVisible(true);
    }catch(err){
      showToast('error', 'Error al verificar nombre', 'Ocurrió un problema al verificar el nombre del producto.');
    }finally{
      setLoading(false);
    }
    setModalVisible(true);
  };

  function payload(): IProductFormData {
    return {
      nombre: name.trim(),
      descripcion: description.trim(),
      tiempo_elaboracion: Number(prepTime),
      precio: Number(price),
      fotos: images,
    }
  }

  const handleSubmit = async () => {
    
    setModalVisible(false);
    setLoading(true);
    try {
      const respuesta = await crearProducto(tablaSeleccionada, payload());
      if (!respuesta.exito) {
        throw new Error(respuesta.error || 'Error desconocido al crear el producto.');
      }

      clearFormData();
      await SoundService.reproducir('exito')
      showToast('success', 'Producto creado', 'El producto se guardó exitosamente.');
      setModalDosVisible(true);
      
    } catch (err) {
      await SoundService.reproducir('error')
      showToast('error', 'Error al guardar', 'Ocurrió un problema al registrar el producto.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!product) {
      showToast('error', 'Error', 'No se ha cargado el producto a actualizar.');
      return;
    }
    setModalVisible(false);
    setLoading(true);
    try{
      const respuesta = await actualizarProducto(tablaSeleccionada, product?.id!, payload());
      if (!respuesta.exito) 
        throw new Error(respuesta.error || 'Error desconocido al actualizar el producto.');
      redirectToDashboard();
    } catch (err) {
      await SoundService.reproducir('error');
      showToast('error', 'Error al actualizar', 'Ocurrió un problema al actualizar el producto.');
    } finally {
      setLoading(false);
    };
  }

  const redirectToDashboard = () => {
    setModalDosVisible(false);
    router.push('/(app)/dashboard' as any);
  };

  return (
    <ScrollView className="flex-1 bg-orange-400 px-4 py-6" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="flex-row items-center mb-6">
        <View className="flex-1">
        <Text className="text-2xl font-bold text-gray-800 mb-0.5">Datos del Producto</Text>
        <Text className="text-sm text-gray-500">Completar los detalles del producto.</Text>
      </View>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={redirectToDashboard}
        className="w-10 h-10 rounded-full bg-orange-300 border border-transparent items-center justify-center mr-3 shadow-sm"
      >
        <Ionicons name="arrow-back" size={20} color="#1F2937" />
      </TouchableOpacity>
    </View>

      <View className="mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-1">Nombre</Text>
        <TextInput
          className="bg-orange-100 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:border-green-600"
          placeholder="Nombre del pedido"
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-1">Descripción</Text>
        <TextInput
          className="bg-orange-100 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:border-green-600"
          placeholder="Ingredientes, presentación, detalles..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
        />
      </View>

      <View className="flex-row space-x-3 mb-6">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-700 mb-1">Tiempo (min)</Text>
          <TextInput
            className="bg-orange-100 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:border-green-600"
            placeholder="Ej. 25"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={prepTime}
            onChangeText={setPrepTime}
          />
        </View>

        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-700 mb-1">Precio ($)</Text>
          <TextInput
            className="bg-orange-100 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:border-green-600"
            placeholder="Ej. 6500"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
        </View>
      </View>

      <Text className="text-sm font-semibold text-gray-700 mb-2">
        Fotos del producto (3 requeridas)
      </Text>      
      <View className="space-y-4 mb-8">
        {images.map((uri, index) => (    
        <ImageSlot
            key={index}
            uri={uri}
            index={index}
            onPress={handlePickImage}
          />
        ))}
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={modalConfirm}
        disabled={loading}
        className={`w-full py-4 rounded-xl flex-row items-center justify-center shadow-md ${
          loading ? 'bg-green-300' : 'bg-green-600'
        }`}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
            <Text className="text-white font-bold text-base ml-2">{product ? 'Actualizar' : 'Guardar'} Producto</Text>
          </>
        )}
      </TouchableOpacity>
      <ConfirmModal
        visible={modalVisible}
        title="Confirmar acción"
        message={`¿Estás seguro de que deseas ${product ? 'actualizar' : 'guardar'} este producto?`}
        confirmText="Si"
        cancelText="No"
        action={false}
        onConfirm={isEditing ? handleUpdate : handleSubmit}
        onCancel={() => { setModalVisible(false); }}
      />
      <ConfirmModal
            visible={modalDosVisible}
            title="Confirmar acción"
            message="¿Volver al dashboard?"
            confirmText="Si"
            cancelText="No"
            action={false}
            onConfirm={redirectToDashboard}
            onCancel={() => { setModalDosVisible(false); }}
          />
    </ScrollView>
  );
}

