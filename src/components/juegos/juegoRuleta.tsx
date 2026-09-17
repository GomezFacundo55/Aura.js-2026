import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';

const SECTORES = ['Perdiste', 'Perdiste', 'Perdiste', 'Perdiste', 'Perdiste', '¡Ganaste!'];

export function JuegoRuleta({ onResultado }: { onResultado: (gano: boolean) => void }) {
  const [girando, setGirando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  const girar = () => {
    if (girando || resultado) return;
    setGirando(true);
    setTimeout(() => {
      const sector = SECTORES[Math.floor(Math.random() * SECTORES.length)];
      setResultado(sector);
      setGirando(false);
      onResultado(sector === '¡Ganaste!');
    }, 1500);
  };

  return (
    <View className="items-center gap-4 rounded-2xl bg-surface-light p-5">
      <Text className="text-base font-bold text-neutral-900">Ruleta — 20% de descuento</Text>
      <Text className="text-sm text-neutral-600">1 de cada 6 chances de ganar</Text>
      <View className="h-32 w-32 items-center justify-center rounded-full border-4 border-brand-500 bg-brand-50">
        <Text className="text-3xl">{girando ? '🎡' : '🎯'}</Text>
      </View>
      {!resultado ? (
        <Pressable onPress={girar} disabled={girando} className="rounded-xl bg-brand-500 px-6 py-3">
          <Text className="font-bold text-white">{girando ? 'Girando...' : 'Girar'}</Text>
        </Pressable>
      ) : (
        <Text className={`text-base font-bold ${resultado === '¡Ganaste!' ? 'text-success' : 'text-danger'}`}>
          {resultado}
        </Text>
      )}
    </View>
  );
}