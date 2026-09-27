import { supabase } from '@/lib/supabase';
import type { Cuenta, ItemCuenta, MetodoPago, NivelPropina } from '@/interfaces/ICuenta';

type Resultado<T = undefined> = { exito: boolean; datos?: T; error?: string };

const TABLA = 'cuentas';

export const NIVELES_PROPINA: Record<NivelPropina, { etiqueta: string; porcentaje: number }> = {
  excelente: { etiqueta: 'Excelente', porcentaje: 20 },
  muy_bueno: { etiqueta: 'Muy bueno', porcentaje: 15 },
  bueno: { etiqueta: 'Bueno', porcentaje: 10 },
  regular: { etiqueta: 'Regular', porcentaje: 5 },
  malo: { etiqueta: 'Malo', porcentaje: 0 },
};

export const METODOS_PAGO: Record<MetodoPago, string> = {
  dinero_en_cuenta: 'Dinero disponible',
  tarjeta_debito: 'Tarjeta de débito',
  tarjeta_credito: 'Tarjeta de crédito',
};

const redondear = (n: number) => Math.round(n * 100) / 100;

const normalizarCuenta = (c: any): Cuenta => ({
  ...c,
  mesa_numero: Number(c.mesa_numero),
  subtotal: Number(c.subtotal ?? 0),
  descuento_porcentaje: Number(c.descuento_porcentaje ?? 0),
  descuento_monto: Number(c.descuento_monto ?? 0),
  propina_porcentaje: c.propina_porcentaje == null ? null : Number(c.propina_porcentaje),
  propina_monto: c.propina_monto == null ? null : Number(c.propina_monto),
  total: c.total == null ? null : Number(c.total),
});

const mensajeError = (e: unknown, porDefecto: string) =>
  e instanceof Error ? e.message : (e as any)?.message ?? porDefecto;

export function interpretarQrPropina(data: string): NivelPropina | null {
  const esNivel = (v: unknown): v is NivelPropina =>
    typeof v === 'string' && v in NIVELES_PROPINA;

  try {
    const parsed = JSON.parse(data);
    const nivel = String(parsed?.nivel ?? '').toLowerCase();
    if (String(parsed?.tipo ?? '').toUpperCase() === 'PROPINA' && esNivel(nivel)) return nivel;
    return null;
  } catch {
    const texto = data.trim().toUpperCase();
    if (!texto.startsWith('PROPINA_')) return null;
    const nivel = texto.replace('PROPINA_', '').toLowerCase();
    return esNivel(nivel) ? nivel : null;
  }
}

export function calcularTotales(subtotal: number, descuentoPorcentaje: number, propinaPorcentaje: number) {
  const descuentoMonto = redondear((subtotal * descuentoPorcentaje) / 100);
  const baseConDescuento = redondear(subtotal - descuentoMonto);
  const propinaMonto = redondear((baseConDescuento * propinaPorcentaje) / 100);
  const total = redondear(baseConDescuento + propinaMonto);
  return { descuentoMonto, propinaMonto, total };
}

async function obtenerPedidoEntregado(clienteId: string, mesaId: string) {
  const { data, error } = await supabase
    .from('pedidos')
    .select('id, mesa_id, importe_total, pedido_items(id, nombre_producto, precio_unitario, cantidad), mesas(numero)')
    .eq('cliente_id', clienteId)
    .eq('mesa_id', mesaId)
    .eq('estado', 'entregado')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as any | null;
}

async function obtenerDescuentoJuego(pedidoId: string): Promise<number> {
  const { data, error } = await supabase
    .from('descuentos_juego')
    .select('porcentaje')
    .eq('pedido_id', pedidoId)
    .maybeSingle();

  if (error) return 0;
  return Number(data?.porcentaje ?? 0);
}

