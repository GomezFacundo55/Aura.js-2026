import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useGraficoAtencion } from '../hooks/useGraficosEncuestas';

export function GraficoAtencionScreen() {
    const { data, cargando, error, recargar } = useGraficoAtencion();

    if (cargando) {
        return (
            <View className="flex-1 items-center justify-center bg-white p-6">
                <ActivityIndicator size="large" color="#FF6B00" />
                <Text className="mt-3 text-xs text-neutral-500 font-medium">Cargando métricas de atención...</Text>
            </View>
        );
    }

    if (error || !data || data.total === 0) {
        return (
            <View className="flex-1 items-center justify-center bg-white px-6">
                <Text className="text-4xl mb-3">⭐</Text>
                <Text className="text-base font-bold text-neutral-800 text-center mb-1">
                    {error ? 'Error al cargar datos' : 'Sin encuestas registradas'}
                </Text>
                <Text className="text-xs text-neutral-500 text-center mb-4">
                    {error ?? 'Aún no se han recibido calificaciones de atención al cliente.'}
                </Text>
                <TouchableOpacity
                    onPress={recargar}
                    className="px-4 py-2 bg-orange-500 rounded-xl active:opacity-80"
                >
                    <Text className="text-xs font-bold text-white">Reintentar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { distribucion, promedio, total } = data;

    const getColorPorEstrella = (estrella: number) => {
        switch (estrella) {
            case 1: return '#e53935'; // rojo
            case 2: return '#fb8c00'; // naranja
            case 3: return '#d8b518'; // amarillo
            case 4: return '#7cb342'; // verde claro
            case 5: return '#43a047'; // verde
            default: return '#F59E0B';
        }
    };

    const barData = distribucion.map((item) => ({
        value: item.cantidad,
        frontColor: getColorPorEstrella(item.estrella),
        topLabelComponent: () => (
            <Text className="text-[10px] font-bold text-neutral-700 text-center -mt-4">
                {item.cantidad}
            </Text>
        ),
        labelComponent: () => (
            <Text
                style={{ color: getColorPorEstrella(item.estrella), fontSize: 18, fontWeight: 'bold', marginTop: -5, marginLeft: 8}}
            >
                {item.estrella}★
            </Text>
        ),
    }));

    const barDataPorcentaje = barData.map((item) => ({
        ...item,
        value: total > 0 ? (item.value / total) * 100 : 0,
    }));

    const maxVal = Math.max(...distribucion.map((d) => d.cantidad), 5);

    return (
            <View className="flex-1 bg-white p-4">
            {/* Título de la categoría */}
            <View className="w-full mb-3 items-center">
                <Text className="text-3xl font-black text-neutral-900">⭐ Atención</Text>
            </View>

            {/* Promedio destacado arriba */}
            <View className="w-full mb-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex-row items-center justify-between shadow-xs">
                <View>
                    <View className="flex-row items-baseline gap-1 mt-0.5">
                        <Text className="text-3xl font-black text-amber-600">{promedio.toFixed(1)}</Text>
                        <Text className="text-xl font-bold text-amber-700">/ 5.0</Text>
                    </View>
                    <Text className="text-[13px] text-amber-700 mt-0.5">
                        Basado en {total} {total === 1 ? 'opinión' : 'opiniones'}
                    </Text>
                </View>

                <View className="items-end">
                    <View className="flex-row gap-0.5 mb-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Text
                                key={s}
                                className={`text-base text-[18px] ${
                                    s <= Math.round(promedio) ? 'text-amber-500' : 'text-amber-200'
                                }`}
                            >
                                ★
                            </Text>
                        ))}
                    </View>
                    <View className="px-2.5 py-1 bg-amber-500 rounded-full">
                        <Text className="text-[13px] font-extrabold text-white">
                            {promedio >= 4.5
                                ? 'EXCELENTE'
                                : promedio >= 3.5
                                ? 'MUY BUENA'
                                : promedio >= 2.5
                                ? 'REGULAR'
                                : 'A MEJORAR'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Gráfico de barras verticales */}
            <View className="flex-1 w-full items-center bg-brand-100 rounded-2xl border border-brand-200 shadow-sm pt-4 pb-2">
                <View className="px-5 py-1 bg-brand-400 rounded-[20] items-center">
                    <Text className="text-xl font-bold text-[#ffff]">Porcentaje por </Text>
                    <Text className="text-xl font-bold text-[#ffff]">cantidad de estrellas</Text>
                </View>
                <View className="flex-1 w-full items-center justify-center">
                    <BarChart
                        data={barDataPorcentaje}
                        maxValue={100}
                        noOfSections={4}
                        barWidth={32}
                        spacing={18}
                        initialSpacing={14}
                        endSpacing={14}
                        roundedTop
                        roundedBottom
                        rulesLength={260}
                        width={243}
                        height={230}
                        yAxisLabelTexts={['0', '25', '50', '75', '100']}
                        yAxisTextStyle={{ color: '#eb5a21', fontSize: 18, fontWeight: 'semibold' }}
                        yAxisLabelWidth={45}
                        xAxisLabelTextStyle={{ color: '#eb5a21', fontSize: 18, fontWeight: 'bold', marginBottom: -10 }}
                        yAxisThickness={0}
                        xAxisThickness={2}
                        xAxisColor="#eb5a21"
                        rulesColor="#000000"
                        rulesThickness={2}
                        isAnimated
                    />
                </View>
            </View>
        </View>
    );
}

export default GraficoAtencionScreen;
