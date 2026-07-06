export type SliderProps = {
  value: number;
  max: number;
  min?: number;
  onValueChange: (value: number) => void;
};
