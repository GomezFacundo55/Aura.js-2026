import * as Crypto from 'expo-crypto';
import type { Mesa, MesaDisponibilidad, MesaTipo } from '../types/database';
import { escribirTabla, leerTabla } from './localDb';

const TABLA = 'mesas';

export const mesasServicio = {
  async listar(): Promise<Mesa[]> {
    const mesas = await leerTabla<Mesa>(TABLA);
    return mesas.sort((a, b) => a.numero - b.numero);
  },

  async existeNumero(numero: number): Promise<boolean> {
    const mesas = await leerTabla<Mesa>(TABLA);
    return mesas.some((m) => m.numero === numero);
  },

  async crear(datos: {
    numero: number;
    comensales: number;
    tipo: MesaTipo;
    foto_url: string;
  }): Promise<Mesa> {
    const mesas = await leerTabla<Mesa>(TABLA);
    const id = Crypto.randomUUID();
    const qr_data = JSON.stringify({ mesaId: id, numero: datos.numero });

    const nueva: Mesa = {
      id,
      numero: datos.numero,
      comensales: datos.comensales,
      tipo: datos.tipo,
      disponibilidad: 'vacia',
      foto_url: datos.foto_url,
      qr_data,
      created_at: new Date().toISOString(),
    };

    await escribirTabla(TABLA, [...mesas, nueva]);
    return nueva;
  },

  async actualizarDisponibilidad(id: string, disponibilidad: MesaDisponibilidad): Promise<void> {
    const mesas = await leerTabla<Mesa>(TABLA);
    const actualizadas = mesas.map((m) => (m.id === id ? { ...m, disponibilidad } : m));
    await escribirTabla(TABLA, actualizadas);
  },
};