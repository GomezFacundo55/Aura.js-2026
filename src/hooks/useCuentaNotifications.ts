import { useEffect, useRef } from "react";

import { useToast } from "@/contextJ/Toast";
import type { UserProfile } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { notificarCuenta, pedirPermisosNotificaciones } from "@/lib/notificaciones";
import { SoundService } from "@/servicesJ/soundService";
import { formatearPesos } from "@/servicesJ/cuentaService";
import type { Cuenta } from "@/interfaces/ICuenta";

const TOPIC = "notificaciones_cuentas_general";

const normalizarRol = (rol?: string | null) =>
  String(rol ?? "").trim().toLowerCase().replace("dueno", "dueño");

export function useCuentaNotifications(currentProfile?: UserProfile | null) {
  const { showToast } = useToast();
  const profileRef = useRef<UserProfile | null>(currentProfile ?? null);

  useEffect(() => {
    profileRef.current = currentProfile ?? null;
  }, [currentProfile]);

  useEffect(() => {
    pedirPermisosNotificaciones();
  }, []);

  useEffect(() => {
    const avisar = async (titulo: string, cuerpo: string, tipo: "info" | "success") => {
      await SoundService.reproducir(tipo === "success" ? "exito" : "info");
      notificarCuenta(titulo, cuerpo);
      showToast(tipo, titulo, cuerpo);
    };

    const canalExistente = supabase
      .getChannels()
      .find((c) => c.topic === `realtime:${TOPIC}`);
    if (canalExistente) supabase.removeChannel(canalExistente);

    const canal = supabase
      .channel(TOPIC)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "cuentas" },
        async (payload) => {
          const cuenta = payload.new as Cuenta;
          const perfil = profileRef.current;
          if (!perfil || !cuenta?.id) return;

          if (normalizarRol(perfil.perfil) === "mozo") {
            await avisar(
              `🧾 Mesa ${cuenta.mesa_numero} pide la cuenta`,
              `${cuenta.cliente_nombre ?? "Un cliente"} solicitó la cuenta.`,
              "info",
            );
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "cuentas" },
        async (payload) => {
          const cuenta = payload.new as Cuenta;
          const perfil = profileRef.current;
          if (!perfil || !cuenta?.id) return;

          const rol = normalizarRol(perfil.perfil);

          if (cuenta.estado === "pagada" && ["mozo", "dueño", "supervisor"].includes(rol)) {
            await avisar(
              `💳 Mesa ${cuenta.mesa_numero} pagó ${formatearPesos(cuenta.total)}`,
              rol === "mozo"
                ? "Confirmá el pago para liberar la mesa."
                : `${cuenta.cliente_nombre ?? "El cliente"} realizó el pago. Esperando confirmación del mozo.`,
              "info",
            );
            return;
          }

          if (cuenta.estado === "confirmada") {
            if (["dueño", "supervisor"].includes(rol)) {
              await avisar(
                `✅ Pago confirmado - Mesa ${cuenta.mesa_numero}`,
                `El mozo confirmó el pago de ${formatearPesos(cuenta.total)}. La mesa quedó libre.`,
                "success",
              );
            } else if (cuenta.cliente_id === perfil.id) {
              await avisar(
                "✅ ¡Pago confirmado!",
                "El mozo confirmó tu pago. ¡Gracias por tu visita!",
                "success",
              );
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [showToast]);
}
