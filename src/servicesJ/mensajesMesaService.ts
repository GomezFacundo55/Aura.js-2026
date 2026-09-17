import { supabase } from "./supabaseConexion";

const TABLA = "mensajes_mesa";

export type RolMensajeMesa = "cliente" | "mozo";

export type MensajeMesa = {
  id: string;
  mesa_id: string;
  remitente_id: string;
  remitente_rol: RolMensajeMesa;
  contenido: string;
  created_at: string;
};

/**
 * Obtiene todos los mensajes de una mesa ordenados cronológicamente (created_at ascendente).
 */
export async function obtenerMensajesDeMesa(
  mesaId: string
): Promise<{ exito: boolean; datos?: MensajeMesa[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .select("*")
      .eq("mesa_id", mesaId)
      .order("created_at", { ascending: true });

    if (error) {
      return {
        exito: false,
        error: error.message,
      };
    }

    return {
      exito: true,
      datos: (data as MensajeMesa[]) ?? [],
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Error al obtener mensajes de la mesa";
    return {
      exito: false,
      error: errorMsg,
    };
  }
}

/**
 * Inserta un nuevo mensaje en la sala compartida de la mesa.
 */
export async function enviarMensaje(
  mesaId: string,
  remitenteId: string,
  remitenteRol: RolMensajeMesa,
  contenido: string
): Promise<{ exito: boolean; datos?: MensajeMesa; error?: string }> {
  try {
    const textoLimpio = contenido.trim();
    if (!textoLimpio) {
      return {
        exito: false,
        error: "El contenido del mensaje no puede estar vacío.",
      };
    }

    const { data, error } = await supabase
      .from(TABLA)
      .insert({
        mesa_id: mesaId,
        remitente_id: remitenteId,
        remitente_rol: remitenteRol,
        contenido: textoLimpio,
      })
      .select()
      .single();

    if (error) {
      return {
        exito: false,
        error: error.message,
      };
    }

    return {
      exito: true,
      datos: data as MensajeMesa,
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Error inesperado al enviar el mensaje";
    return {
      exito: false,
      error: errorMsg,
    };
  }
}
