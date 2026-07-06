export const maxPositiveOrOne = (...values: number[]): number =>
  Math.max(1, ...values.filter((n) => Number.isFinite(n) && n >= 0));
