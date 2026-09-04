export interface IProductFormData {
  nombre: string;
  descripcion: string;
  tiempo_elaboracion: number;
  precio: number;
  fotos: [string, string, string];
}