import { supabase } from "@/lib/supabase";
import {
  canAssignRole,
  EMPLOYEE_PROFILE_OPTIONS,
  isManagerRole,
  isEmployeeRole,
  PUBLIC_SIGNUP_ROLE,
  type ProfileRole,
} from "@/lib/validation";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import type { Href } from "expo-router";
import { Platform } from "react-native";

export type SignUpProfileInput = {
  email: string;
  password: string;
  nombres: string;
  apellidos: string;
  dni: string;
  cuil: string;
  photoUri: string | null;
};

export type CreateEmployeeInput = SignUpProfileInput & {
  perfil: ProfileRole;
};

export type UserProfile = {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  cuil: string;
  perfil: string;
  foto_url: string | null;
};

function supabaseErrorMessage(error: { message?: string } | null, fallback: string): string {
  const message = error?.message?.trim();
  return message && message.length > 0 ? message : fallback;
}

async function readPhotoBytes(photoUri: string): Promise<ArrayBuffer> {
  const base64 = await FileSystem.readAsStringAsync(photoUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return decode(base64);
}

async function uploadProfilePhoto(userId: string, photoUri: string): Promise<string | null> {
  const fileBody = await readPhotoBytes(photoUri);
  const path = `${userId}/avatar.jpg`;

  const { error } = await supabase.storage.from("avatars").upload(path, fileBody, {
    contentType: "image/jpeg",
    upsert: true,
  });

  if (error) {
    return null;
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

async function insertProfile(row: {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  cuil: string;
  perfil: ProfileRole;
  foto_url: string | null;
}): Promise<{ error: string | null }> {
  const { data, error } = await supabase.from("profiles").insert(row).select("id");

  if (error) {
    return { error: supabaseErrorMessage(error, "No pudimos guardar el perfil.") };
  }

  if (!data || data.length === 0) {
    return { error: "Supabase no devolvió el perfil creado. Revisá las columnas de la tabla profiles." };
  }

  return { error: null };
}

export async function getMyProfile(): Promise<UserProfile | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (userError || !userId) {
    return null;
  }

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as UserProfile;
}

export async function signUpWithProfile(input: SignUpProfileInput): Promise<{ error: string | null }> {
  // El sign-up público NUNCA elige rol: siempre "cliente_registrado".
  const perfil: ProfileRole = PUBLIC_SIGNUP_ROLE;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: {
        nombres: input.nombres.trim(),
        apellidos: input.apellidos.trim(),
        dni: input.dni,
        cuil: input.cuil,
        perfil,
      },
    },
  });

  if (authError) {
    return { error: supabaseErrorMessage(authError, "No pudimos crear la cuenta.") };
  }

  const userId = authData.user?.id;
  if (!userId) {
    return {
      error:
        "La cuenta se creó pero Supabase no devolvió el id del usuario (suele pasar con confirmación de email). No se pudo guardar el perfil.",
    };
  }

  let fotoUrl: string | null = null;
  if (input.photoUri) {
    fotoUrl = await uploadProfilePhoto(userId, input.photoUri);
  }

  // Insertamos aunque no haya session: RLS está desactivado y el user.id ya existe.
  return insertProfile({
    id: userId,
    nombres: input.nombres.trim(),
    apellidos: input.apellidos.trim(),
    dni: input.dni,
    cuil: input.cuil,
    perfil,
    foto_url: fotoUrl,
  });
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { error: supabaseErrorMessage(error, "No pudimos iniciar sesión.") };
  }

  return { error: null };
}

export async function createEmployeeAccount(
  input: CreateEmployeeInput,
): Promise<{ error: string | null }> {
  const actor = await getMyProfile();

  if (!isManagerRole(actor?.perfil)) {
    return { error: "Solo un supervisor o dueño puede dar de alta empleados." };
  }

  if (!EMPLOYEE_PROFILE_OPTIONS.includes(input.perfil) || !canAssignRole(input.perfil, actor?.perfil ?? null)) {
    return { error: "Ese rol no se puede asignar desde el alta de empleados." };
  }

  const { data: adminSessionData } = await supabase.auth.getSession();
  const adminSession = adminSessionData.session;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
  });

  if (authError) {
    if (adminSession) {
      await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      });
    }
    return { error: supabaseErrorMessage(authError, "No pudimos crear el usuario.") };
  }

  const userId = authData.user?.id;
  if (!userId) {
    if (adminSession) {
      await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      });
    }
    return { error: "No obtuvimos el id del nuevo usuario. No se guardó el perfil." };
  }

  let fotoUrl: string | null = null;
  if (input.photoUri) {
    fotoUrl = await uploadProfilePhoto(userId, input.photoUri);
  }

  const profileResult = await insertProfile({
    id: userId,
    nombres: input.nombres.trim(),
    apellidos: input.apellidos.trim(),
    dni: input.dni,
    cuil: input.cuil,
    perfil: input.perfil,
    foto_url: fotoUrl,
  });

  // signUp puede dejar la sesión del empleado: volvemos a la del supervisor/dueño.
  if (adminSession) {
    await supabase.auth.setSession({
      access_token: adminSession.access_token,
      refresh_token: adminSession.refresh_token,
    });
  }

  return profileResult;
}

const EMPLOYEE_ROUTES: Record<string, Href> = {
  mozo: "/(app)/mozo-home",
  cocinero: "/(app)/cocinero-home",
  cantinero: "/(app)/cantinero-home",
  metre: "/(app)/metre-home", 
};

const MANAGER_ROUTE: Href = "/(app)/manager-home";
const DEFAULT_ROUTE: Href = "/(app)/home";

export async function resolveHomeRoute(): Promise<{ route: Href | null; error: string | null }> {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    return { route: null, error: "No pudimos identificar al usuario." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("perfil")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profile) {
    return { route: null, error: "No pudimos cargar tu perfil." };
  }

  const role = profile.perfil as string;

  if (isManagerRole(role)) {
    return { route: MANAGER_ROUTE, error: null };
  }

  if (isEmployeeRole(role)) {
    return { route: EMPLOYEE_ROUTES[role] ?? DEFAULT_ROUTE, error: null };
  }

  return { route: "/(app)/home", error: null };
}