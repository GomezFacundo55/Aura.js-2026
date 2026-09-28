import { JuegoMemoria } from '@/components/juegos/juegoMemoria';
import { JuegoParImpar } from '@/components/juegos/juegoParImpar';
import { JuegoRuleta } from '@/components/juegos/juegoRuleta';
import { getMyProfile, type UserProfile } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { registrarDescuento, yaTieneDescuento } from '@/servicesJ/juegosService';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';


export default function JuegosScreen() {
  const { mesaId } = useLocalSearchParams<{ mesaId: string }>();
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [cargandoPedido, setCargandoPedido] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [descuentoObtenido, setDescuentoObtenido] = useState<{ porcentaje: number; juego: string } | null>(null);

  const esClienteRegistrado = profile?.perfil === 'cliente_registrado';

  useEffect(() => {
    getMyProfile().then(setProfile);
  }, []);

  useEffect(() => {
  if (!mesaId) {
    console.log('[juegos] mesaId vacío');
    setCargandoPedido(false);
    return;
  }



  supabase
    .from('pedidos')
    .select('id, estado')
    .eq('mesa_id', mesaId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
    .then(({ data, error }) => {
      setPedidoId(data?.id ?? null);
      setCargandoPedido(false);
    });
}, [mesaId]);

  useEffect(() => {
    if (pedidoId) {
      yaTieneDescuento(pedidoId).then((res) => {
        if (res.exito && res.datos) setDescuentoObtenido(res.datos);
      });
    }
  }, [pedidoId]);

  const manejarResultado = async (gano: boolean, porcentaje: number, juego: string) => {
    if (!gano) return;
    if (!esClienteRegistrado) return;
    if (!profile?.id || !pedidoId || descuentoObtenido) return;

    await registrarDescuento(pedidoId, profile.id, porcentaje, juego);
    setDescuentoObtenido({ porcentaje, juego });
  };

  if (cargandoPedido) {
    return (
      <View className="flex-1 items-center justify-center bg-[#FFF4E6]">
        <Text className="text-[#8A7B6D]">Cargando...</Text>
      </View>
    );
  }

  if (!pedidoId) {
    return (
      <View className="flex-1 items-center justify-center bg-[#FFF4E6] p-6">
        <Text className="text-center text-base font-bold text-[#1E2342]">
          Todavía no tenés un pedido en curso.
        </Text>
        <Text className="mt-1 text-center text-sm text-[#8A7B6D]">
          Confirmá un pedido para poder jugar y ganar descuentos.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#FFF4E6]" contentContainerStyle={{ padding: 20, gap: 16 }}>
      <Text className="text-center text-2xl font-black text-[#1E2342]">Juegos y descuentos</Text>

      {descuentoObtenido ? (
        <View className="items-center rounded-3xl border border-white/60 bg-white p-4 shadow-sm">
          <Text className="text-center text-base font-bold text-[#FF6B00]">
            Ya tenés tu {descuentoObtenido.porcentaje}% de descuento asegurado
          </Text>
          <Text className="mt-1 text-center text-sm text-[#8A7B6D]">
            Se aplicará al pagar tu cuenta.
          </Text>
        </View>
      ) : esClienteRegistrado ? (
        <Text className="text-center text-sm font-semibold text-[#8A7B6D]">
          Ganá en tu primer intento para desbloquear un descuento. Después de jugar uno, podés seguir jugando los demás por diversión.
        </Text>
      ) : (
        <Text className="text-center text-sm font-semibold text-red-600">
          Los descuentos por juegos están disponibles solo para clientes registrados.
        </Text>
      )}

      <JuegoParImpar onResultado={(gano) => manejarResultado(gano, 10, 'par_impar')} />
      <JuegoMemoria onResultado={(gano) => manejarResultado(gano, 15, 'memoria')} />
      <JuegoRuleta onResultado={(gano) => manejarResultado(gano, 20, 'ruleta')} />
    </ScrollView>
  );
}