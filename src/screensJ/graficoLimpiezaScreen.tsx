import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useGraficoLimpieza } from '../hooks/useGraficosEncuestas';

export function GraficoLimpiezaScreen() {
    const { data, cargando, error, recargar } = useGraficoLimpieza();

    if (cargando) {
        return (
            <View className="flex-1 items-center justify-center bg-white p-6">
                <ActivityIndicator size="large" color="#FF6B00" />
                <Text className="mt-3 text-xs text-neutral-500 font-medium">Cargando métricas de limpieza...</Text>
            </View>
        );
    }

    if (error || !data || data.total === 0) {
        return (
            <View className="flex-1 items-center justify-center bg-white px-6">
                <Text className="text-4xl mb-3">🧹</Text>
                <Text className="text-base font-bold text-neutral-800 text-center mb-1">
                    {error ? 'Error al cargar datos' : 'Sin encuestas registradas'}
                </Text>
                <Text className="text-xs text-neutral-500 text-center mb-4">
                    {error ?? 'Aún no se han recibido evaluaciones sobre la limpieza del local.'}
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

    const {
        niveles,
        total,
        desacuerdoPorcentaje,
        desacuerdoCantidad,
        neutroPorcentaje,
        neutroCantidad,
        acuerdoPorcentaje,
        acuerdoCantidad,
        promedio,
    } = data;

    return (
        <View
            className="flex-1 bg-white p-3 items-center">
            {/* Título de la categoría */}
            <View className="w-full mb-3 items-center mt-2 mb-5">
                <Text className="text-3xl font-black text-neutral-900">🧹 Limpieza del Local</Text>
            </View>

            {/* Tarjetas resumen divergente: Desacuerdo / Neutro / De acuerdo */}
            <View className="w-full flex-row justify-between gap-2 mb-4">
                {/* Desacuerdo / Negativo */}
                <View className="flex-1 p-3 rounded-2xl bg-rose-50 border border-rose-200 items-center">
                    <Text className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                        Sucio (1-2)
                    </Text>
                    <Text className="text-xl font-black text-rose-600 mt-0.5">
                        {desacuerdoPorcentaje}%
                    </Text>
                    <Text className="text-[10px] text-rose-600 font-medium">
                        {desacuerdoCantidad} {desacuerdoCantidad === 1 ? 'voto' : 'votos'}
                    </Text>
                </View>

                {/* Neutro */}
                <View className="flex-1 p-3 rounded-2xl bg-slate-50 border border-slate-200 items-center">
                    <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                        Regular (3)
                    </Text>
                    <Text className="text-xl font-black text-slate-600 mt-0.5">
                        {neutroPorcentaje}%
                    </Text>
                    <Text className="text-[10px] text-slate-600 font-medium">
                        {neutroCantidad} {neutroCantidad === 1 ? 'voto' : 'votos'}
                    </Text>
                </View>

                {/* De acuerdo / Positivo */}
                <View className="flex-1 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 items-center">
                    <Text className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        Limpio (4-5)
                    </Text>
                    <Text className="text-xl font-black text-emerald-600 mt-0.5">
                        {acuerdoPorcentaje}%
                    </Text>
                    <Text className="text-[10px] text-emerald-600 font-medium">
                        {acuerdoCantidad} {acuerdoCantidad === 1 ? 'voto' : 'votos'}
                    </Text>
                </View>
            </View>

            {/* Barra horizontal apilada divergente (Diverging Stacked Bar) */}
            <View className="w-full p-3 rounded-2xl bg-neutral-50/70 border border-neutral-200/80 mb-4">
                {/* La barra segmentada horizontal */}
                <View className="h-16 w-full flex-row rounded-xl overflow-hidden bg-neutral-200 shadow-inner">
                    {niveles.map((item) => {
                        if (item.cantidad === 0) return null;
                        return (
                            <View
                                key={item.nivel}
                                style={{
                                    width: `${item.porcentaje}%`,
                                    backgroundColor: item.color,
                                }}
                                className="h-full items-center justify-center border-r border-white/40 last:border-r-0"
                            >
                                {item.porcentaje >= 8 && (
                                    <Text className="text-[10px] font-black text-white">
                                        {item.porcentaje}%
                                    </Text>
                                )}
                            </View>
                        );
                    })}
                </View>

                {/* Leyenda de orientación divergente */}
                <View className="flex-row justify-between items-center mt-2 px-1">
                    <Text className="text-[13px] font-bold text-rose-600">← Sucio</Text>
                    <Text className="text-[13px] font-bold text-slate-500">Neutro</Text>
                    <Text className="text-[13px] font-bold text-emerald-600">Limpio →</Text>
                </View>
            </View>

            {/* Desglose de los 5 niveles Likert */}
            <View className="w-full p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                <View className="gap-3.5">
                    {[...niveles].reverse().map((item) => (
                        <View key={item.nivel} className="gap-1">
                            <View className="flex-row justify-between items-center">
                                <View className="flex-row items-center gap-2">
                                    <View
                                        style={{ backgroundColor: item.color }}
                                        className="w-4 h-4 rounded-full"
                                    />
                                    <Text className="text-rg font-bold text-neutral-800">
                                        Nivel {item.nivel} • {item.label}
                                    </Text>
                                </View>
                                <Text className="text-rg font-bold text-neutral-700">
                                    {item.porcentaje}% <Text className="text-[12px] text-neutral-400">({item.cantidad})</Text>
                                </Text>
                            </View>

                            <View className="h-2 w-full bg-neutral-200 rounded-full overflow-hidden">
                                <View
                                    style={{
                                        width: `${item.porcentaje}%`,
                                        backgroundColor: item.color,
                                    }}
                                    className="h-full rounded-full"
                                />
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
}

export default GraficoLimpiezaScreen;
