import { supabase } from '../lib/supabase'; 
import {
  EncuestaInput,
  EncuestaRow,
  EstadisticasDetalladasEncuestas,
} from '../types/encuesta';

export const ENCUESTA_UNIQUE_VIOLATION = '23505';

export async function puedeResponderEncuesta(listaEsperaId: string): Promise<boolean> {
    if (!listaEsperaId) return false;

    const { data: espera, error: errorEspera } = await supabase
        .from('lista_espera')
        .select('id, estado')
        .eq('id', listaEsperaId)
        .maybeSingle();

    if (errorEspera) throw errorEspera;
    if (!espera || espera.estado !== 'vinculado') return false;

    const { data: encuesta, error: errorEncuesta } = await supabase
        .from('encuestas')
        .select('id')
        .eq('lista_espera_id', listaEsperaId)
        .maybeSingle();

    if (errorEncuesta) throw errorEncuesta;
    return !encuesta;
}

export async function crearEncuesta(input: EncuestaInput): Promise<EncuestaRow> {
    const { data, error } = await supabase
        .from('encuestas')
        .insert({
        lista_espera_id: input.listaEsperaId,
        cliente_id: input.clienteId,
        mesa_id: input.mesaId,
        calificacion_atencion: input.calificacionAtencion,
        calificacion_comida: input.calificacionComida,
        calificacion_tiempo_espera: input.calificacionTiempoEspera,
        calificacion_limpieza: input.calificacionLimpieza,
        comentario: input.comentario ?? null,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}


export async function obtenerTodasLasEncuestas(): Promise<EncuestaRow[]> {
    const { data, error } = await supabase
        .from('encuestas')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
}

export async function obtenerEstadisticasDetalladas(): Promise<EstadisticasDetalladasEncuestas> {
    const rows = await obtenerTodasLasEncuestas();
    const total = rows.length;

    // 1. Calidad de Atención (Estrellas 1 a 5)
    const conteoAtencion: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sumaAtencion = 0;

    // 2. Calidad de la Comida (Reacciones 😐, 😊, 😍)
    let countComidaRegular = 0;
    let countComidaBueno = 0;
    let countComidaExcelente = 0;

    // 3. Tiempo de Espera (Slider 1 a 5)
    const conteoTiempo: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sumaTiempo = 0;

    // 4. Limpieza (Likert 1 a 5)
    const conteoLimpieza: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sumaLimpieza = 0;

    for (const r of rows) {
        // Atención
        const at = Math.min(5, Math.max(1, Math.round(r.calificacion_atencion || 0)));
        if (at >= 1 && at <= 5) {
            conteoAtencion[at] = (conteoAtencion[at] || 0) + 1;
            sumaAtencion += r.calificacion_atencion;
        }

        // Comida: compatible con escala 1..3 y 1..5
        const c = Number(r.calificacion_comida);
        if (c <= 2) {
            countComidaRegular++;
        } else if (c === 3 || c === 4) {
            countComidaBueno++;
        } else {
            countComidaExcelente++;
        }

        // Tiempo de espera
        const t = Math.min(5, Math.max(1, Math.round(r.calificacion_tiempo_espera || 3)));
        conteoTiempo[t] = (conteoTiempo[t] || 0) + 1;
        sumaTiempo += r.calificacion_tiempo_espera || 3;

        // Limpieza
        const l = Math.min(5, Math.max(1, Math.round(r.calificacion_limpieza || 3)));
        conteoLimpieza[l] = (conteoLimpieza[l] || 0) + 1;
        sumaLimpieza += r.calificacion_limpieza || 3;
    }

    // Cálculos de Atención
    const distribucionAtencion = [1, 2, 3, 4, 5].map((estrella) => {
        const cantidad = conteoAtencion[estrella] || 0;
        const porcentaje = total > 0 ? Math.round((cantidad / total) * 100) : 0;
        return { estrella, cantidad, porcentaje };
    });
    const promedioAtencion = total > 0 ? Number((sumaAtencion / total).toFixed(1)) : 0;

    // Cálculos de Comida
    const reaccionesComida = [
        {
            id: 'regular' as const,
            emoji: '😐',
            label: 'Regular',
            color: '#F59E0B',
            cantidad: countComidaRegular,
            porcentaje: total > 0 ? Math.round((countComidaRegular / total) * 100) : 0,
        },
        {
            id: 'bueno' as const,
            emoji: '😊',
            label: 'Bueno',
            color: '#3B82F6',
            cantidad: countComidaBueno,
            porcentaje: total > 0 ? Math.round((countComidaBueno / total) * 100) : 0,
        },
        {
            id: 'excelente' as const,
            emoji: '😍',
            label: 'Excelente',
            color: '#10B981',
            cantidad: countComidaExcelente,
            porcentaje: total > 0 ? Math.round((countComidaExcelente / total) * 100) : 0,
        },
    ];
    const reaccionPredominante = [...reaccionesComida].sort((a, b) => b.cantidad - a.cantidad)[0];

    // Cálculos de Tiempo
    const descripcionesTiempo: Record<number, { label: string; descripcion: string }> = {
        1: { label: 'Muy rápido', descripcion: '< 15 min' },
        2: { label: 'Rápido', descripcion: '15-25 min' },
        3: { label: 'Normal', descripcion: '25-40 min' },
        4: { label: 'Lento', descripcion: '40-55 min' },
        5: { label: 'Muy lento', descripcion: '> 55 min' },
    };
    const distribucionTiempo = [1, 2, 3, 4, 5].map((nivel) => {
        const cantidad = conteoTiempo[nivel] || 0;
        const porcentaje = total > 0 ? Math.round((cantidad / total) * 100) : 0;
        return {
            nivel,
            label: descripcionesTiempo[nivel].label,
            descripcion: descripcionesTiempo[nivel].descripcion,
            cantidad,
            porcentaje,
        };
    });
    const promedioTiempo = total > 0 ? Number((sumaTiempo / total).toFixed(1)) : 0;
    let velocidadPromedioLabel = 'Normal';
    if (promedioTiempo > 0 && promedioTiempo <= 1.8) velocidadPromedioLabel = 'Muy rápido';
    else if (promedioTiempo <= 2.6) velocidadPromedioLabel = 'Rápido';
    else if (promedioTiempo <= 3.4) velocidadPromedioLabel = 'Normal';
    else if (promedioTiempo <= 4.2) velocidadPromedioLabel = 'Demorado';
    else if (promedioTiempo > 4.2) velocidadPromedioLabel = 'Muy lento';

    // Cálculos de Limpieza (Likert Divergente)
    const configLimpieza: Record<number, { label: string; color: string }> = {
        1: { label: 'Muy sucio', color: '#EF4444' },
        2: { label: 'Sucio', color: '#F97316' },
        3: { label: 'Regular', color: '#94A3B8' },
        4: { label: 'Limpio', color: '#10B981' },
        5: { label: 'Muy limpio', color: '#059669' },
    };
    const nivelesLimpieza = [1, 2, 3, 4, 5].map((nivel) => {
        const cantidad = conteoLimpieza[nivel] || 0;
        const porcentaje = total > 0 ? Math.round((cantidad / total) * 100) : 0;
        return {
            nivel,
            label: configLimpieza[nivel].label,
            color: configLimpieza[nivel].color,
            cantidad,
            porcentaje,
        };
    });
    const desacuerdoCantidad = (conteoLimpieza[1] || 0) + (conteoLimpieza[2] || 0);
    const neutroCantidad = conteoLimpieza[3] || 0;
    const acuerdoCantidad = (conteoLimpieza[4] || 0) + (conteoLimpieza[5] || 0);

    const desacuerdoPorcentaje = total > 0 ? Math.round((desacuerdoCantidad / total) * 100) : 0;
    const neutroPorcentaje = total > 0 ? Math.round((neutroCantidad / total) * 100) : 0;
    const acuerdoPorcentaje = total > 0 ? Math.round((acuerdoCantidad / total) * 100) : 0;
    const promedioLimpieza = total > 0 ? Number((sumaLimpieza / total).toFixed(1)) : 0;

    return {
        totalEncuestas: total,
        atencion: {
            distribucion: distribucionAtencion,
            promedio: promedioAtencion,
            total,
        },
        comida: {
            reacciones: reaccionesComida,
            total,
            reaccionPredominante,
        },
        tiempoEspera: {
            promedio: promedioTiempo,
            velocidadPromedioLabel,
            distribucion: distribucionTiempo,
            total,
        },
        limpieza: {
            niveles: nivelesLimpieza,
            total,
            desacuerdoPorcentaje,
            desacuerdoCantidad,
            neutroPorcentaje,
            neutroCantidad,
            acuerdoPorcentaje,
            acuerdoCantidad,
            promedio: promedioLimpieza,
        },
    };
}