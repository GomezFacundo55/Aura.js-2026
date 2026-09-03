import AsyncStorage from '@react-native-async-storage/async-storage';

export async function leerTabla<T>(clave: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(clave);
  return raw ? (JSON.parse(raw) as T[]) : [];
}

export async function escribirTabla<T>(clave: string, datos: T[]): Promise<void> {
  await AsyncStorage.setItem(clave, JSON.stringify(datos));
}