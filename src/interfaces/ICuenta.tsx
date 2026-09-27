export type EstadoCuenta = 'solicitada' | 'pagada' | 'confirmada';

export type NivelPropina = 'excelente' | 'muy_bueno' | 'bueno' | 'regular' | 'malo';

export type MetodoPago = 'dinero_en_cuenta' | 'tarjeta_debito' | 'tarjeta_credito';

export interface Cuenta {
  id: string;
  pedido_id: string;
  mesa_id: string;
  cliente_id: string | null;
  mesa_numero: number;
  cliente_nombre: string | null;
  estado: EstadoCuenta;
  subtotal: number;
  descuento_porcentaje: number;
  descuento_monto: number;
  propina_nivel: NivelPropina | null;
  propina_porcentaje: number | null;
  propina_monto: number | null;
  total: number | null;
  metodo_pago: MetodoPago | null;
  created_at: string;
  pagada_at: string | null;
  confirmada_at: string | null;
  confirmada_por: string | null;
}

export interface ItemCuenta {
  id?: string;
  nombre_producto: string;
  precio_unitario: number;
  cantidad: number;
}
