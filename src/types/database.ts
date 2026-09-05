export type MesaTipo = 'vip' | 'estandar' | 'movilidad_reducida';
export type MesaDisponibilidad = 'vacia' | 'ocupada' | 'reservada';
export type ClienteEstado = 'pendiente' | 'aprobado' | 'rechazado';

export interface Mesa {
  id: string;
  numero: number;
  comensales: number;
  tipo: MesaTipo;
  disponibilidad: MesaDisponibilidad;
  foto_url: string;
  qr_data: string;
  created_at: string;
}

export interface Cliente {
  id: string;
  nombres: string;
  apellidos: string;
  foto_url: string;
  estado: ClienteEstado;
  created_at: string;
}