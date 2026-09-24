import React, { useState } from 'react';
import { View, Text, Pressable, GestureResponderEvent } from 'react-native';

interface SliderRatingProps {
    value: number; // 1 to 5 (1 = Muy rápido, 5 = Muy lento)
    onChange: (value: number) => void;
    disabled?: boolean;
}

const PASOS_SLIDER = [
    { valor: 1, label: 'Muy rápido', detalle: '< 15 min', emoji: '⚡', color: '#10B981' },
    { valor: 2, label: 'Rápido', detalle: '15-25 min', emoji: '⏱️', color: '#3B82F6' },
    { valor: 3, label: 'Normal', detalle: '25-40 min', emoji: '⏳', color: '#F59E0B' },
    { valor: 4, label: 'Lento', detalle: '40-55 min', emoji: '⌛', color: '#F97316' },
    { valor: 5, label: 'Muy lento', detalle: '> 55 min', emoji: '🛑', color: '#EF4444' },
];

export function SliderRating({ value, onChange, disabled }: SliderRatingProps) {
    const [trackWidth, setTrackWidth] = useState<number>(0);

    const handleTouch = (evt: GestureResponderEvent) => {
        if (disabled || trackWidth <= 0) return;
        const x = evt.nativeEvent.locationX;
        const clampedX = Math.max(0, Math.min(x, trackWidth));
        const proporcion = clampedX / trackWidth;
        const nuevoValor = Math.min(5, Math.max(1, Math.round(proporcion * 4) + 1));
        if (nuevoValor !== value) {
            onChange(nuevoValor);
        }
    };

    const valorActivo = value > 0 ? value : 3; // Por defecto visualmente en Normal si no está elegido
    const porcentajeProgreso = ((valorActivo - 1) / 4) * 100;
    const pasoActual = PASOS_SLIDER.find((p) => p.valor === value);

    return (
        <View className="py-2">
            {/* Etiquetas de los extremos */}
            <View className="flex-row justify-between items-center mb-2 px-1">
                <View className="flex-row items-center gap-1">
                    <Text className="text-xs font-bold text-emerald-600">⚡ Muy rápido</Text>
                </View>
                <View className="flex-row items-center gap-1">
                    <Text className="text-xs font-bold text-rose-600">Muy lento ⏳</Text>
                </View>
            </View>

            {/* Pista interactiva de la barra de progreso / slider */}
            <View
                className="py-4 justify-center"
                onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
                onTouchStart={handleTouch}
                onTouchMove={handleTouch}
            >
                {/* Track de fondo */}
                <View className="h-3 w-full bg-neutral-200 rounded-full overflow-hidden">
                    {/* Relleno con color según progreso */}
                    <View
                        style={{
                            width: `${porcentajeProgreso}%`,
                            backgroundColor: pasoActual?.color ?? '#F59E0B',
                        }}
                        className="h-full rounded-full transition-all"
                    />
                </View>

                {/* Marcadores de pasos en la pista */}
                <View className="absolute left-0 right-0 flex-row justify-between px-1 pointer-events-none">
                    {PASOS_SLIDER.map((paso) => {
                        const alcanzado = paso.valor <= valorActivo;
                        return (
                            <View
                                key={paso.valor}
                                style={{
                                    backgroundColor: alcanzado ? (pasoActual?.color ?? '#F59E0B') : '#D4D4D8',
                                }}
                                className="w-2.5 h-2.5 rounded-full border border-white"
                            />
                        );
                    })}
                </View>

                {/* Thumb / Perilla indicadora */}
                <View
                    style={{
                        left: `${porcentajeProgreso}%`,
                        transform: [{ translateX: -14 }],
                        backgroundColor: pasoActual?.color ?? '#FF6B00',
                    }}
                    className="absolute w-7 h-7 rounded-full items-center justify-center border-2 border-white shadow-md pointer-events-none"
                >
                    <Text className="text-[10px] text-white font-black">{valorActivo}</Text>
                </View>
            </View>

            {/* Botones de pasos directos para toque fácil y accesible */}
            <View className="flex-row justify-between mt-1 gap-1">
                {PASOS_SLIDER.map((paso) => {
                    const seleccionado = value === paso.valor;
                    return (
                        <Pressable
                            key={paso.valor}
                            onPress={() => !disabled && onChange(paso.valor)}
                            disabled={disabled}
                            className={`flex-1 items-center py-1.5 rounded-xl border transition-all ${
                                seleccionado
                                    ? 'bg-neutral-900 border-neutral-900'
                                    : 'bg-neutral-50 border-neutral-200'
                            }`}
                        >
                            <Text
                                className={`text-[11px] font-bold ${
                                    seleccionado ? 'text-white' : 'text-neutral-700'
                                }`}
                            >
                                {paso.label}
                            </Text>
                            <Text
                                className={`text-[9px] ${
                                    seleccionado ? 'text-neutral-300' : 'text-neutral-400'
                                }`}
                            >
                                {paso.detalle}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            {/* Feedback del valor seleccionado */}
            <View className="mt-2 min-h-[20px] items-center justify-center">
                {value > 0 ? (
                    <Text className="text-xs font-semibold text-neutral-700">
                        {pasoActual?.emoji} {pasoActual?.label} ({pasoActual?.detalle})
                    </Text>
                ) : (
                    <Text className="text-xs text-neutral-400">Deslizá o tocá para indicar cuánto esperaste</Text>
                )}
            </View>
        </View>
    );
}

export default SliderRating;
