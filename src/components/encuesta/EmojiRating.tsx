import { Pressable, Text, View } from 'react-native';

interface EmojiRatingProps {
    value: number; // 1 (Regular), 3 (Bueno), 5 (Excelente)
    onChange: (value: number) => void;
    disabled?: boolean;
}

interface EmojiOpcion {
    valor: number;
    emoji: string;
    label: string;
    descripcion: string;
    bgColor: string;
    borderColor: string;
    activeText: string;
}

const OPCIONES_EMOJI: EmojiOpcion[] = [
    {
        valor: 1,
        emoji: '😐',
        label: 'Regular',
        descripcion: 'Esperaba más',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-400',
        activeText: 'text-amber-700',
    },
    {
        valor: 3,
        emoji: '😊',
        label: 'Buena',
        descripcion: 'Rico y sabroso',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-400',
        activeText: 'text-blue-700',
    },
    {
        valor: 5,
        emoji: '😍',
        label: 'Excelente',
        descripcion: '¡Exquisito!',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-500',
        activeText: 'text-emerald-700',
    },
];

export function EmojiRating({ value, onChange, disabled }: EmojiRatingProps) {
    return (
        <View className="py-2">
            <View className="flex-row justify-between gap-3">
                {OPCIONES_EMOJI.map((item) => {
                    const seleccionado =
                        value === item.valor ||
                        (item.valor === 1 && value === 2) ||
                        (item.valor === 3 && value === 4);

                    return (
                        <Pressable
                            key={item.valor}
                            onPress={() => !disabled && onChange(item.valor)}
                            disabled={disabled}
                            style={seleccionado ? { transform: [{ scale: 1.02 }] } : undefined}
                            className={`flex-1 items-center justify-center py-3.5 px-2 rounded-2xl border-2 ${seleccionado
                                ? `${item.bgColor} ${item.borderColor} shadow-sm`
                                : 'bg-neutral-50/70 border-neutral-200'
                                }`}
                        >
                            <Text
                                style={seleccionado ? { transform: [{ scale: 1.1 }] } : undefined}
                                className={`text-4xl mb-1.5 ${seleccionado ? '' : 'opacity-80'}`}
                            >
                                {item.emoji}
                            </Text>
                            <Text
                                className={`text-xs font-bold ${seleccionado ? item.activeText : 'text-neutral-700'
                                    }`}
                            >
                                {item.label}
                            </Text>
                            <Text className="text-[10px] text-neutral-400 mt-0.5" numberOfLines={1}>
                                {item.descripcion}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            <View className="mt-2 min-h-[20px] items-center justify-center">
                {value > 0 ? (
                    <Text className="text-xs font-medium text-neutral-500">
                        Seleccionaste:{' '}
                        <Text className="font-bold text-neutral-800">
                            {OPCIONES_EMOJI.find(
                                (o) =>
                                    o.valor === value ||
                                    (o.valor === 1 && value === 2) ||
                                    (o.valor === 3 && value === 4)
                            )?.label ?? ''}
                        </Text>
                    </Text>
                ) : (
                    <Text className="text-xs text-neutral-400">Elegí la carita que mejor describe tu comida</Text>
                )}
            </View>
        </View>
    );
}

export default EmojiRating;
