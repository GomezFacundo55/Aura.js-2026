import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/servicesJ/supabaseConexion";
import { obtenerPedidoActivoPorMesa } from "@/servicesJ/pedidoService";
import type { PedidoConItems } from "@/interfaces/IPedido";

/**
 * Trae el pedido activo (no entregado) de una mesa, con actualización
 * en tiempo real cuando el mozo confirma, rechaza o cambia su estado
 * (puntos 12 y 13).
 */
export function usePedidoActivo(mesaId: string | null | undefined) {
  const [pedido, setPedido] = useState<PedidoConItems | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPedido = useCallback(async () => {
    if (!mesaId) {
      setPedido(undefined);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { exito, datos, error: err } = await obtenerPedidoActivoPorMesa(mesaId);

    if (!exito) {
      setError(err || "No se pudo consultar el pedido de la mesa.");
      setLoading(false);
      return;
    }

    setPedido(datos ?? undefined);
    setLoading(false);
  }, [mesaId]);

  useEffect(() => {
    fetchPedido();

    if (!mesaId) return;

    const canal = supabase
      .channel(`pedidos_mesa_${mesaId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pedidos",
          filter: `mesa_id=eq.${mesaId}`,
        },
        () => {
          fetchPedido();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [mesaId, fetchPedido]);

  return { pedido, loading, error, refetch: fetchPedido };
}
