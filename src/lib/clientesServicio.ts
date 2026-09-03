import * as Crypto from 'expo-crypto';
import type { Cliente, ClienteEstado } from '../types/database';
import { eventBus } from './eventos';
import { escribirTabla, leerTabla } from './localDb';

const TABLA = 'clientes';

export const clientesService = {
  async listarPendientes(): Promise<Cliente[]> {
    const clientes = await leerTabla<Cliente>(TABLA);
    return clientes
      .filter((c) => c.estado === 'pendiente')
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  },

  // Simula el registro de un cliente (punto del dispositivo 1, util para probar sin esa pantalla lista)
  async registrar(datos: { nombres: string; apellidos: string; foto_url: string }): Promise<Cliente> {
    const clientes = await leerTabla<Cliente>(TABLA);
    const nuevo: Cliente = {
      id: Crypto.randomUUID(),
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      foto_url: datos.foto_url,
      estado: 'pendiente',
      created_at: new Date().toISOString(),
    };
    await escribirTabla(TABLA, [...clientes, nuevo]);
    eventBus.emit('cliente:nuevo', nuevo);
    return nuevo;
  },

  async resolver(id: string, estado: ClienteEstado): Promise<void> {
    const clientes = await leerTabla<Cliente>(TABLA);
    const actualizados = clientes.map((c) => (c.id === id ? { ...c, estado } : c));
    await escribirTabla(TABLA, actualizados);
  },
};