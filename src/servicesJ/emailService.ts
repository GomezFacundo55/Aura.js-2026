    // src/servicesJ/emailService.ts

    import { supabase } from "@/lib/supabase";

    export type EstadoClienteEmail = "aprobado" | "rechazado";

    type EnviarMailClienteInput = {
    email: string;
    nombres: string;
    apellidos: string;
    estado: EstadoClienteEmail;
    };

    export async function enviarMailCliente(input: EnviarMailClienteInput): Promise<{ error: string | null }> {
    try {
        const { data, error } = await supabase.functions.invoke("enviar-mail-cliente", {
        body: input,
        });

        if (error) {
        console.warn("Error al enviar mail al cliente:", error.message);
        return { error: error.message };
        }

        if (data?.error) {
        console.warn("Error devuelto por la Edge Function:", data.error);
        return { error: JSON.stringify(data.error) };
        }

        return { error: null };
    } catch (err) {
        console.warn("Excepción al invocar enviar-mail-cliente:", err);
        return { error: String(err) };
    }
    }