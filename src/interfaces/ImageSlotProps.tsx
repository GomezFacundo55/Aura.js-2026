export interface ImageSlotProps {
  uri: string | null;
  index: number;
  onPress: (index: number) => void;
}