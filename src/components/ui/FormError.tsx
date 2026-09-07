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
    <View className="gap-2 rounded-xl border border-danger bg-brand-50 px-4 py-3">
      <Text accessibilityRole="alert" className="text-sm text-danger">
        {message}
      </Text>
      {onDismiss ? (
        <Pressable accessibilityRole="button" onPress={onDismiss}>
          <Text className="text-sm font-medium text-brand-600">Cerrar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
