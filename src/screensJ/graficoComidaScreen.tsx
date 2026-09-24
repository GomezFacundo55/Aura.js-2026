import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { useGraficoComida } from '../hooks/useGraficosEncuestas';

export function GraficoComidaScreen() {
    const { data, cargando, error, recargar } = useGraficoComida();

    if (cargando) {
        return (
            <View className="flex-1 items-center justify-center bg-white p-6">
                <ActivityIndicator size="large" color="#FF6B00" />
                <Text className="mt-3 text-xs text-neutral-500 font-medium">Cargando métricas de comida...</Text>
            </View>
        );
    }

    if (error || !data || data.total === 0) {
        return (
            <View className="flex-1 items-center justify-center bg-white px-6">
                <Text className="text-4xl mb-3">🍽️</Text>
                <Text className="text-base font-bold text-neutral-800 text-center mb-1">
                    {error ? 'Error al cargar datos' : 'Sin encuestas registradas'}
                </Text>
                <Text className="text-xs text-neutral-500 text-center mb-4">
                    {error ?? 'Aún no se han recibido opiniones sobre la calidad de la comida.'}
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

    const { reacciones, total, reaccionPredominante } = data;

    // Preparar datos para el gráfico tipo dona
    const pieData = reacciones
        .filter((r) => r.cantidad > 0)
        .map((r) => ({
            value: r.cantidad,
            color: r.color,
            text: `${r.porcentaje}%`,
        }));

    // Si todas están en 0 (caso borde)
    const datosGrafico =
        pieData.length > 0
            ? pieData
            : [{ value: 1, color: '#E5E7EB', text: '0%' }];

    return (
        <View className="flex-1 bg-white p-3 items-center">
            {/* Título de la categoría */}
            <View className="w-full mt-2 mb-4 items-center">
                <Text className="text-3xl font-black text-neutral-900">🥣 Comida</Text>
            </View>

            {/* Tarjeta de reacción predominante */}
            {reaccionPredominante && (
                <View className="w-full mb-3 pl-5 pr-5 pt-2 pb-2 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex-row items-center justify-between shadow-xs">
                    <View>
                        <Text className="text-[12px] mb-1 font-semibold tracking-wider text-blue-800">
                            Mayoría de respuestas
                        </Text>
                        <View className="flex-row items-center gap-2">
                            <Text className="text-3xl">{reaccionPredominante.emoji}</Text>
                            <Text className="text-3xl font-black text-blue-900">
                                {reaccionPredominante.label}
                            </Text>
                        </View>
                    </View>
                    <View className="bg-white/80 px-3 py-2 rounded-xl border border-blue-200 items-center">
                        <Text className="text-sm font-bold text-neutral-500">Total</Text>
                        <Text className="text-xl font-black text-neutral-900">{total}</Text>
                    </View>
                </View>
            )}

            {/* Gráfico de dona central */}
            <View className="w-full items-center justify-center py-4 bg-brand-100 rounded-2xl border border-neutral-100 mb-3">
                <PieChart
                    data={datosGrafico}
                    donut
                    radius={95}
                    innerRadius={50}
                    innerCircleColor="#FFE1D6"
                    showText={pieData.length > 0}
                    textColor="#FFFFFF"
                    textSize={17}
                    fontWeight="bold"
                    isAnimated
                    centerLabelComponent={() => (
                        <View className="items-center justify-center">
                            <Text className="text-3xl">{reaccionPredominante?.emoji ?? '🍴'}</Text>
                            <Text className="text-[17px] font-black text-neutral-700 mt-0.5">
                                {total} {total === 1 ? 'voto' : 'votos'}
                            </Text>
                        </View>
                    )}
                />
            </View>

            {/* Leyenda y tarjetas individuales de reacción */}
            <View className="w-full gap-2.5">
                {reacciones.map((item) => (
                    <View
                        key={item.id}
                        className="flex-row items-center justify-between p-2 rounded-2xl bg-brand-100 border border-neutral-200/80"
                    >
                        <View className="flex-row items-center gap-3">
                            <View
                                style={{ backgroundColor: item.color }}
                                className="w-3.5 h-3.5 rounded-full"
                            />
                            <Text className="text-3xl">{item.emoji}</Text>
                            <View>
                                <Text className="text-base font-bold text-neutral-800">{item.label}</Text>
                                <Text className="text-[11px] font-semibold text-neutral-500">
                                    {item.cantidad} {item.cantidad === 1 ? 'opinión' : 'opiniones'}
                                </Text>
                            </View>
                        </View>

                        <View className="items-end">
                            <Text className="text-lg font-black text-neutral-900">
                                {item.porcentaje}%
                            </Text>
                            <View className="w-20 h-1.5 bg-[#ffff] rounded-full mt-1 overflow-hidden">
                                <View
                                    style={{
                                        width: `${item.porcentaje}%`,
                                        backgroundColor: item.color,
                                    }}
                                    className="h-full rounded-full"
                                />
                            </View>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}

export default GraficoComidaScreen;