export async function obtenerItemsDePedido(pedidoId: string): Promise<ItemCuenta[]> {
  const { data, error } = await supabase
    .from('pedido_items')
    .select('id, nombre_producto, precio_unitario, cantidad')
    .eq('pedido_id', pedidoId);

  if (error) throw error;
  return (data ?? []).map((i: any) => ({
    ...i,
    precio_unitario: Number(i.precio_unitario),
    cantidad: Number(i.cantidad),
  }));
}

export async function solicitarCuenta(
  clienteId: string,
  clienteNombre: string,
  mesaId: string,
): Promise<Resultado<{ cuenta: Cuenta; items: ItemCuenta[]; nueva: boolean }>> {
  try {
    const pedido = await obtenerPedidoEntregado(clienteId, mesaId);
    if (!pedido) {
      return { exito: false, error: 'No encontramos un pedido entregado para esta mesa.' };
    }

    const items: ItemCuenta[] = (pedido.pedido_items ?? []).map((i: any) => ({
      ...i,
      precio_unitario: Number(i.precio_unitario),
      cantidad: Number(i.cantidad),
    }));

    const { data: existente, error: errorExistente } = await supabase
      .from(TABLA)
      .select('*')
      .eq('pedido_id', pedido.id)
      .maybeSingle();

    if (errorExistente) return { exito: false, error: errorExistente.message };
    if (existente) {
      return { exito: true, datos: { cuenta: normalizarCuenta(existente), items, nueva: false } };
    }

    const subtotal = redondear(
      items.reduce((acc, i) => acc + i.precio_unitario * i.cantidad, 0),
    );
    const descuentoPorcentaje = await obtenerDescuentoJuego(pedido.id);
    const { descuentoMonto } = calcularTotales(subtotal, descuentoPorcentaje, 0);

    const { data, error } = await supabase
      .from(TABLA)
      .insert({
        pedido_id: pedido.id,
        mesa_id: mesaId,
        cliente_id: clienteId,
        mesa_numero: pedido.mesas?.numero ?? 0,
        cliente_nombre: clienteNombre,
        estado: 'solicitada',
        subtotal,
        descuento_porcentaje: descuentoPorcentaje,
        descuento_monto: descuentoMonto,
      })
      .select()
      .single();

    if (error) return { exito: false, error: error.message };
    return { exito: true, datos: { cuenta: normalizarCuenta(data), items, nueva: true } };
  } catch (e) {
    return { exito: false, error: mensajeError(e, 'No se pudo solicitar la cuenta.') };
  }
}

export async function obtenerUltimaCuentaCliente(clienteId: string): Promise<Resultado<Cuenta | null>> {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .select('*')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return { exito: false, error: error.message };
    return { exito: true, datos: data ? normalizarCuenta(data) : null };
  } catch (e) {
    return { exito: false, error: mensajeError(e, 'No se pudo consultar la cuenta.') };
  }
}

export async function obtenerCuentaPorId(cuentaId: string): Promise<Resultado<Cuenta>> {
  const { data, error } = await supabase.from(TABLA).select('*').eq('id', cuentaId).single();
  if (error) return { exito: false, error: error.message };
  return { exito: true, datos: normalizarCuenta(data) };
}

export async function aplicarPropina(cuenta: Cuenta, nivel: NivelPropina): Promise<Resultado<Cuenta>> {
  if (cuenta.estado !== 'solicitada') {
    return { exito: false, error: 'La cuenta ya fue pagada, no se puede cambiar la propina.' };
  }

  const porcentaje = NIVELES_PROPINA[nivel].porcentaje;
  const { descuentoMonto, propinaMonto, total } = calcularTotales(
    cuenta.subtotal,
    cuenta.descuento_porcentaje,
    porcentaje,
  );

  const { data, error } = await supabase
    .from(TABLA)
    .update({
      propina_nivel: nivel,
      propina_porcentaje: porcentaje,
      propina_monto: propinaMonto,
      descuento_monto: descuentoMonto,
      total,
    })
    .eq('id', cuenta.id)
    .eq('estado', 'solicitada')
    .select()
    .single();

  if (error) return { exito: false, error: error.message };
  return { exito: true, datos: normalizarCuenta(data) };
}

