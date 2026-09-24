export type CalificacionEncuesta = 1 | 2 | 3 | 4 | 5;

export interface EncuestaInput {
    listaEsperaId: string;
    clienteId: string;
    mesaId: string;
    calificacionAtencion: CalificacionEncuesta;
    calificacionComida: CalificacionEncuesta;
    calificacionTiempoEspera: CalificacionEncuesta;
    calificacionLimpieza: CalificacionEncuesta;
    comentario?: string;
}

export interface EncuestaRow {
    id: string;
    lista_espera_id: string;
    cliente_id: string;
    mesa_id: string;
    calificacion_atencion: number;
    calificacion_comida: number;
    calificacion_tiempo_espera: number;
    calificacion_limpieza: number;
    comentario: string | null;
    created_at: string;
}


export interface GraficoAtencionStats {
    distribucion: { estrella: number; cantidad: number; porcentaje: number }[];
    promedio: number;
    total: number;
}

export interface ReaccionComidaItem {
    id: 'regular' | 'bueno' | 'excelente';
    emoji: string;
    label: string;
    color: string;
    cantidad: number;
    porcentaje: number;
}

export interface GraficoComidaStats {
    reacciones: ReaccionComidaItem[];
    total: number;
    reaccionPredominante?: ReaccionComidaItem;
}

export interface TiempoEsperaItem {
    nivel: number;
    label: string;
    descripcion: string;
    cantidad: number;
    porcentaje: number;
}

export interface GraficoTiempoStats {
    promedio: number;
    velocidadPromedioLabel: string;
    distribucion: TiempoEsperaItem[];
    total: number;
}

export interface LikertNivelItem {
    nivel: number;
    label: string;
    color: string;
    cantidad: number;
    porcentaje: number;
}

export interface GraficoLimpiezaStats {
    niveles: LikertNivelItem[];
    total: number;
    desacuerdoPorcentaje: number;
    desacuerdoCantidad: number;
    neutroPorcentaje: number;
    neutroCantidad: number;
    acuerdoPorcentaje: number;
    acuerdoCantidad: number;
    promedio: number;
}

export interface EstadisticasDetalladasEncuestas {
    atencion: GraficoAtencionStats;
    comida: GraficoComidaStats;
    tiempoEspera: GraficoTiempoStats;
    limpieza: GraficoLimpiezaStats;
    totalEncuestas: number;
}