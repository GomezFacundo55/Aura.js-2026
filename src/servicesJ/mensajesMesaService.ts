import { supabase } from "./supabaseConexion";

const TABLA = "mensajes_mesa";
const LIMITE_HISTORIAL = 200;

// Roles que puede tener quien envía un mensaje en el chat general del salón
export type RolMensajeMesa = "cliente" | "mozo" | "dueño" | "dueno" | "supervisor";

export type MensajeMesa = {
  id: string;
  mesa_id: string | null; // Ya no se usa para el chat general (puede quedar null)
  mesa_numero: number | null; // Número de mesa del cliente remitente (null si el remitente es staff)
  remitente_id: string;
  remitente_rol: RolMensajeMesa;
  remitente_nombre: string | null; // Nombre de pila del staff remitente (null si el remitente es cliente)
  contenido: string;
  created_at: string;
};

/**
 * Obtiene el historial del chat general del salón (compartido por todas las
 * mesas y todo el staff). Trae los últimos N mensajes en orden cronológico.
 */
export async function obtenerMensajesChatGeneral(): Promise<{
  exito: boolean;
  datos?: MensajeMesa[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(LIMITE_HISTORIAL);

    if (error) {
      return { exito: false, error: error.message };
    }

    // Invertimos porque pedimos los últimos N en orden descendente
    const datosOrdenados = ((data as MensajeMesa[]) ?? []).slice().reverse();

    return { exito: true, datos: datosOrdenados };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Error al obtener los mensajes del chat";
    return { exito: false, error: errorMsg };
  }
}

/**
 * Inserta un mensaje en el chat general.
 *
 * - Cliente: se guarda su número de mesa en `mesa_id`; `remitente_nombre` va en null,
 *   porque un cliente se identifica únicamente por su mesa.
 * - Staff (mozo/dueño/supervisor): se guarda su nombre de pila en `remitente_nombre`;
 *   `mesa_id` va en null.
 */
export async function enviarMensaje(
  remitenteId: string,
  remitenteRol: RolMensajeMesa,
  contenido: string,
  datosIdentidad: { numeroMesa?: number | null; nombreRemitente?: string | null }
): Promise<{ exito: boolean; datos?: MensajeMesa; error?: string }> {
  try {
    const textoLimpio = contenido.trim();
    if (!textoLimpio) {
      return { exito: false, error: "El contenido del mensaje no puede estar vacío." };
    }

    const esCliente = remitenteRol === "cliente";

    const { data, error } = await supabase
      .from(TABLA)
      .insert({
        remitente_id: remitenteId,
        remitente_rol: remitenteRol,
        contenido: textoLimpio,
        mesa_numero: esCliente ? datosIdentidad.numeroMesa ?? null : null,
        remitente_nombre: esCliente ? null : datosIdentidad.nombreRemitente ?? null,
      })
      .select()
      .single();

    if (error) {
      return { exito: false, error: error.message };
    }

    return { exito: true, datos: data as MensajeMesa };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Error inesperado al enviar el mensaje";
    return { exito: false, error: errorMsg };
  }
}