export async function pagarCuenta(cuenta: Cuenta, metodo: MetodoPago): Promise<Resultado<Cuenta>> {
  if (cuenta.propina_porcentaje == null || cuenta.total == null) {
    return { exito: false, error: 'Primero escaneá el QR de propina.' };
  }

  const { data, error } = await supabase
    .from(TABLA)
    .update({
      estado: 'pagada',
      metodo_pago: metodo,
      pagada_at: new Date().toISOString(),
    })
    .eq('id', cuenta.id)
    .eq('estado', 'solicitada')
    .select()
    .maybeSingle();

  if (error) return { exito: false, error: error.message };
  if (!data) return { exito: false, error: 'La cuenta ya había sido pagada.' };
  return { exito: true, datos: normalizarCuenta(data) };
}

export async function obtenerCuentasAbiertas(): Promise<Resultado<Cuenta[]>> {
  const { data, error } = await supabase
    .from(TABLA)
    .select('*')
    .in('estado', ['solicitada', 'pagada'])
    .order('created_at', { ascending: true });

  if (error) return { exito: false, error: error.message };
  return { exito: true, datos: (data ?? []).map(normalizarCuenta) };
}

export async function confirmarPagoYLiberarMesa(
  cuenta: Cuenta,
  mozoId: string,
): Promise<Resultado<Cuenta>> {
  try {
    if (cuenta.estado !== 'pagada') {
      return { exito: false, error: 'El cliente todavía no realizó el pago.' };
    }

    if (cuenta.cliente_id) {
      const { error: errorEspera } = await supabase
        .from('lista_espera')
        .update({ estado: 'cerrado' })
        .eq('cliente_id', cuenta.cliente_id)
        .eq('mesa_asignada_id', cuenta.mesa_id)
        .in('estado', ['asignado', 'vinculado']);

      if (errorEspera) return { exito: false, error: errorEspera.message };
    }

    const { error: errorMesa } = await supabase
      .from('mesas')
      .update({ disponibilidad: 'vacia' })
      .eq('id', cuenta.mesa_id);

    if (errorMesa) return { exito: false, error: errorMesa.message };

    const { data, error } = await supabase
      .from(TABLA)
      .update({
        estado: 'confirmada',
        confirmada_at: new Date().toISOString(),
        confirmada_por: mozoId,
      })
      .eq('id', cuenta.id)
      .eq('estado', 'pagada')
      .select()
      .maybeSingle();

    if (error) return { exito: false, error: error.message };
    if (!data) return { exito: false, error: 'Otro mozo ya confirmó este pago.' };
    return { exito: true, datos: normalizarCuenta(data) };
  } catch (e) {
    return { exito: false, error: mensajeError(e, 'No se pudo confirmar el pago.') };
  }
}

export async function consultarMesaPorQr(data: string) {
  let mesaId: string | null = null;
  try {
    const parsed = JSON.parse(data);
    mesaId = parsed.mesaId ?? parsed.id ?? null;
  } catch {
    mesaId = data.trim();
  }

  if (!mesaId) return { exito: false, error: 'El código escaneado no es de una mesa.' } as const;

  const { data: mesa, error } = await supabase
    .from('mesas')
    .select('id, numero, tipo, comensales, disponibilidad')
    .eq('id', mesaId)
    .maybeSingle();

  if (error || !mesa) return { exito: false, error: 'El código escaneado no es de una mesa.' } as const;
  return { exito: true, datos: mesa } as const;
}

export const formatearPesos = (n: number | null | undefined) =>
  `$${Number(n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const formatearFechaHora = (iso: string | null | undefined) => {
  if (!iso) return '';
  const d = new Date(iso);
  const fecha = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  const hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${fecha} ${hora}`;
};
