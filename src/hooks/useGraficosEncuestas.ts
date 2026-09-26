import { useCallback, useEffect, useState } from 'react';
import {
    obtenerEstadisticasDetalladas,
} from '../servicesJ/encuestas';
import {
    EstadisticasDetalladasEncuestas,
} from '../types/encuesta';

export function useEstadisticasDetalladas() {
    const [data, setData] = useState<EstadisticasDetalladasEncuestas | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const ejecutarCarga = useCallback(async () => {
        try {
            const stats = await obtenerEstadisticasDetalladas();
            setData(stats);
            setError(null);
        } catch (e) {
            console.error('Error al cargar estadísticas detalladas:', e);
            setError('No pudimos cargar las estadísticas de encuestas.');
        } finally {
            setCargando(false);
        }
    }, []);

    const recargar = useCallback(() => {
        setCargando(true);
        ejecutarCarga();
    }, [ejecutarCarga]);

    useEffect(() => {
        let activo = true;
        obtenerEstadisticasDetalladas()
            .then((stats) => {
                if (activo) {
                    setData(stats);
                    setError(null);
                    setCargando(false);
                }
            })
            .catch((e) => {
                if (activo) {
                    console.error('Error al cargar estadísticas detalladas:', e);
                    setError('No pudimos cargar las estadísticas de encuestas.');
                    setCargando(false);
                }
            });
        return () => {
            activo = false;
        };
    }, []);

    return { data, cargando, error, recargar };
}

export function useGraficoAtencion() {
    const { data, cargando, error, recargar } = useEstadisticasDetalladas();
    return { data: data?.atencion ?? null, totalEncuestas: data?.totalEncuestas ?? 0, cargando, error, recargar };
}

export function useGraficoComida() {
    const { data, cargando, error, recargar } = useEstadisticasDetalladas();
    return { data: data?.comida ?? null, totalEncuestas: data?.totalEncuestas ?? 0, cargando, error, recargar };
}

export function useGraficoTiempoEspera() {
    const { data, cargando, error, recargar } = useEstadisticasDetalladas();
    return { data: data?.tiempoEspera ?? null, totalEncuestas: data?.totalEncuestas ?? 0, cargando, error, recargar };
}

export function useGraficoLimpieza() {
    const { data, cargando, error, recargar } = useEstadisticasDetalladas();
    return { data: data?.limpieza ?? null, totalEncuestas: data?.totalEncuestas ?? 0, cargando, error, recargar };
}