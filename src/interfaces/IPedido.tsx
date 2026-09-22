export type EstadoPedido =
  | 'pendiente'
  | 'rechazado'
  | 'confirmado'
  | 'en_preparacion'
  | 'listo'
  | 'entregado';

export type EstadoPedidoItem = 
  | "pendiente"
  | "en_preparacion"
  | "terminado";
export interface PedidoItem {
  id?: string;
  pedido_id?: string;
  producto_id: string;
  producto_tabla: 'platos' | 'bebidas';
  nombre_producto: string;
  precio_unitario: number;
  cantidad: number;
  estado?: string;
}

export interface Pedido {
  id: string;
  mesa_id: string;
  cliente_id: string | null;
  estado: EstadoPedido;
  motivo_rechazo: string | null;
  importe_total: number;
  tiempo_estimado_min: number;
  created_at: string;
  updated_at: string;
}

export interface PedidoConItems extends Pedido {
  pedido_items: PedidoItem[];
}

export interface ItemCarrito {
  producto_id: string;
  producto_tabla: 'platos' | 'bebidas';
  nombre: string;
  precio: number;
  tiempo_elaboracion: number;
  cantidad: number;
}
