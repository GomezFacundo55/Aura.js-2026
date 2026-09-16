import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import type { RealtimeChannel } from "@supabase/supabase-js";

export type EstadoMesa = "sin_mesa" | "en_espera" | "asignada" | "vinculada";

export type MesaActual = {
  id: string;
  numero: number;
};

type ListaEsperaRow = {
  id: string;
  cliente_id: string;
  mesa_asignada_id: string | null;
  estado: "en_espera" | "asignado" | "vinculado";
  mesas: { id: string; numero: number } | null;
};

type CallbackActualizacion = () => void;

interface RegistroCanalCliente {
  canal: RealtimeChannel;
  refCount: number;
  oyentes: Set<CallbackActualizacion>;
}

// Singleton en memoria por clienteId para compartir la suscripción Realtime entre múltiples pantallas montadas
const canalesCompartidos = new Map<string, RegistroCanalCliente>();

function suscribirCambiosMesa(clienteId: string, onUpdate: CallbackActualizacion) {
  let registro = canalesCompartidos.get(clienteId);

  if (!registro) {
    const topic = `lista_espera_cliente_${clienteId}`;

    // Limpieza defensiva por si existía un canal previo colgado en Supabase
    const canalExistente = supabase
      .getChannels()
      .find((c) => c.topic === `realtime:${topic}`);
    if (canalExistente) {
      supabase.removeChannel(canalExistente);
    }

    const oyentes = new Set<CallbackActualizacion>();
    oyentes.add(onUpdate);

    const canal = supabase
      .channel(topic)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lista_espera",
          filter: `cliente_id=eq.${clienteId}`,
        },
        () => {
          // Notifica a todas las pantallas activas a la vez
          oyentes.forEach((callback) => callback());
        }
      )
      .subscribe();

    registro = { canal, refCount: 1, oyentes };
    canalesCompartidos.set(clienteId, registro);
  } else {
    // Si ya existe un canal activo para este cliente, reutilizamos la suscripción y sumamos la referencia
    registro.refCount += 1;
    registro.oyentes.add(onUpdate);
  }

  // Retorna función de limpieza para el cleanup de useEffect
  return () => {
    const reg = canalesCompartidos.get(clienteId);
    if (!reg) return;

    reg.oyentes.delete(onUpdate);
    reg.refCount -= 1;

    // Solo cerramos la suscripción Realtime cuando la última pantalla vinculada se desmonte
    if (reg.refCount <= 0) {
      supabase.removeChannel(reg.canal);
      canalesCompartidos.delete(clienteId);
    }
  };
}

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

    if (fila.estado === "vinculado" && fila.mesas) {
      setMesa({ id: fila.mesas.id, numero: fila.mesas.numero });
      setEstadoMesa("vinculada");
    } else if (fila.estado === "asignado" && fila.mesas) {
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

    // Suscripción Realtime compartida con conteo de referencias
    const desuscribir = suscribirCambiosMesa(clienteId, () => {
      fetchMesaActual();
    });

    return desuscribir;
  }, [clienteId, fetchMesaActual]);

  return {
    mesa,
    estadoMesa,
    loading,
    error,
    tieneMesa: estadoMesa === "asignada" || estadoMesa === "vinculada",
    mesaVinculada: estadoMesa === "vinculada",
    refetch: fetchMesaActual,
  };
}
