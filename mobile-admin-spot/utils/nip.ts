export const normalizeNip = (value: string): string => {
  return (value || "").replace(/[^0-9]/g, "");
};

export const isValidPolishNip = (raw: string): boolean => {
  const nip = normalizeNip(raw);
  if (nip.length !== 10) return false;
  if (!/^[0-9]{10}$/.test(nip)) return false;
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const sum = weights.reduce((acc, w, i) => acc + w * Number(nip[i]), 0);
  const control = sum % 11;
  return control === Number(nip[9]);
};

export const validateNipOrMessage = (
  value: string,
  invalidMessage: string
): true | string => {
  const normalized = normalizeNip(value || "");
  if (normalized.length === 0) return true;
  if (normalized.length !== 10) return invalidMessage;
  return isValidPolishNip(normalized) ? true : invalidMessage;
};

