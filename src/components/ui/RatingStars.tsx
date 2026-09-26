import React from 'react';
import { View, Pressable, Text } from 'react-native';

interface RatingStarsProps {
    value: number;
    onChange: (value: number) => void;
    disabled?: boolean;
}

const LABELS_ESTRELLAS: Record<number, string> = {
    1: '1 estrella • Muy mala',
    2: '2 estrellas • Mejorable',
    3: '3 estrellas • Aceptable',
    4: '4 estrellas • Muy buena',
    5: '5 estrellas • ¡Excelente!',
};

export function RatingStars({ value, onChange, disabled }: RatingStarsProps) {
    return (
        <View className="items-center py-2">
            <View className="flex-row items-center justify-center gap-3">
                {[1, 2, 3, 4, 5].map((n) => {
                    const activa = n <= value;
                    return (
                        <Pressable
                            key={n}
                            onPress={() => !disabled && onChange(n)}
                            hitSlop={10}
                            className={`p-1.5 rounded-full transition-all ${
                                activa ? 'bg-amber-50' : 'bg-transparent'
                            }`}
                        >
                            <Text
                                className={`text-3xl ${
                                    activa ? 'text-amber-400' : 'text-neutral-300'
                                }`}
                            >
                                ★
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            <View className="mt-2 min-h-[22px] items-center justify-center">
                {value > 0 ? (
                    <Text className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
                        {LABELS_ESTRELLAS[value]}
                    </Text>
                ) : (
                    <Text className="text-xs text-neutral-400">Tocá una estrella (1-5)</Text>
                )}
            </View>
        </View>
    );
}

export default RatingStars;