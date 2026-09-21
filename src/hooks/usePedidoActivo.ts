import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/servicesJ/supabaseConexion";
import { obtenerPedidoActivoPorMesa } from "@/servicesJ/pedidoService";
import type { PedidoConItems } from "@/interfaces/IPedido";

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
      setPedido(undefined);
    } else {
      setPedido(datos ?? undefined);
    }

    setLoading(false);
  }, [mesaId]);

  useEffect(() => {
    fetchPedido();
  }, [fetchPedido]);

  useEffect(() => {
    if (!mesaId) return;

    const channelName = `pedidos_mesa_${mesaId}`;

    // 1. Si ya existe un canal con ese nombre en la memoria del cliente, removerlo primero
    const existingChannel = supabase.getChannels().find((c) => c.topic === `realtime:${channelName}`);
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }

    // 2. Crear y configurar el nuevo canal ANTES de suscribirse
    const canal = supabase
      .channel(channelName)
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
      );

    // 3. Suscribirse
    canal.subscribe();

    // 4. Cleanup seguro al desmontar o cambiar de mesaId
    return () => {
      supabase.removeChannel(canal);
    };
  }, [mesaId, fetchPedido]);

  return { pedido, loading, error, refetch: fetchPedido };
}