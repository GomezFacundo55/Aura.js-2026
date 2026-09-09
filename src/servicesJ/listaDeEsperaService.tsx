import { supabase } from "./supabaseConexion";
import { EstadoListaEspera, IListaDeEspera } from "@/interfaces/IlistaEspara";

const TABLA = "lista_espera";

export async function obtenerListaDeEspera() {
  try {
    const { data, error } = await supabase.from(TABLA).select("*");

    if (error) {
      return {
        exito: false,
        datos: null,
        error: error.message,
      };
    }

    return {
      exito: true,
      datos: data,
      error: null,
    };
  } catch (err: any) {
    return {
      exito: false,
      datos: null,
      error: err.message || "Error al consultar Supabase",
    };
  }
}

export async function consultarEstadoEspera(id: string) {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .select("id, estado, mesa_asignada_id")
      .eq("id", id)
      .single();

    if (error) {
      return { exito: false, datos: null, error: error.message };
    }

    return { exito: true, datos: data, error: null };
  } catch (err: any) {
    return { exito: false, datos: null, error: err.message };
  }
}

export async function consultarClienteEnListaDeEspera(id_cliente: string){
    try {
    const { data, error } = await supabase
      .from(TABLA)
      .select("id, estado, mesa_asignada_id")
      .eq("cliente_id", id_cliente)
      .in("estado", ["en_espera", "asignado"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { exito: false, datos: null, error: error.message };
    }

    return { exito: true, datos: data, error: null };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Error al consultar lista de espera";
    return { exito: false, datos: null, error: errorMsg };
  }
}

export async function obtenerUnaEspera(id: string) {
  try {
    const { data, error } = await supabase.from(TABLA).select("*").eq("id", id);

    if (error) {
      return {
        exito: false,
        datos: null,
        error: error.message,
      };
    }

    return {
      exito: true,
      datos: data,
      error: null,
    };
  } catch (err: any) {
    return {
      exito: false,
      datos: null,
      error: err.message || "Error al consultar Supabase",
    };
  }
}

export async function crearUnaEspera(cliente_id: string): Promise<{
  exito: boolean;
  datos: IListaDeEspera | null;
  error: string | null;
}> {
  try {
    const { data: esperaActiva, error: errorBusqueda } = await supabase
      .from(TABLA)
      .select("id, estado")
      .eq("cliente_id", cliente_id)
      .eq("estado", "en_espera")
      .maybeSingle();

    if (errorBusqueda) {
      return { exito: false, datos: null, error: errorBusqueda.message };
    }

    if (esperaActiva) {
      return {
        exito: false,
        datos: null,
        error: "Ya estás registrado en la lista de espera.",
      };
    }

    const { data, error } = await supabase
      .from(TABLA)
      .insert({
        cliente_id,
        estado: "en_espera",
        mesa_asignada_id: null,
      })
      .select()
      .single();

    if (error) {
      return { exito: false, datos: null, error: error.message };
    }

    return { exito: true, datos: data as IListaDeEspera, error: null };
  } catch (err) {
    const errorMsg =
      err instanceof Error
        ? err.message
        : "Error inesperado al crear la espera.";
    return { exito: false, datos: null, error: errorMsg };
  }
}

export async function actualizarEspera(
  id: string,
  mesa_asignada_id: string,
): Promise<{
  exito: boolean;
  datos: IListaDeEspera | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .update({
        estado: "asignado",
        mesa_asignada_id,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { exito: false, datos: null, error: error.message };
    }

    const { error: errorMesa } = await supabase
      .from("mesas")
      .update({ disponibilidad: "ocupada" })
      .eq("id", mesa_asignada_id);

    if (errorMesa) {
      console.warn(
        "No se pudo actualizar el estado de la mesa:",
        errorMesa.message,
      );
    }

    return { exito: true, datos: data as IListaDeEspera, error: null };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error
        ? err.message
        : "Error inesperado al actualizar la espera.";
    return { exito: false, datos: null, error: errorMsg };
  }
}

export async function eliminarProducto(id: string) {
  try {
    const { error } = await supabase.from(TABLA).delete().eq("id", id);

    if (error) {
      return { exito: false, error: error.message };
    }

    return { exito: true, error: null };
  } catch (err: any) {
    return {
      exito: false,
      error: err.message || "Error inesperado al eliminar",
    };
  }
}
