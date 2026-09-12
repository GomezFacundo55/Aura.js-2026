import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Modal, Text, View } from "react-native";

type SuccessModalProps = {
    visible: boolean;
    message: string;
    durationMs?: number;
    onHide: () => void;
};

export function SuccessModal({
    visible,
    message,
    durationMs = 2000,
    onHide,
    }: SuccessModalProps) {
    useEffect(() => {
        if (!visible) return;

        const timer = setTimeout(onHide, durationMs);
        return () => clearTimeout(timer);
    }, [visible, durationMs, onHide]);

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
        <View className="flex-1 items-center justify-center bg-black/40 px-8">
            <View className="w-full max-w-xs items-center gap-3 rounded-lg bg-white p-6 shadow-lg">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-500">
                <Ionicons name="checkmark" size={36} color="#FFFFFF" />
            </View>
            <Text className="text-center text-base font-bold text-neutral-900">
                {message}
            </Text>
            </View>
        </View>
        </Modal>
    );
}