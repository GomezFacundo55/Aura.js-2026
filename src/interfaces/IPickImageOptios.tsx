export type ImageSourceOption = "camera" | "gallery";

export interface IPickImageOptions{
    source: ImageSourceOption;
    aspect?: [number, number];
    quality?: number;
    allowsEditing?: boolean;
}