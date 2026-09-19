import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getMyProfile, type UserProfile } from '@/lib/auth';
import { JuegoParImpar } from '@/components/juegos/juegoParImpar';
import { JuegoMemoria } from '@/components/juegos/juegoMemoria';
import { JuegoRuleta } from '@/components/juegos/juegoRuleta';
import { yaTieneDescuento, registrarDescuento } from '@/servicesJ/juegosService';

export default function JuegosScreen() {
  const { pedidoId } = useLocalSearchParams<{ pedidoId: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [descuentoObtenido, setDescuentoObtenido] = useState<{ porcentaje: number; juego: string } | null>(null);

  const esClienteRegistrado = profile?.perfil === 'cliente_registrado';

  useEffect(() => {
    getMyProfile().then(setProfile);
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

  return (
    <ScrollView className="flex-1 bg-surface-muted" contentContainerStyle={{ padding: 20, gap: 20 }}>
      <Text className="text-center text-xl font-bold text-neutral-900">Juegos y descuentos</Text>

      {descuentoObtenido ? (
        <View className="items-center rounded-2xl bg-success/10 p-4">
          <Text className="text-center text-base font-bold text-success">
            Ya tenés tu {descuentoObtenido.porcentaje}% de descuento asegurado
          </Text>
          <Text className="mt-1 text-center text-sm text-neutral-600">
            Podés seguir jugando por diversión, no se sumarán más descuentos.
          </Text>
        </View>
      ) : esClienteRegistrado ? (
        <Text className="text-center text-sm text-neutral-500">
          Ganá en tu primer intento para desbloquear un descuento. Después de jugar uno, podés seguir jugando los demás por diversión.
        </Text>
      ) : (
        <Text className="text-center text-sm text-danger">
          Los descuentos por juegos están disponibles solo para clientes registrados. Podés jugar igual, sin obtener descuento.
        </Text>
      )}

      <JuegoParImpar onResultado={(gano) => manejarResultado(gano, 10, 'par_impar')} />
      <JuegoMemoria onResultado={(gano) => manejarResultado(gano, 15, 'memoria')} />
      <JuegoRuleta onResultado={(gano) => manejarResultado(gano, 20, 'ruleta')} />
    </ScrollView>
  );
}