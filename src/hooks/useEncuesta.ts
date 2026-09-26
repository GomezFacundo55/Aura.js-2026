import { useCallback, useEffect, useState } from 'react';
import {
    crearEncuesta,
    ENCUESTA_UNIQUE_VIOLATION,
    puedeResponderEncuesta,
} from '../servicesJ/encuestas';
import { EncuestaInput } from '../types/encuesta';

interface UseEncuestaParams {
    listaEsperaId: string;
}

export function useEncuesta({ listaEsperaId }: UseEncuestaParams) {
    const [puedeResponder, setPuedeResponder] = useState<boolean | null>(null);
    const [cargando, setCargando] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const verificarAcceso = useCallback(async () => {
        setCargando(true);
        setError(null);
        try {
            const habilitado = await puedeResponderEncuesta(listaEsperaId);
            setPuedeResponder(habilitado);
        } catch (e) {
            setError('No pudimos verificar el estado de la encuesta.');
            setPuedeResponder(false);
        } finally {
            setCargando(false);
        }
    }, [listaEsperaId]);

    useEffect(() => {
        verificarAcceso();
    }, [verificarAcceso]);

    const enviarEncuesta = useCallback(
        async (input: Omit<EncuestaInput, 'listaEsperaId'>) => {
            setEnviando(true);
            setError(null);
            try {
                await crearEncuesta({ ...input, listaEsperaId });
                setPuedeResponder(false);
                return { ok: true as const };
            } catch (e: any) {
                if (e?.code === ENCUESTA_UNIQUE_VIOLATION) {
                    setPuedeResponder(false);
                    setError('Ya completaste la encuesta para esta estadía.');
                } else {
                    setError('No pudimos enviar la encuesta. Probá de nuevo.');
                }
                return { ok: false as const };
            } finally {
                setEnviando(false);
            }
        },
        [listaEsperaId]
    );

    return { puedeResponder, cargando, enviando, error, enviarEncuesta, verificarAcceso };
}