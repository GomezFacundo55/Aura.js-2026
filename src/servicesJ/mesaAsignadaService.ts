import { supabase } from "@/lib/supabase";

export type MesaAsignadaVinculada = {
    id: string;
    cliente_id: string;
    estado: string;
    lista_espera_id: string;
    mesa_id: string | null;
};

type ResultadoMesaAsignada = {
    exito: boolean;
    datos?: MesaAsignadaVinculada | null;
    yaRespondio?: boolean;
    error?: string;
};

export async function consultarMesaAsignadaVinculada(
    clienteId: string
): Promise<ResultadoMesaAsignada> {
    try {
        const { data: espera, error: errorEspera } = await supabase
            .from("lista_espera")
            .select("id, cliente_id, estado, mesa_asignada_id")
            .eq("cliente_id", clienteId)
            .eq("estado", "vinculado")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (errorEspera) {
            return { exito: false, error: errorEspera.message };
        }

        if (!espera) {
            return { exito: true, datos: null, yaRespondio: false };
        }

        const { data: encuestaExistente, error: errorEncuesta } = await supabase
            .from("encuestas")
            .select("id")
            .eq("lista_espera_id", espera.id)
            .maybeSingle();

        if (errorEncuesta) {
            return { exito: false, error: errorEncuesta.message };
        }

        return {
            exito: true,
            datos: {
                id: espera.id,
                cliente_id: espera.cliente_id,
                estado: espera.estado,
                lista_espera_id: espera.id,
                mesa_id: espera.mesa_asignada_id,
            },
            yaRespondio: !!encuestaExistente,
        };
    } catch (e: any) {
        return { exito: false, error: e?.message ?? "Error desconocido" };
    }
}
