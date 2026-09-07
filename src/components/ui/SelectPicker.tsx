import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

type SelectPickerProps = {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  error?: string | null;
  onChange: (value: string) => void;
};

export function SelectPicker({
  label,
  value,
  options,
  placeholder = "Seleccioná una opción",
  error,
  onChange,
}: SelectPickerProps) {
  const [open, setOpen] = useState(false);
  const hasError = Boolean(error);

  return (
    <View className="gap-1.5">
      <Text nativeID={`${label}-label`} className="text-sm font-medium text-neutral-700">
        {label}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        aria-labelledby={`${label}-label`}
        className={`rounded-xl border bg-surface-light px-4 py-3.5 ${
          hasError ? "border-danger" : "border-neutral-400"
        }`}
        onPress={() => setOpen(true)}
      >
        <Text className={`text-base ${value ? "text-neutral-900" : "text-neutral-400"}`}>
          {value || placeholder}
        </Text>
      </Pressable>

      {hasError ? (
        <Text accessibilityRole="alert" className="text-sm text-danger">
          {error}
        </Text>
      ) : null}

      <Modal animationType="slide" transparent visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpen(false)}>
          <Pressable className="rounded-t-2xl bg-surface-light px-4 pb-8 pt-4" onPress={() => undefined}>
            <Text className="mb-4 text-center text-base font-semibold text-neutral-900">
              {label}
            </Text>

            {options.map((option) => (
              <Pressable
                key={option}
                accessibilityRole="button"
                className="border-b border-surface-muted py-4"
                onPress={() => {
                  onChange(option);
                  setOpen(false);
                }}
              >
                <Text
                  className={`text-center text-base ${
                    value === option ? "font-semibold text-brand-600" : "text-neutral-700"
                  }`}
                >
                  {option}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
