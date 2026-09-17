import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "expo-router";

import { useToast } from "@/contextJ/Toast";
import { getMyProfile, type UserProfile } from "@/lib/auth";
import { notificarNuevoMensajeChat, pedirPermisosNotificaciones } from "@/lib/notificaciones";
import { SoundService } from "@/servicesJ/soundService";
import { supabase } from "@/servicesJ/supabaseConexion";
import type { MensajeMesa } from "@/servicesJ/mensajesMesaService";

const ROLES_STAFF = new Set(["mozo", "dueño", "dueno", "supervisor"]);
const TOPIC_NOTIFICACIONES_CHAT = "notificaciones_chat_general";

export function useChatNotifications(currentProfile?: UserProfile | null) {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();

  const profileRef = useRef<UserProfile | null>(currentProfile ?? null);
  const pathnameRef = useRef<string>(pathname);

  // Mantener actualizadas las referencias para el callback de Realtime
  useEffect(() => {
    profileRef.current = currentProfile ?? null;
  }, [currentProfile]);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // Si no se proporcionó perfil desde el exterior, cargarlo
  useEffect(() => {
    if (!profileRef.current) {
      getMyProfile().then((p) => {
        if (p) profileRef.current = p;
      });
    }
  }, []);

  // Solicitar permisos de notificación nativa una vez al montar
  useEffect(() => {
    pedirPermisosNotificaciones();
  }, []);

  // Suscripción Realtime a nuevos mensajes
  useEffect(() => {
    const canalExistente = supabase
      .getChannels()
      .find((c) => c.topic === `realtime:${TOPIC_NOTIFICACIONES_CHAT}`);
    if (canalExistente) {
      supabase.removeChannel(canalExistente);
    }

    const canal = supabase
      .channel(TOPIC_NOTIFICACIONES_CHAT)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensajes_mesa",
        },
        async (payload) => {
          const nuevoMensaje = payload.new as MensajeMesa;
          if (!nuevoMensaje || !nuevoMensaje.id) return;

          const perfilActivo = profileRef.current;
          if (!perfilActivo || !perfilActivo.id) return;

          // 1. Descartar si el mensaje fue enviado por el propio usuario
          if (nuevoMensaje.remitente_id === perfilActivo.id) return;

          const remitenteRol = (nuevoMensaje.remitente_rol ?? "").toLowerCase();
          const esRemitenteStaff = ROLES_STAFF.has(remitenteRol);
          const esRemitenteCliente = remitenteRol === "cliente" || !esRemitenteStaff;

          const miRol = (perfilActivo.perfil ?? "").toLowerCase();
          const soyStaff = ROLES_STAFF.has(miRol);
          const soyCliente = !soyStaff;

          // Regla:
          // A los clientes les debe llegar cuando un mozo/dueño/supervisor envía.
          // Al staff (mozo/dueño/supervisor) les debe llegar cuando un cliente envía.
          const debeNotificarACliente = soyCliente && esRemitenteStaff;
          const debeNotificarAStaff = soyStaff && esRemitenteCliente;

          if (!debeNotificarACliente && !debeNotificarAStaff) {
            return;
          }

          // Construcción del título de la notificación
          let titulo = "";
          if (debeNotificarACliente) {
            const nombre = nuevoMensaje.remitente_nombre?.trim() || "Staff";
            const rolNormalizado =
              remitenteRol === "dueno"
                ? "Dueño"
                : remitenteRol.charAt(0).toUpperCase() + remitenteRol.slice(1);
            titulo = `💬 ${nombre} (${rolNormalizado})`;
          } else {
            const mesaTexto =
              nuevoMensaje.mesa_numero != null
                ? `Mesa ${nuevoMensaje.mesa_numero}`
                : "Cliente";
            titulo = `💬 Nuevo mensaje - ${mesaTexto}`;
          }

          const cuerpo = nuevoMensaje.contenido || "Nuevo mensaje recibido.";

          // 2. Reproducir sonido reutilizando SoundService
          await SoundService.reproducir("info");

          // 3. Notificación local del sistema
          notificarNuevoMensajeChat(titulo, cuerpo);

          // 4. Notificación visual reutilizando Toast
          showToast("info", titulo, cuerpo, {
            onPress: () => {
              const current = pathnameRef.current;
              if (current !== "/chat" && current !== "/(app)/chat") {
                router.push("/(app)/chat");
              }
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [router, showToast]);
}
