import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { RatingStars } from '../components/ui/RatingStars';
import { EmojiRating } from '../components/encuesta/EmojiRating';
import { SliderRating } from '../components/encuesta/SliderRating';
import { LikertRating } from '../components/encuesta/LikertRating';
import { useEncuesta } from '../hooks/useEncuesta';

interface EncuestaFormScreenProps {
    listaEsperaId: string;
    clienteId: string;
    mesaId: string;
    onEnviada?: () => void;
}

export function EncuestaFormScreen({
    listaEsperaId,
    clienteId,
    mesaId,
    onEnviada,
}: EncuestaFormScreenProps) {
    const { puedeResponder, cargando, enviando, error, enviarEncuesta } = useEncuesta({
        listaEsperaId,
    });

    const [atencion, setAtencion] = useState(0);
    const [comida, setComida] = useState(0);
    const [tiempoEspera, setTiempoEspera] = useState(0);
    const [limpieza, setLimpieza] = useState(0);
    const [comentario, setComentario] = useState('');

    const formCompleto = atencion > 0 && comida > 0 && tiempoEspera > 0 && limpieza > 0;

    const handleEnviar = async () => {
        if (!formCompleto) return;
        const resultado = await enviarEncuesta({
            clienteId,
            mesaId,
            calificacionAtencion: atencion as 1 | 2 | 3 | 4 | 5,
            calificacionComida: comida as 1 | 2 | 3 | 4 | 5,
            calificacionTiempoEspera: tiempoEspera as 1 | 2 | 3 | 4 | 5,
            calificacionLimpieza: limpieza as 1 | 2 | 3 | 4 | 5,
            comentario: comentario.trim() || undefined,
        });
        if (resultado.ok) onEnviada?.();
    };

    if (cargando) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#FF6B00" />
            </View>
        );
    }

    if (puedeResponder === false) {
        return (
            <View className="flex-1 items-center justify-center bg-white px-6">
                <Text className="text-center text-lg text-neutral-600">
                    Ya completaste la encuesta para esta visita. ¡Gracias por tu opinión!
                </Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-white px-5 pt-5" contentContainerStyle={{ paddingBottom: 40 }}>
            <View className="mb-5">
                <Text className="text-2xl font-black text-neutral-900">¿Cómo estuvo tu visita?</Text>
                <Text className="text-xs text-neutral-500 mt-1">
                    Tu opinión nos ayuda a brindarte la mejor experiencia gastronómica.
                </Text>
            </View>

            {/* 1. Calidad de atención: ⭐ Estrellas */}
            <View className="mb-4 p-4 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 shadow-xs">
                <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-bold text-neutral-800">⭐ Calidad de atención</Text>
                    <Text className="text-[11px] font-semibold text-amber-600">1 a 5 estrellas</Text>
                </View>
                <Text className="text-xs text-neutral-500 mb-2">¿Cómo te atendió el personal?</Text>
                <RatingStars value={atencion} onChange={setAtencion} disabled={enviando} />
            </View>

            {/* 2. Calidad de la comida: 😐😊😍 Emojis */}
            <View className="mb-4 p-4 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 shadow-xs">
                <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-bold text-neutral-800">🍽️ Calidad de la comida</Text>
                    <Text className="text-[11px] font-semibold text-blue-600">Satisfacción</Text>
                </View>
                <Text className="text-xs text-neutral-500 mb-2">¿Qué te pareció el sabor y la presentación?</Text>
                <EmojiRating value={comida} onChange={setComida} disabled={enviando} />
            </View>

            {/* 3. Tiempo de espera: Barra de progreso / Slider */}
            <View className="mb-4 p-4 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 shadow-xs">
                <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-bold text-neutral-800">⏱️ Tiempo de espera</Text>
                    <Text className="text-[11px] font-semibold text-emerald-600">Velocidad</Text>
                </View>
                <Text className="text-xs text-neutral-500 mb-1">¿Cuánto demoró tu pedido en llegar?</Text>
                <SliderRating value={tiempoEspera} onChange={setTiempoEspera} disabled={enviando} />
            </View>

            {/* 4. Limpieza del local: Escala Likert */}
            <View className="mb-5 p-4 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 shadow-xs">
                <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-bold text-neutral-800">🧹 Limpieza del local</Text>
                    <Text className="text-[11px] font-semibold text-slate-600">Escala Likert</Text>
                </View>
                <Text className="text-xs text-neutral-500 mb-2">¿Qué tan limpio y ordenado encontraste el restaurante?</Text>
                <LikertRating value={limpieza} onChange={setLimpieza} disabled={enviando} />
            </View>

            {/* Comentario opcional */}
            <View className="mb-5 p-4 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 shadow-xs">
                <Text className="text-sm font-bold text-neutral-800 mb-1">💬 Comentario adicional (opcional)</Text>
                <Text className="text-xs text-neutral-500 mb-2">¿Querés destacar algo especial o dejarnos una sugerencia?</Text>
                <TextInput
                    className="min-h-[85px] rounded-xl border border-neutral-300 p-3 text-neutral-900 bg-white"
                    multiline
                    textAlignVertical="top"
                    placeholder="Contanos más sobre tu experiencia..."
                    placeholderTextColor="#9CA3AF"
                    value={comentario}
                    onChangeText={setComentario}
                    editable={!enviando}
                />
            </View>

            {error && (
                <View className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
                    <Text className="text-xs font-semibold text-red-600 text-center">{error}</Text>
                </View>
            )}

            <Pressable
                onPress={handleEnviar}
                disabled={!formCompleto || enviando}
                className={`items-center justify-center rounded-2xl py-3.5 shadow-sm transition-all ${
                    formCompleto && !enviando ? 'bg-[#FF6B00] active:opacity-90' : 'bg-neutral-300'
                }`}
            >
                {enviando ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text className="text-base font-bold text-white">
                        {formCompleto ? 'Enviar encuesta' : 'Completá las 4 categorías para enviar'}
                    </Text>
                )}
            </Pressable>
        </ScrollView>
    );
}

export default EncuestaFormScreen;