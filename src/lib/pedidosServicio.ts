import { supabase } from '@/lib/supabase';

type ResultadoOperacion<T = undefined> = {
  exito: boolean;
  datos?: T;
  error?: string;
};

export async function obtenerPedidosPendientes(): Promise<ResultadoOperacion<any[]>> {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, pedido_items(*), mesas(numero)')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: true });

    if (error) {
      return { exito: false, error: error.message };
    }

    return { exito: true, datos: data ?? [] };
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : 'No se pudieron obtener los pedidos pendientes.';
    return { exito: false, error: mensaje };
  }
}

export async function rechazarPedido(pedidoId: string, motivo: string): Promise<ResultadoOperacion> {
  try {
    const { error } = await supabase
      .from('pedidos')
      .update({
        estado: 'rechazado',
        motivo_rechazo: motivo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pedidoId);

    if (error) {
      return { exito: false, error: error.message };
    }

    return { exito: true };
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : 'No se pudo rechazar el pedido.';
    return { exito: false, error: mensaje };
  }
}

export async function confirmarPedido(pedidoId: string): Promise<ResultadoOperacion> {
  try {
    const { error } = await supabase
      .from('pedidos')
      .update({
        estado: 'confirmado',
        updated_at: new Date().toISOString(),
      })
      .eq('id', pedidoId);

    if (error) {
      return { exito: false, error: error.message };
    }

    return { exito: true };
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : 'No se pudo confirmar el pedido.';
    return { exito: false, error: mensaje };
  }
}