import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useGraficoTiempoEspera } from '../hooks/useGraficosEncuestas';

export function GraficoTiempoEsperaScreen() {
    const { data, cargando, error, recargar } = useGraficoTiempoEspera();

    if (cargando) {
        return (
            <View className="flex-1 items-center justify-center bg-white p-6">
                <ActivityIndicator size="large" color="#FF6B00" />
                <Text className="mt-3 text-xs text-neutral-500 font-medium">Cargando métricas de tiempo de espera...</Text>
            </View>
        );
    }

    if (error || !data || data.total === 0) {
        return (
            <View className="flex-1 items-center justify-center bg-white px-6">
                <Text className="text-4xl mb-3">⏱️</Text>
                <Text className="text-base font-bold text-neutral-800 text-center mb-1">
                    {error ? 'Error al cargar datos' : 'Sin encuestas registradas'}
                </Text>
                <Text className="text-xs text-neutral-500 text-center mb-4">
                    {error ?? 'Aún no se han recibido opiniones sobre el tiempo de espera.'}
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

    const { promedio, velocidadPromedioLabel, distribucion, total } = data;

    // Calcular ángulo de la aguja del velocímetro
    // Escala de 1 (Muy rápido = 180deg) a 5 (Muy lento = 0deg)
    // En coordenadas SVG: 180° = izquierda, 90° = arriba (centro), 0° = derecha
    const clampedPromedio = Math.min(5, Math.max(1, promedio || 3));
    const factor = (clampedPromedio - 1) / 4; // 0 (rápido) a 1 (lento)
    const angleDeg = 180 - factor * 180; // 180° a 0°
    const angleRad = (angleDeg * Math.PI) / 180;

    // Centro del velocímetro
    const cx = 110;
    const cy = 95;
    const needleLength = 54;

    const needleX = cx + needleLength * Math.cos(angleRad);
    const needleY = cy - needleLength * Math.sin(angleRad);

    // Color según velocidad
    const getVelocidadColor = () => {
        if (clampedPromedio <= 2.2) return { text: 'text-emerald-600', bg: 'bg-emerald-500', border: 'border-emerald-200' };
        if (clampedPromedio <= 3.4) return { text: 'text-amber-600', bg: 'bg-amber-500', border: 'border-amber-200' };
        return { text: 'text-rose-600', bg: 'bg-rose-500', border: 'border-rose-200' };
    };

    const colorConfig = getVelocidadColor();

    return (
        <View className="flex-1 bg-white p-3 items-center">
            {/* Título de la categoría */}
            <View className="w-full mb-3 items-center">
                <Text className="text-3xl font-black text-neutral-900">⏱️ Tiempo de Espera</Text>
            </View>

            {/* Indicador de promedio con badge */}
            <View className="w-full mb-2 p-4 rounded-2xl bg-green-50/80 border border-green-200/80 flex-row items-center justify-between shadow-xs">
                <View>
                    <View className="flex-row items-baseline gap-1 mt-0.5">
                        <Text className="text-3xl font-black text-green-600">{promedio.toFixed(1)}</Text>
                        <Text className="text-xl font-bold text-green-800">/ 5.0</Text>
                    </View>
                    <Text className="text-[13px] text-green-700 mt-0.5">
                        Basado en {total} {total === 1 ? 'opinión' : 'opiniones'}
                    </Text>
                </View>

                <View className="items-end">
                    <View className={`px-4 py-1 ${colorConfig.bg} rounded-full`}>
                        <Text className="text-[22px] font-extrabold ml-1.5">
                            {velocidadPromedioLabel}
                        </Text>
                    </View>
                </View>
            </View>
            
            {/* Velocímetro / Gauge semicircular */}
            <View className="w-full items-center justify-center p-3 bg-brand-100 rounded-2xl border border-neutral-200/70 mb-2">
                <Text className="text-xl font-bold text-neutral-600 tracking-wider">
                    Velocímetro de Demora
                </Text>

                <View className="items-center justify-center">
                    <Svg width={220} height={110}>
                        {/* Arco Verde: Rápido (180° a 120°) */}
                        <Path
                            d="M 40 95 A 70 70 0 0 1 75 34"
                            stroke="#10B981"
                            strokeWidth={14}
                            fill="none"
                            strokeLinecap="round"
                        />
                        {/* Arco Amarillo: Normal (120° a 60°) */}
                        <Path
                            d="M 75 34 A 70 70 0 0 1 145 34"
                            stroke="#F59E0B"
                            strokeWidth={14}
                            fill="none"
                        />
                        {/* Arco Rojo: Lento (60° a 0°) */}
                        <Path
                            d="M 145 34 A 70 70 0 0 1 180 95"
                            stroke="#EF4444"
                            strokeWidth={14}
                            fill="none"
                            strokeLinecap="round"
                        />

                        {/* Aguja del velocímetro */}
                        <Line
                            x1={cx}
                            y1={cy}
                            x2={needleX}
                            y2={needleY}
                            stroke="#1E2342"
                            strokeWidth={3.5}
                            strokeLinecap="round"
                        />

                        {/* Base de la aguja */}
                        <Circle cx={cx} cy={cy} r={8} fill="#1E2342" />
                        <Circle cx={cx} cy={cy} r={4} fill="#FFFFFF" />
                    </Svg>
                </View>

                {/* Etiquetas de los extremos */}
                <View className="flex-row justify-between w-[200px] -mt-2">
                    <Text className="text-[13px] font-bold text-emerald-600 -ml-5">⚡ Muy Rápido</Text>
                    <Text className="text-[13px] font-bold text-rose-600 -mr-5">Muy Lento ⏳</Text>
                </View>
            </View>

            {/* Histograma de distribución de tiempos reportados */}
            <View className="w-full p-4 rounded-2xl bg-brand-100 border border-neutral-200/80">
                <View className="gap-2.5">
                    {distribucion.map((item) => {
                        const esRápido = item.nivel <= 2;
                        const esMedio = item.nivel === 3;
                        const barraColor = esRápido ? '#10B981' : esMedio ? '#F59E0B' : '#EF4444';

                        return (
                            <View key={item.nivel} className="gap-1">
                                <View className="flex-row justify-between items-center">
                                    <View className="flex-row items-center gap-1.5">
                                        <Text className="text-[12px] font-bold text-neutral-800">
                                            {item.label}
                                        </Text>
                                        <Text className="text-[11px] text-neutral-600">
                                            ({item.descripcion})
                                        </Text>
                                    </View>
                                    <Text className="text-sm font-bold text-neutral-700">
                                        {item.porcentaje}% <Text className="text-[10px] text-neutral-400">({item.cantidad})</Text>
                                    </Text>
                                </View>

                                <View className="h-3 w-full bg-[#ffff] rounded-full overflow-hidden">
                                    <View
                                        style={{
                                            width: `${item.porcentaje}%`,
                                            backgroundColor: barraColor,
                                        }}
                                        className="h-full rounded-full"
                                    />
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}

export default GraficoTiempoEsperaScreen;
