import { supabase } from '@/lib/supabase';

export type PedidoSector = {
  id: string;
  mesa_id: string;
  created_at: string;
  mesas: { numero: number } | null;
  items: {
    id: string;
    nombre_producto: string;
    cantidad: number;
  }[];
};

export async function obtenerPedidosPorSector(tabla: 'platos' | 'bebidas') {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('id, mesa_id, created_at, mesas(numero), pedido_items(id, nombre_producto, cantidad, producto_tabla)')
      .eq('estado', 'confirmado')
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