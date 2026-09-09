export type EstadoListaEspera = "en_espera" | "asignado" | "cancelado" | "cerrado";

export interface IListaDeEspera{
    id: string,
    cliente_id: string,
    estado: EstadoListaEspera;
    mesa_asignada_id: string | null,
    created_at?: string;
}