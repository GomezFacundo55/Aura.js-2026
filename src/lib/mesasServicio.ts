import { subirImagen } from '@/lib/subirImagen';
import { supabase } from '@/lib/supabase';
import type { Mesa, MesaDisponibilidad, MesaTipo } from '@/types/database';
import * as Crypto from 'expo-crypto';

export const mesasServicio = {
  async listar(): Promise<Mesa[]> {
    const { data, error } = await supabase
      .from('mesas')
      .select('*')
      .order('numero', { ascending: true });

    if (error) throw error;
    return data as Mesa[];
  },

  async existeNumero(numero: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('mesas')
      .select('id')
      .eq('numero', numero)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  async crear(datos: {
    numero: number;
    comensales: number;
    tipo: MesaTipo;
    foto_url: string; // acá llega el URI local del dispositivo
  }): Promise<Mesa> {
    const id = Crypto.randomUUID();
    const qr_data = JSON.stringify({ mesaId: id, numero: datos.numero });

    const fotoUrlSubida = await subirImagen('mesas', datos.foto_url, `mesa-${datos.numero}`);

    const { data, error } = await supabase
      .from('mesas')
      .insert({
        id,
        numero: datos.numero,
        comensales: datos.comensales,
        tipo: datos.tipo,
        disponibilidad: 'vacia',
        foto_url: fotoUrlSubida,
        qr_data,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Mesa;
  },

  async actualizarDisponibilidad(id: string, disponibilidad: MesaDisponibilidad): Promise<void> {
    const { error } = await supabase
      .from('mesas')
      .update({ disponibilidad })
      .eq('id', id);

    if (error) throw error;
  },
};