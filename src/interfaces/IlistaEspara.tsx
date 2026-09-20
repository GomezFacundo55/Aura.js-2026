export type EstadoListaEspera = "en_espera" | "asignado" | "cancelado" | "cerrado";

export interface IListaDeEspera{
    id: string,
    cliente_id: string,
    estado: EstadoListaEspera;
    mesa_asignada_id: string | null,
    numero_mesa: number | null,
    cliente_nombre: string | null,
    created_at?: string;
}