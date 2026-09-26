import React from 'react';
import { View, Pressable, Text } from 'react-native';

interface LikertRatingProps {
    value: number; // 1 to 5
    onChange: (value: number) => void;
    disabled?: boolean;
}

interface LikertItem {
    valor: number;
    label: string;
    descripcion: string;
    color: string;
    bgActivo: string;
    borderActivo: string;
    textColor: string;
}

const NIVELES_LIKERT: LikertItem[] = [
    {
        valor: 1,
        label: 'Muy sucio',
        descripcion: 'Inaceptable',
        color: '#EF4444',
        bgActivo: 'bg-red-500',
        borderActivo: 'border-red-600',
        textColor: 'text-red-600',
    },
    {
        valor: 2,
        label: 'Sucio',
        descripcion: 'Descuidado',
        color: '#F97316',
        bgActivo: 'bg-orange-500',
        borderActivo: 'border-orange-600',
        textColor: 'text-orange-600',
    },
    {
        valor: 3,
        label: 'Regular',
        descripcion: 'Aceptable',
        color: '#64748B',
        bgActivo: 'bg-slate-500',
        borderActivo: 'border-slate-600',
        textColor: 'text-slate-600',
    },
    {
        valor: 4,
        label: 'Limpio',
        descripcion: 'Buen estado',
        color: '#10B981',
        bgActivo: 'bg-emerald-500',
        borderActivo: 'border-emerald-600',
        textColor: 'text-emerald-600',
    },
    {
        valor: 5,
        label: 'Muy limpio',
        descripcion: 'Impecable',
        color: '#059669',
        bgActivo: 'bg-emerald-600',
        borderActivo: 'border-emerald-700',
        textColor: 'text-emerald-700',
    },
];

export function LikertRating({ value, onChange, disabled }: LikertRatingProps) {
    const itemSeleccionado = NIVELES_LIKERT.find((item) => item.valor === value);

    return (
        <View className="py-2">
            {/* Rótulos guía extremos */}
            <View className="flex-row justify-between items-center mb-2 px-1">
                <Text className="text-xs font-bold text-red-600">Muy sucio (1)</Text>
                <Text className="text-xs font-bold text-emerald-600">Muy limpio (5)</Text>
            </View>

            {/* Fila de números / botones segmentados */}
            <View className="flex-row justify-between gap-1.5 p-1 bg-neutral-100 rounded-2xl">
                {NIVELES_LIKERT.map((item) => {
                    const seleccionado = value === item.valor;
                    return (
                        <Pressable
                            key={item.valor}
                            onPress={() => !disabled && onChange(item.valor)}
                            disabled={disabled}
                            className={`flex-1 items-center justify-center py-2.5 rounded-xl transition-all ${
                                seleccionado
                                    ? `${item.bgActivo} shadow-sm scale-[1.03]`
                                    : 'bg-white'
                            }`}
                        >
                            <Text
                                className={`text-base font-black ${
                                    seleccionado ? 'text-white' : 'text-neutral-700'
                                }`}
                            >
                                {item.valor}
                            </Text>
                            <Text
                                className={`text-[9px] font-semibold mt-0.5 text-center px-0.5 ${
                                    seleccionado ? 'text-white' : 'text-neutral-500'
                                }`}
                                numberOfLines={1}
                            >
                                {item.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            {/* Mensaje descriptivo con estado */}
            <View className="mt-2 min-h-[20px] items-center justify-center">
                {itemSeleccionado ? (
                    <Text className="text-xs font-medium text-neutral-600">
                        Nivel {itemSeleccionado.valor}:{' '}
                        <Text className={`font-bold ${itemSeleccionado.textColor}`}>
                            {itemSeleccionado.label} ({itemSeleccionado.descripcion})
                        </Text>
                    </Text>
                ) : (
                    <Text className="text-xs text-neutral-400">Seleccioná un nivel del 1 al 5</Text>
                )}
            </View>
        </View>
    );
}

export default LikertRating;
