import { supabase } from '@/lib/supabase';
import type { Cliente, ClienteEstado } from '@/types/database';

export const clientesService = {
  async listarPendientes(): Promise<Cliente[]> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as Cliente[];
  },

  async resolver(id: string, estado: ClienteEstado): Promise<void> {
    const { error } = await supabase
      .from('clientes')
      .update({ estado })
      .eq('id', id);

    if (error) throw error;
  },
};