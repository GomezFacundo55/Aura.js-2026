import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../contextJ/Toast';
import { SoundService } from '../servicesJ/soundService';
import { ConfirmModal } from '../components/modal';
import { eliminarProducto, obtenerProductos, type tabla } from '../servicesJ/productService';
import { IProductoPedido } from '../interfaces/IProductoPedido';
import { getMyProfile, signOut, type UserProfile } from "@/lib/auth";

export default function ProductDashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  const [cargando, setCargando] = useState(true);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [productos, setProductos] = useState<IProductoPedido[]>([]);
  const [accion, setAccion] = useState<'eliminar' | 'editar'>('editar');
  const [perfilUsuario, setPerfilUsuario] = useState<UserProfile | null>(null);
  const [cargoUsuario, setCargoUsuario] = useState<tabla>('');
  const [productoSeleccionado, setProductoSeleccionado] = useState<IProductoPedido | null>(null);

  const [mensajeModal, setMensajeModal] = useState<string>("");
  const [tituloModal, setTituloModal] = useState<string>("");
  const [actionModal, setActionModal] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [paginaActual, setPaginaActual] = useState(1);
  const ELEMENTOS_POR_PAGINA = 3;
  const totalPaginas = Math.ceil(productos.length / ELEMENTOS_POR_PAGINA) || 1;
  const indiceInicio = (paginaActual - 1) * ELEMENTOS_POR_PAGINA;
  const productosVisibles = productos.slice(indiceInicio, indiceInicio + ELEMENTOS_POR_PAGINA);
  const [mostrarModalDos, setMostrarModalDos] = useState(false);

  useEffect(() => {
    async function loadUserData(){

      try {
        const user = await getMyProfile();
        if (user) {
          setPerfilUsuario(user);
          if(user.perfil === "cantinero"){
            setCargoUsuario('bebidas')
            await cargarDatos('bebidas')
          } else if (user.perfil === "cocinero"){
            setCargoUsuario('platos');
            await cargarDatos('platos');
          } else{
            showToast("error", "Perfil no admitido.", "Debe ser Cocinero o Bartender.");
            await SoundService.reproducir('error');
            await logOut();
          }
        } else {
          setCargoUsuario("");
          showToast("error", "Error al cargar usuario.", "Redirigiendo al login.");
          await SoundService.reproducir('error');
          await logOut();
        }
      } catch {
        showToast("error", "Error", "Error al cargar el perfil.");
      } finally{
        setCargando(false);
      }
    }
      
    loadUserData();
  }, []);

  const logOut = async()=>{
    const { error } = await signOut();
    if(error){
      showToast("error", "Error", "Error al cerrar sesión")
    } else {
      router.replace("/log-in");
    }
  }

  const modalOut = () =>{
    setTituloModal("Salir");
    setMensajeModal("Desea salir?")
    setMostrarModalDos(true);
  }

  const cargarDatos = async (tabla: tabla) => {
      if(!tabla) return;
      const respuesta = await obtenerProductos(tabla);
  
      if (respuesta.exito) {
        setProductos(respuesta.datos || []);
        setPaginaActual(1);
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
    router.push({
      pathname: "/create-product",
      params: { cargo: cargoUsuario },
    });
  };

  const handleEdit = (producto: IProductoPedido) => {
      router.push({
      pathname: '/create-product',
      params: { id: producto.id, cargo: cargoUsuario },
    });
  };

  const details = (producto: IProductoPedido)=>{
    router.push({
      pathname: "/product-details",
      params: { id: producto.id, cargo: cargoUsuario }
    })
  }
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
      const respuesta = await eliminarProducto(cargoUsuario, productoSeleccionado!.id);
      if (!respuesta.exito) 
        throw new Error(respuesta.error || 'Error desconocido al eliminar el producto.');
    
      await cargarDatos(cargoUsuario);
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
    <View className="flex-1 p-4">
      <View className="flex-row items-center justify-between mt-2 mb-0 bg-orange-500/30 p-2.5 rounded-2xl">
        <View className="flex-row items-center flex-1 mr-2">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={modalOut}
            className="w-9 h-9 rounded-xl bg-red-400 items-center justify-center mr-3 shadow-sm"
          >
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View className="flex-1">
            <Text className="text-dark font-medium text-xs">Bienvenido/a,</Text>
            <Text className="text-dark font-bold text-base" numberOfLines={1}>
              {perfilUsuario ? `${perfilUsuario.nombres} ${perfilUsuario.apellidos}` : "Cargando..."}
            </Text>
          </View>
        </View>

        {cargoUsuario ? (
          <View className="bg-white/20 px-2.5 py-1 rounded-full">
            <Text className="text-dark text-xs font-semibold uppercase tracking-wider">
              {perfilUsuario? `${perfilUsuario.perfil}` : "Cargando..."}
            </Text>
          </View>
        ) : null}
      </View>
  <View className="flex-1 p-4">
    <View className="flex-row items-center justify-between mb-4 mt-2">
      <View className="flex-1 pr-2">
        <Text className="text-xl font-bold text-black">
          Panel de Productos del {perfilUsuario? perfilUsuario.perfil : ""}
        </Text>
        <Text className="text-xs text-gray-600">Gestión de la carta</Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleAddProduct}
        className="flex-row items-center bg-brand-500 px-3.5 py-2.5 rounded-xl shadow-sm"
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
      <View className='flex-1'>
      
        {productos.length === 0 ? (
          <View className="py-20 items-center justify-center bg-white rounded-2xl border border-gray-200 mt-2">
            <Ionicons name="fast-food-outline" size={54} color="#9CA3AF" />
            <Text className="text-gray-500 font-medium text-sm mt-3">
              No hay productos cargados en el menú.
            </Text>
          </View>
        ) : (
          <>{
          productosVisibles.map((item) => (
            <View
              key={item.id}
              className="bg-orange-100 rounded-2xl p-3.5 mb-3 border border-orange-200 shadow-sm flex-row"
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
                    className="font-bold text-gray-900 text-sm flex-1 pr-2"
                    numberOfLines={2}
                  >
                    {item.nombre}
                  </Text>
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => details(item)}
                      className="w-7 h-7 rounded-lg bg-blue-50 items-center justify-center border border-blue-200 mr-1.5"
                    >  
                    <Ionicons name="information-circle-outline" size={14} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleAction('editar', item)}
                      className="w-7 h-7 rounded-lg bg-yellow-50 items-center justify-center border border-yellow-500 mr-1.5"
                    >
                      <Ionicons name="pencil" size={13} color="#9f9b2b" />
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
          ))}
      {productosVisibles.length > 0 && productosVisibles.length <= 2 && (
        <View className="py-6 items-center justify-center border-t border-dashed border-gray-300 mt-2">
          <Ionicons name="checkmark-done-circle-outline" size={28} color="dark" />
          <Text className="text-dark font-bold text-xs mt-1 text-center">
            No hay más productos para mostrar
          </Text>
        </View>
      )}
      </>
    )}
    {productos.length > ELEMENTOS_POR_PAGINA && (
      <View className="flex-row items-center justify-between bg-orange-500/30 px-4 py-2.5 rounded-2xl mt-1 mb-2">
        <TouchableOpacity
          disabled={paginaActual === 1}
          onPress={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
          className={`w-9 h-9 rounded-xl items-center justify-center ${
            paginaActual === totalPaginas ? 'bg-white/10' : 'bg-white/40'
          }`}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={paginaActual === 1 ? '#9CA3AF' : '#FFFFFF'}
          />
        </TouchableOpacity>

        <Text className="text-dark font-bold text-sm">
          Página {paginaActual} de {totalPaginas}
        </Text>

        <TouchableOpacity
          disabled={paginaActual === totalPaginas}
          onPress={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
          className={`w-9 h-9 rounded-xl items-center justify-center ${
            paginaActual === totalPaginas ? 'bg-white/10' : 'bg-white/40'
          }`}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={paginaActual === totalPaginas ? '#9CA3AF' : '#FFFFFF'}
          />
        </TouchableOpacity>
      </View>
      )}
      </View>
    )}
  </View>
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
  <ConfirmModal
    visible={mostrarModalDos}
    title={tituloModal}
    message={mensajeModal}
    confirmText="Si"
    cancelText="No"
    action={false}
    onConfirm={logOut}
    onCancel={() => {
      setMostrarModalDos(false);
    }}
  />
</View>
  );
}