import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';

const ICONOS = ['🍕', '🍔', '🍕', '🍔'];

function mezclar<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function JuegoMemoria({ onResultado }: { onResultado: (gano: boolean) => void }) {
  const [cartas] = useState(() => mezclar(ICONOS));
  const [reveladas, setReveladas] = useState<number[]>([]);
  const [seleccion, setSeleccion] = useState<number[]>([]);
  const [terminado, setTerminado] = useState(false);
  const [gano, setGano] = useState(false);

  const tocarCarta = (index: number) => {
    if (terminado || reveladas.includes(index) || seleccion.includes(index) || seleccion.length === 2) return;

    const nuevaSeleccion = [...seleccion, index];
    setSeleccion(nuevaSeleccion);

    if (nuevaSeleccion.length === 2) {
      const [a, b] = nuevaSeleccion;
      const acerto = cartas[a] === cartas[b];
      setTimeout(() => {
        setReveladas((prev) => [...prev, a, b]);
        setSeleccion([]);
        setTerminado(true);
        setGano(acerto);
        onResultado(acerto);
      }, 600);
    }
  };

  return (
    <View className="items-center gap-4 rounded-2xl bg-surface-light p-5">
      <Text className="text-base font-bold text-neutral-900">Memoria — 15% de descuento</Text>
      <Text className="text-sm text-neutral-600">Encontrá el par en un solo intento</Text>
      <View className="flex-row flex-wrap justify-center gap-3">
        {cartas.map((icono, index) => {
          const visible = reveladas.includes(index) || seleccion.includes(index);
          return (
            <Pressable
              key={index}
              onPress={() => tocarCarta(index)}
              className="h-16 w-16 items-center justify-center rounded-xl bg-brand-100"
            >
              <Text className="text-2xl">{visible ? icono : '❓'}</Text>
            </Pressable>
          );
        })}
      </View>
      {terminado ? (
        <Text className={`text-base font-bold ${gano ? 'text-success' : 'text-danger'}`}>
          {gano ? '¡Ganaste!' : 'No ganaste esta vez.'}
        </Text>
      ) : null}
    </View>
  );
}