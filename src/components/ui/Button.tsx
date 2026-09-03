import { Pressable, Text, type PressableProps } from "react-native";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = PressableProps & {
  title: string;
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, { base: string; disabled: string; text: string }> = {
  primary: {
    base: "bg-brand-500",
    disabled: "bg-brand-300",
    text: "text-white",
  },
  secondary: {
    base: "border border-brand-500 bg-surface-light",
    disabled: "border-neutral-400 bg-neutral-100",
    text: "text-brand-600",
  },
  ghost: {
    base: "bg-transparent",
    disabled: "bg-transparent",
    text: "text-brand-600",
  },
};

export function Button({
  title,
  variant = "primary",
  disabled = false,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(disabled);
  const styles = variantClasses[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      className={`rounded-xl px-6 py-4 ${isDisabled ? styles.disabled : styles.base} ${className ?? ""}`}
      {...props}
    >
      <Text
        className={`text-center text-base font-semibold ${isDisabled ? "text-neutral-500" : styles.text}`}
      >
        {title}
      </Text>
    </Pressable>
  );
}
