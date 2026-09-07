import type { ReactNode } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";

type InputProps = TextInputProps & {
  label: string;
  error?: string | null;
  rightElement?: ReactNode;
};

export function Input({ label, error, className, rightElement, ...props }: InputProps) {
  const hasError = Boolean(error);
  const borderClass = hasError ? "border-danger" : "border-neutral-400";

  return (
    <View className="gap-1.5">
      <Text nativeID={`${label}-label`} className="text-base font-semibold text-neutral-700">
        {label}
      </Text>

      {rightElement ? (
        <View className={`flex-row items-center rounded-xl border bg-surface-light ${borderClass}`}>
          <TextInput
            accessibilityLabel={label}
            aria-labelledby={`${label}-label`}
            placeholderTextColor="#A0A0A5"
            className={`min-w-0 flex-1 px-3 py-2.5 text-base text-neutral-900 ${className ?? ""}`}
            {...props}
          />
          {rightElement}
        </View>
      ) : (
        <TextInput
          accessibilityLabel={label}
          aria-labelledby={`${label}-label`}
          placeholderTextColor="#A0A0A5"
          className={`rounded-xl border bg-surface-light px-3 py-2.5 text-base text-neutral-900 ${borderClass} ${className ?? ""}`}
          {...props}
        />
      )}

      {hasError ? (
        <Text accessibilityRole="alert" className="text-base text-danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
