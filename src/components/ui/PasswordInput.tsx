import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, TextInput, View, type TextInputProps } from "react-native";

type PasswordInputProps = Omit<TextInputProps, "secureTextEntry"> & {
  label: string;
  error?: string | null;
};

export function PasswordInput({ label, error, className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const hasError = Boolean(error);

  return (
    <View className="gap-1.5">
      <Text nativeID={`${label}-label`} className="text-base font-semibold text-neutral-700">
        {label}
      </Text>

      <View
        className={`flex-row items-center rounded-xl border bg-surface-light ${
          hasError ? "border-danger" : "border-neutral-400"
        }`}
      >
        <TextInput
          accessibilityLabel={label}
          aria-labelledby={`${label}-label`}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#A0A0A5"
          secureTextEntry={!visible}
          className={`flex-1 px-3 py-2.5 text-base text-neutral-900 ${className ?? ""}`}
          {...props}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? "Ocultar clave" : "Mostrar clave"}
          className="px-3 py-2.5"
          onPress={() => setVisible((current) => !current)}
        >
          <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={20} color="#F0452A" />
        </Pressable>
      </View>

      {hasError ? (
        <Text accessibilityRole="alert" className="text-base text-danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
