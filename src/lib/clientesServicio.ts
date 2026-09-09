import { supabase } from '@/lib/supabase';
import type { ClienteEstado } from '@/types/database';

export type Cliente = {
  id: string;
  nombres: string;
  apellidos: string;
  foto_url: string;
  estado: ClienteEstado;
  created_at: string;
};

export const clientesService = {
  async listarPendientes(): Promise<Cliente[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nombres, apellidos, foto_url, estado, created_at')
      .eq('perfil', 'cliente_registrado')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as Cliente[];
  },

  async resolver(id: string, estado: ClienteEstado): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ estado })
      .eq('id', id);

    if (error) throw error;
  },
};