export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Valor que se guarda en profiles.perfil */
export type ProfileRole =
  | "dueño"
  | "supervisor"
  | "metre"
  | "mozo"
  | "cocinero"
  | "cantinero"
  | "cliente_registrado";

export const PROFILE_ROLE_LABELS: Record<ProfileRole, string> = {
  dueño: "dueño",
  supervisor: "supervisor",
  metre: "metre",
  mozo: "mozo",
  cocinero: "cocinero",
  cantinero: "cantinero",
  cliente_registrado: "cliente_registrado",
};

/** Empleados que un dueño/supervisor puede dar de alta. */
export const EMPLOYEE_PROFILE_OPTIONS: ProfileRole[] = [
  "metre",
  "mozo",
  "cocinero",
  "cantinero",
];

export const PROFILE_OPTIONS: ProfileRole[] = [...EMPLOYEE_PROFILE_OPTIONS];

export const PUBLIC_SIGNUP_ROLE: ProfileRole = "cliente_registrado";

export const MANAGER_ROLES: ProfileRole[] = ["dueño", "supervisor"];

export function isManagerRole(role: string | null | undefined): boolean {
  return MANAGER_ROLES.includes(role as ProfileRole);
}

export function isEmployeeRole(role: string | null | undefined): boolean {
  return EMPLOYEE_PROFILE_OPTIONS.includes(role as ProfileRole);
}

export function canAssignRole(role: ProfileRole, actorRole: string | null): boolean {
  if (role === PUBLIC_SIGNUP_ROLE) {
    return true;
  }

  // Solo dueño/supervisor pueden crear perfiles de empleados.
  return isManagerRole(actorRole) && EMPLOYEE_PROFILE_OPTIONS.includes(role);
}

export function getProfileLabel(role: string): string {
  return PROFILE_ROLE_LABELS[role as ProfileRole] ?? role;
}

const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
const CUIT_PREFIXES = ["20", "23", "24", "27", "30", "33", "34"];

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();

  if (!trimmed) {
    return "El correo electrónico es obligatorio.";
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return "Ingresá un correo electrónico válido (ej: nombre@ejemplo.com).";
  }

  return null;
}

export function validateLoginPassword(password: string): string | null {
  if (!password) {
    return "La clave es obligatoria.";
  }

  return null;
}

export function validateSignUpPassword(password: string): string | null {
  if (!password) {
    return "La clave es obligatoria.";
  }

  if (password.length < 8) {
    return "La clave debe tener al menos 8 caracteres.";
  }

  if (!/[A-Za-z]/.test(password)) {
    return "La clave debe incluir al menos una letra.";
  }

  if (!/\d/.test(password)) {
    return "La clave debe incluir al menos un número.";
  }

  return null;
}

export function validatePasswordConfirm(password: string, confirm: string): string | null {
  if (!confirm) {
    return "Confirmá tu clave.";
  }

  if (confirm !== password) {
    return "Las claves no coinciden.";
  }

  return null;
}

export function validatePersonName(value: string, fieldLabel: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return `${fieldLabel} es obligatorio.`;
  }

  if (trimmed.length < 2) {
    return `${fieldLabel} debe tener al menos 2 caracteres.`;
  }

  if (!NAME_REGEX.test(trimmed)) {
    return `${fieldLabel} solo puede contener letras.`;
  }

  return null;
}

export function validateDni(value: string): string | null {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "El DNI es obligatorio.";
  }

  if (!/^\d+$/.test(digits)) {
    return "El DNI solo puede contener números.";
  }

  if (digits.length < 7 || digits.length > 8) {
    return "El DNI debe tener 7 u 8 dígitos.";
  }

  return null;
}

export function validateCuit(value: string): string | null {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "El CUIT es obligatorio.";
  }

  if (!/^\d+$/.test(digits)) {
    return "El CUIT solo puede contener números.";
  }

  if (digits.length !== 11) {
    return "El CUIT debe tener 11 dígitos.";
  }

  const prefix = digits.slice(0, 2);
  if (!CUIT_PREFIXES.includes(prefix)) {
    return "El CUIT debe empezar con 20, 23, 24, 27, 30, 33 o 34.";
  }

  if (!isValidCuitCheckDigit(digits)) {
    return "El CUIT ingresado no es válido (dígito verificador incorrecto).";
  }

  return null;
}

/** Algoritmo oficial AFIP del dígito verificador del CUIT/CUIL. */
function isValidCuitCheckDigit(digits: string): boolean {
  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = multipliers.reduce((total, multiplier, index) => {
    return total + multiplier * Number(digits[index]);
  }, 0);

  let checkDigit = 11 - (sum % 11);
  if (checkDigit === 11) checkDigit = 0;
  if (checkDigit === 10) checkDigit = 9;

  return checkDigit === Number(digits[10]);
}

export function validateProfile(profile: string): string | null {
  if (!profile) {
    return "Debés seleccionar un perfil.";
  }

  if (!PROFILE_OPTIONS.includes(profile as ProfileRole) && profile !== PUBLIC_SIGNUP_ROLE) {
    return "Seleccioná un perfil válido.";
  }

  return null;
}

export function validateEmployeeProfile(profile: string): string | null {
  if (!profile) {
    return "Debés seleccionar un perfil.";
  }

  if (!EMPLOYEE_PROFILE_OPTIONS.includes(profile as ProfileRole)) {
    return "Seleccioná un perfil de empleado (metre, mozo, cocinero o cantinero).";
  }

  return null;
}

export function validateGuestName(name: string): string | null {
  const trimmed = name.trim();

  if (!trimmed) {
    return "El nombre es obligatorio.";
  }

  if (trimmed.length < 2) {
    return "El nombre debe tener al menos 2 caracteres.";
  }

  if (!NAME_REGEX.test(trimmed)) {
    return "El nombre solo puede contener letras.";
  }

  return null;
}
