import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';

export function JuegoParImpar({ onResultado }: { onResultado: (gano: boolean) => void }) {
  const [jugado, setJugado] = useState(false);
  const [resultado, setResultado] = useState<{ gano: boolean; numero: number } | null>(null);

  const jugar = (eleccion: 'par' | 'impar') => {
    if (jugado) return;
    const numero = Math.floor(Math.random() * 10) + 1;
    const esPar = numero % 2 === 0;
    const gano = (eleccion === 'par') === esPar;
    setResultado({ gano, numero });
    setJugado(true);
    onResultado(gano);
  };

  return (
    <View className="items-center gap-4 rounded-2xl bg-surface-light p-5">
      <Text className="text-base font-bold text-neutral-900">Par o Impar — 10% de descuento</Text>
      <Text className="text-sm text-neutral-600">Elegí si el número oculto es par o impar</Text>
      {!jugado ? (
        <View className="flex-row gap-3">
          <Pressable onPress={() => jugar('par')} className="rounded-xl bg-brand-500 px-6 py-3">
            <Text className="font-bold text-white">Par</Text>
          </Pressable>
          <Pressable onPress={() => jugar('impar')} className="rounded-xl bg-brand-500 px-6 py-3">
            <Text className="font-bold text-white">Impar</Text>
          </Pressable>
        </View>
      ) : (
        <Text className={`text-base font-bold ${resultado?.gano ? 'text-success' : 'text-danger'}`}>
          {resultado?.gano ? '¡Ganaste! ' : 'No ganaste. '}
          El número era {resultado?.numero}
        </Text>
      )}
    </View>
  );
}