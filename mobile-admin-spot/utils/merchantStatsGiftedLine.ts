const clampNonNegativeFinite = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, value) : 0;

export const toGiftedLineData = (values: number[]): { value: number }[] =>
  values.map((v) => ({ value: clampNonNegativeFinite(v) }));

export const giftedLineSpacing = (width: number, padX: number, pointCount: number): number => {
  if (pointCount <= 1) {
    return 0;
  }
  const inner = Math.max(1, width - padX * 2);
  return inner / (pointCount - 1);
};

export const giftedLineMaxValue = (...groups: number[][]): number => {
  const flat = groups.flatMap((g) => g);
  const m = Math.max(0, ...flat.map(clampNonNegativeFinite));
  return Math.max(1, m);
};
