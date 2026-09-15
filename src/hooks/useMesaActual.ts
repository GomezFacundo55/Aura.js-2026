import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type EstadoMesa = "sin_mesa" | "en_espera" | "asignada";

export type MesaActual = {
  id: string;
  numero: number;
};

type ListaEsperaRow = {
  id: string;
  cliente_id: string;
  mesa_asignada_id: string | null;
  estado: "en_espera" | "asignado";
  mesas: { id: string; numero: number } | null;
};

/**
 * Mesa asignada al cliente (según lista_espera + mesas), con actualización
 * en tiempo real cuando el metre le asigna una mesa.
 *
 * NOTA: esto sólo refleja la asignación hecha en la base (punto 10).
 * El vínculo "el cliente ya escaneó el QR físico de esa mesa" es un estado
 * aparte, que se maneja en el componente (todavía no persiste en la DB).
 */
export function useMesaActual(clienteId: string | null | undefined) {
  const [mesa, setMesa] = useState<MesaActual | null>(null);
  const [estadoMesa, setEstadoMesa] = useState<EstadoMesa>("sin_mesa");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const aplicarFila = useCallback((fila: ListaEsperaRow | null) => {
    if (!fila) {
      setMesa(null);
      setEstadoMesa("sin_mesa");
      return;
    }

    if (fila.estado === "asignado" && fila.mesas) {
      setMesa({ id: fila.mesas.id, numero: fila.mesas.numero });
      setEstadoMesa("asignada");
    } else {
      setMesa(null);
      setEstadoMesa("en_espera");
    }
  }, []);

  const fetchMesaActual = useCallback(async () => {
    if (!clienteId) {
      setMesa(null);
      setEstadoMesa("sin_mesa");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Se toma el turno activo más reciente del cliente (en_espera o ya asignado)
    const { data, error: err } = await supabase
      .from("lista_espera")
      .select("id, cliente_id, mesa_asignada_id, estado, mesas:mesa_asignada_id(id, numero)")
      .eq("cliente_id", clienteId)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (err) {
      setError("No se pudo consultar el estado de tu mesa.");
      setLoading(false);
      return;
    }

    aplicarFila(data as unknown as ListaEsperaRow | null);
    setLoading(false);
  }, [clienteId, aplicarFila]);

  useEffect(() => {
    fetchMesaActual();

    if (!clienteId) return;

    // Realtime: apenas el metre actualiza el registro (estado -> asignado, mesa_asignada_id -> X),
    // este hook se entera solo, sin polling.
    const canal = supabase
      .channel(`lista_espera_cliente_${clienteId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lista_espera",
          filter: `cliente_id=eq.${clienteId}`,
        },
        () => {
          // Se vuelve a pedir la fila con el join a mesas (el payload del evento no trae el join)
          fetchMesaActual();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [clienteId, fetchMesaActual]);

  return {
    mesa,
    estadoMesa,
    loading,
    error,
    tieneMesa: estadoMesa === "asignada",
    refetch: fetchMesaActual,
  };
}
