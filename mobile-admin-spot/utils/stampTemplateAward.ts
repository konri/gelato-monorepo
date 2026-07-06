export type StampTemplateAwardParsed = {
  awardType: "visit" | "amount";
  minimumAmount: string;
};

const DEFAULT: StampTemplateAwardParsed = {
  awardType: "visit",
  minimumAmount: "20",
};

export const stampMinimumAmountDisplay = (value: number | null | undefined): string => {
  if (value == null || !Number.isFinite(value) || value <= 0) {
    return DEFAULT.minimumAmount;
  }
  if (Number.isInteger(value)) {
    return String(value);
  }
  return String(value);
};

export const resolveStampTemplateAwardConfig = (input: {
  awardType?: string | null;
  minimumAmount?: number | null;
}): StampTemplateAwardParsed => {
  if (input.awardType === "amount" || input.awardType === "visit") {
    return {
      awardType: input.awardType,
      minimumAmount:
        input.awardType === "amount"
          ? stampMinimumAmountDisplay(input.minimumAmount)
          : DEFAULT.minimumAmount,
    };
  }
  return DEFAULT;
};

export const getAmountPerStampThreshold = (minimumAmount: string): number | undefined => {
  const normalized = minimumAmount.trim().replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n) || n <= 0) {
    return undefined;
  }
  return n;
};

export const computeStampsFromSpentAmount = (
  rawSpent: string,
  amountPerStamp: number,
): number => {
  if (!Number.isFinite(amountPerStamp) || amountPerStamp <= 0) {
    return 0;
  }
  const normalized = rawSpent.trim().replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.floor(value / amountPerStamp);
};
