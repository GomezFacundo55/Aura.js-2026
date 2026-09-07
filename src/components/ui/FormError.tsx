import { Pressable, Text, View } from "react-native";

type FormErrorProps = {
  message: string | null;
  onDismiss?: () => void;
};

export function FormError({ message, onDismiss }: FormErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <View className="gap-1 rounded-xl border border-danger bg-brand-50 px-3 py-2">
      <Text accessibilityRole="alert" className="text-sm text-danger">
        {message}
      </Text>
      {onDismiss ? (
        <Pressable accessibilityRole="button" onPress={onDismiss}>
          <Text className="text-base font-semibold text-brand-600">Cerrar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
