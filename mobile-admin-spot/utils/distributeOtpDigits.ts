export const OTP_LENGTH = 6;

export const distributeOtpDigits = (
  previous: string[],
  rawValue: string,
  startIndex: number,
  length: number = OTP_LENGTH
): string[] => {
  const digitsOnly = rawValue.replace(/\D/g, "");
  if (digitsOnly.length === 0) {
    const next = [...previous];
    next[startIndex] = "";
    return next;
  }
  if (digitsOnly.length > 1) {
    const next = [...previous];
    let d = 0;
    for (let i = startIndex; i < length && d < digitsOnly.length; i++) {
      next[i] = digitsOnly[d];
      d++;
    }
    return next;
  }
  const next = [...previous];
  next[startIndex] = digitsOnly;
  return next;
};
