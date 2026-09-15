import { useCallback, useEffect, useState } from "react";
import type { IProductoPedido } from "@/interfaces/IProductoPedido";
import { obtenerProductos } from "@/servicesJ/productService";

function normalizarFotos(fotos: unknown): string[] {
  if (!Array.isArray(fotos)) return [];
  return fotos.filter((foto): foto is string => typeof foto === "string" && foto.length > 0).slice(0, 3);
}

function mapearProducto(row: IProductoPedido): IProductoPedido {
  return {
    ...row,
    fotos: normalizarFotos(row.fotos) as IProductoPedido["fotos"],
  };
}

/**
 * Trae platos y bebidas de Supabase (tablas independientes)
 * y los deja agrupados para las tabs del menú.
 */
export function useMenu() {
  const [comidas, setComidas] = useState<IProductoPedido[]>([]);
  const [bebidas, setBebidas] = useState<IProductoPedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [resPlatos, resBebidas] = await Promise.all([
      obtenerProductos("platos"),
      obtenerProductos("bebidas"),
    ]);

    if (!resPlatos.exito || !resBebidas.exito) {
      setError(resPlatos.error || resBebidas.error || "No pudimos cargar el menú.");
      setComidas([]);
      setBebidas([]);
      setLoading(false);
      return;
    }

    setComidas(((resPlatos.datos ?? []) as IProductoPedido[]).map(mapearProducto));
    setBebidas(((resBebidas.datos ?? []) as IProductoPedido[]).map(mapearProducto));
    setLoading(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { comidas, bebidas, loading, error, recargar: cargar };
}
