import { IProductFormData } from "./IProductoForm";
export interface IProductoPedido extends IProductFormData {
  id: string;
  createdAt?: string;
}