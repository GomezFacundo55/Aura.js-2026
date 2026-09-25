import { supabase } from '@/lib/supabase';
import { EstadoPedidoItem } from '@/interfaces/IPedido';
import { actualizarEstadoDelPedido } from './pedidoService';

export type PedidoSector = {
  id: string;
  mesa_id: string;
  created_at: string;
  estado: string
  mesas: { numero: number } | null;
  items: {
    id: string;
    nombre_producto: string;
    cantidad: number;
    estado: string
  }[];
};

export async function obtenerPedidosPorSector(tabla: 'platos' | 'bebidas') {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('id, mesa_id, created_at, estado, mesas(numero), pedido_items(id, nombre_producto, cantidad, producto_tabla, estado)')
      .or('estado.eq.confirmado,estado.eq.en_preparacion')
      .order('created_at', { ascending: true });

    if (error) return { exito: false, error: error.message };

    const filtrados = (data ?? [])
      .map((pedido: any) => ({
        ...pedido,
        items: (pedido.pedido_items ?? []).filter((item: any) => item.producto_tabla === tabla),
      }))
      .filter((pedido: any) => pedido.items.length > 0);

    return { exito: true, datos: filtrados as PedidoSector[] };
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : 'No se pudieron obtener los pedidos.';
    return { exito: false, error: mensaje };
  }
}

export async function comenzarSector(pedidoId: string, tabla: 'platos' | 'bebidas') {
  try {
    const { error } = await supabase
      .from('pedido_items')
      .update({ estado: 'en_preparacion' })
      .eq('pedido_id', pedidoId)
      .eq('producto_tabla', tabla);

    if (error) return { exito: false, error: error.message };
    
    const { data: pedido, error: errorPedido } = await supabase
      .from('pedidos')
      .select('estado')
      .eq('id', pedidoId)
      .single();

    if (errorPedido) return { exito: false, error: errorPedido.message };

    if (pedido.estado !== 'en_preparacion') {
      const hayEnPreparacion = await verificarAlMenosUnoEnPreparacion(pedidoId);
      
      if (hayEnPreparacion) {
        await actualizarEstadoDelPedido(pedidoId, 'en_preparacion');
      }
    }
    return { exito: true, error: null };
  } catch (e: any) {
    return { exito: false, error: e.message };
  }
}

export async function terminarSector(pedidoId: string, tabla: 'platos' | 'bebidas') {
  try {
    const { error: errorItems } = await supabase
      .from('pedido_items')
      .update({ estado: 'terminado' })
      .eq('pedido_id', pedidoId)
      .eq('producto_tabla', tabla);

    if (errorItems) return { exito: false, error: errorItems.message };

    const todosListos = await verificarPedidoCompleto(pedidoId);

    if (todosListos) {
     await actualizarEstadoDelPedido(pedidoId, 'listo');
    }
   
    return { exito: true, error: errorItems };
  } catch (e: any) {
    return { exito: false, error: e.message };
  }
}

export async function verificarPedidoCompleto(pedidoId: string) {
  const { data: items, error } = await supabase
    .from('pedido_items')
    .select('estado')
    .eq('pedido_id', pedidoId);

  if (error || !items) {
    return false;
  }

  const todosListos = items.every((item) => item.estado === 'terminado');

  return todosListos;
}

export async function verificarAlMenosUnoEnPreparacion(pedidoId: string) {
  const { data: items, error } = await supabase
    .from('pedido_items')
    .select('estado')
    .eq('pedido_id', pedidoId);

  if (error || !items) {
    return false;
  }

  const hayEnPreparacion = items.some((item) => item.estado === 'en_preparacion');

  return hayEnPreparacion;
}