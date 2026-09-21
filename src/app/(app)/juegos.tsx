import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getMyProfile, type UserProfile } from '@/lib/auth';
import { usePedidoActivo } from '@/hooks/usePedidoActivo';
import { JuegoParImpar } from '@/components/juegos/juegoParImpar';
import { JuegoMemoria } from '@/components/juegos/juegoMemoria';
import { JuegoRuleta } from '@/components/juegos/juegoRuleta';
import { yaTieneDescuento, registrarDescuento } from '@/servicesJ/juegosService';

export default function JuegosScreen() {
  const { mesaId } = useLocalSearchParams<{ mesaId: string }>();
  const { pedido, loading: cargandoPedido } = usePedidoActivo(mesaId);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [descuentoObtenido, setDescuentoObtenido] = useState<{ porcentaje: number; juego: string } | null>(null);

  const esClienteRegistrado = profile?.perfil === 'cliente_registrado';
  const pedidoId = pedido?.id;

  useEffect(() => {
    getMyProfile().then(setProfile);
  }, []);

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

  if (!pedido) {
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
    <ScrollView className="flex-1 bg-transparent" contentContainerStyle={{ padding: 20, gap: 16 }}>
      <Text className="text-center text-2xl font-black text-[#1E2342]">Juegos y descuentos</Text>

      {descuentoObtenido ? (
        <View className="items-center rounded-3xl border border-white/60 bg-white p-4 shadow-sm">
          <Text className="text-center text-base font-bold text-[#FF6B00]">
            Ya tenés tu {descuentoObtenido.porcentaje}% de descuento asegurado
          </Text>
          <Text className="mt-1 text-center text-sm text-[#8A7B6D]">
            Podés seguir jugando por diversión, no se sumarán más descuentos.
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