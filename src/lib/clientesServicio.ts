import { supabase } from "@/lib/supabase";
import { enviarMailCliente } from "@/servicesJ/emailService";
import type { ClienteEstado } from "@/types/database";

export type Cliente = {
  id: string;
  nombres: string;
  apellidos: string;
  email?: string | null;
  foto_url: string;
  estado: ClienteEstado;
  created_at: string;
};

export const clientesService = {
  async listarPendientes(): Promise<Cliente[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nombres, apellidos, email, foto_url, estado, created_at")
      .eq("perfil", "cliente_registrado")
      .eq("estado", "pendiente")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data as Cliente[];
  },

  async resolver(id: string, estado: ClienteEstado): Promise<void> {
    const { data: cliente, error: fetchError } = await supabase
      .from("profiles")
      .select("nombres, apellidos, email")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const { error } = await supabase.from("profiles").update({ estado }).eq("id", id);
    if (error) throw error;

    if (cliente?.email) {
      await enviarMailCliente({
        email: cliente.email,
        nombres: cliente.nombres,
        apellidos: cliente.apellidos,
        estado: estado as "aprobado" | "rechazado",
      });
    }
  },
};