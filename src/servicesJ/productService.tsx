import { supabase } from '../servicesJ/supabaseConexion';
import {IProductFormData} from '../interfaces/IProductoForm';

export type tabla = 'platos' | 'bebidas' | '';

export async function obtenerProductos(tabla: tabla) {
  try {
    const { data, error } = await supabase
      .from(tabla)
      .select('*');

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
      error: err.message || 'Error al consultar Supabase',
    };
  }
}

export async function obtenerUnProducto(tabla: tabla, id: string) {
  try {
    const { data, error } = await supabase
      .from(tabla)
      .select('*')
      .eq('id', id);

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
      error: err.message || 'Error al consultar Supabase',
    };
  }
}

export const verificarNombreExistente = async (tabla: string, nombre: string, idActual?: string) => {
  try {
    let query = supabase
      .from(tabla)
      .select('id, nombre')
      .ilike('nombre', nombre.trim());

    if (idActual) {
      query = query.neq('id', idActual);
    }

    const { data, error } = await query;
    if (error) throw error;

    return {
      existe: data && data.length > 0,
      datos: data,
    };
  } catch (error: any) {
    return { existe: false, error: error.message };
  }
};

export async function crearProducto(tabla: tabla, nuevoProducto: IProductFormData) {
  
  try {
    const { data, error } = await supabase
      .from(tabla) 
      .insert([nuevoProducto])
      .select()
      .single();

    if (error) {
      return { exito: false, datos: null, error: error.message };
    }

    return { exito: true, datos: data as IProductFormData, error: null };
  } catch (err: any) {
    return { exito: false, datos: null, error: err.message || 'Error inesperado al crear' };
  }
}

export async function actualizarProducto(
    tabla: tabla,
    id: string,
    datosActualizados: IProductFormData,
) {
  try {
    const { data, error } = await supabase
      .from(tabla)
      .update(datosActualizados)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { exito: false, datos: null, error: error.message };
    }

    return { exito: true, datos: data as IProductFormData, error: null };
  } catch (err: any) {
    return { exito: false, datos: null, error: err.message || 'Error inesperado al actualizar' };
  }
}


export async function eliminarProducto(tabla: tabla, id: string) {
  try {
    const { error } = await supabase
      .from(tabla)
      .delete()
      .eq('id', id);

    if (error) {
      return { exito: false, error: error.message };
    }

    return { exito: true, error: null };
  } catch (err: any) {
    return { exito: false, error: err.message || 'Error inesperado al eliminar' };
  }
}