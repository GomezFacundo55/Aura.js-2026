import { supabase } from './supabaseConexion';
import { ItemCarrito, Pedido, PedidoConItems } from '../interfaces/IPedido';

export async function crearPedidoConItems(
  mesaId: string,
  clienteId: string | null,
  items: ItemCarrito[],
) {
  try {
    const importeTotal = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
    const tiempoEstimado = items.reduce((acc, i) => Math.max(acc, i.tiempo_elaboracion), 0);

    const { data: pedido, error: errorPedido } = await supabase
      .from('pedidos')
      .insert([{
        mesa_id: mesaId,
        cliente_id: clienteId,
        estado: 'pendiente',
        importe_total: importeTotal,
        tiempo_estimado_min: tiempoEstimado,
      }])
      .select()
      .single();

    if (errorPedido || !pedido) {
      return { exito: false, datos: null, error: errorPedido?.message || 'No se pudo crear el pedido' };
    }

    const itemsAInsertar = items.map((i) => ({
      pedido_id: pedido.id,
      producto_id: i.producto_id,
      producto_tabla: i.producto_tabla,
      nombre_producto: i.nombre,
      precio_unitario: i.precio,
      cantidad: i.cantidad,
    }));

    const { error: errorItems } = await supabase.from('pedido_items').insert(itemsAInsertar);

    if (errorItems) {
      return { exito: false, datos: null, error: errorItems.message };
    }

    return { exito: true, datos: pedido as Pedido, error: null };
  } catch (err: any) {
    return { exito: false, datos: null, error: err.message || 'Error inesperado al crear el pedido' };
  }
}

export async function actualizarPedidoConItems(pedidoId: string, items: ItemCarrito[]) {
  try {
    const importeTotal = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
    const tiempoEstimado = items.reduce((acc, i) => Math.max(acc, i.tiempo_elaboracion), 0);

    const { error: errorBorrado } = await supabase
      .from('pedido_items')
      .delete()
      .eq('pedido_id', pedidoId);

    if (errorBorrado) {
      return { exito: false, datos: null, error: errorBorrado.message };
    }

    const itemsAInsertar = items.map((i) => ({
      pedido_id: pedidoId,
      producto_id: i.producto_id,
      producto_tabla: i.producto_tabla,
      nombre_producto: i.nombre,
      precio_unitario: i.precio,
      cantidad: i.cantidad,
    }));

    const { error: errorItems } = await supabase.from('pedido_items').insert(itemsAInsertar);
    if (errorItems) {
      return { exito: false, datos: null, error: errorItems.message };
    }

    const { data, error: errorUpdate } = await supabase
      .from('pedidos')
      .update({
        estado: 'pendiente',
        motivo_rechazo: null,
        importe_total: importeTotal,
        tiempo_estimado_min: tiempoEstimado,
      })
      .eq('id', pedidoId)
      .select()
      .single();

    if (errorUpdate) {
      return { exito: false, datos: null, error: errorUpdate.message };
    }

    return { exito: true, datos: data as Pedido, error: null };
  } catch (err: any) {
    return { exito: false, datos: null, error: err.message || 'Error inesperado al actualizar el pedido' };
  }
}

export async function obtenerPedidoActivoPorMesa(mesaId: string) {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, pedido_items(*)')
      .eq('mesa_id', mesaId)
      .neq('estado', 'entregado')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      return { exito: false, datos: null, error: error.message };
    }

    return { exito: true, datos: (data && data[0]) as PedidoConItems | undefined, error: null };
  } catch (err: any) {
    return { exito: false, datos: null, error: err.message || 'Error al consultar el pedido' };
  }
}

export async function obtenerPedidosPendientes() {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, pedido_items(*), mesas(numero)')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: true });

    if (error) {
      return { exito: false, datos: null, error: error.message };
    }

    return { exito: true, datos: data as any[], error: null };
  } catch (err: any) {
    return { exito: false, datos: null, error: err.message || 'Error al consultar pedidos pendientes' };
  }
}

export async function rechazarPedido(pedidoId: string, motivo: string) {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .update({ estado: 'rechazado', motivo_rechazo: motivo })
      .eq('id', pedidoId)
      .select()
      .single();

    if (error) {
      return { exito: false, datos: null, error: error.message };
    }

    return { exito: true, datos: data as Pedido, error: null };
  } catch (err: any) {
    return { exito: false, datos: null, error: err.message || 'Error al rechazar el pedido' };
  }
}
