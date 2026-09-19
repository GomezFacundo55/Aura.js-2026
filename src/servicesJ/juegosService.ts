import { supabase } from '@/lib/supabase';

export async function yaTieneDescuento(pedidoId: string) {
  const { data, error } = await supabase
    .from('descuentos_juego')
    .select('porcentaje, juego')
    .eq('pedido_id', pedidoId)
    .maybeSingle();

  if (error) return { exito: false, error: error.message };
  return { exito: true, datos: data };
}

export async function registrarDescuento(pedidoId: string, clienteId: string, porcentaje: number, juego: string) {
  const { error } = await supabase
    .from('descuentos_juego')
    .insert({ pedido_id: pedidoId, cliente_id: clienteId, porcentaje, juego });

  if (error) return { exito: false, error: error.message };
  return { exito: true };
}