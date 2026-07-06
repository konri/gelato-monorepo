const joinDigitTriplets = (digits: string): string => {
  const parts: string[] = [];
  for (let i = 0; i < digits.length; i += 3) {
    parts.push(digits.slice(i, i + 3));
  }
  return parts.join(" ");
};

const isValidNineDigitPolishNational = (digits: string): boolean =>
  /^[1-9]\d{8}$/.test(digits);

export const formatPolishPhoneInput = (raw: string): string => {
  let d = raw.replace(/\D/g, "");
  if (/^48\d{9}$/.test(d)) {
    d = d.slice(2);
  } else if (d.startsWith("48") && d.length === 10) {
    d = d.slice(2, 10);
  } else if (d.length > 9) {
    d = d.slice(0, 9);
  }
  return joinDigitTriplets(d);
};

export const validatePhone = (phoneNumber: string): boolean => {
  if (!phoneNumber?.trim()) {
    return true;
  }
  const digits = phoneNumber.replace(/\D/g, "");
  if (digits.length === 0) {
    return true;
  }
  if (digits.length > 11) {
    return false;
  }
  if (digits.length === 11 && digits.startsWith("48")) {
    return isValidNineDigitPolishNational(digits.slice(2));
  }
  if (digits.length === 11) {
    return false;
  }
  if (digits.length === 10) {
    return false;
  }
  if (digits.length === 9) {
    return isValidNineDigitPolishNational(digits);
  }
  return false;
};

export const validateBirthDate = (date: string): boolean => {
  if (!date) return true;

  let raw = date.trim();
  if (raw.includes("T")) {
    raw = raw.slice(0, 10);
  }

  const dashFormat = /^\d{4}-\d{2}-\d{2}$/;
  const slashFormat = /^\d{4}\/\d{2}\/\d{2}$/;
  
  if (!dashFormat.test(raw) && !slashFormat.test(raw)) return false;
  
  const normalizedDate = raw.replace(/\//g, "-");
  const birthDate = new Date(normalizedDate);
  
  if (isNaN(birthDate.getTime())) return false;
  
  const today = new Date();
  const minAge = new Date();
  minAge.setFullYear(today.getFullYear() - 13);
  
  return birthDate < minAge && birthDate > new Date('1900-01-01');
};

export const validateReferralCode = (code: string): boolean => {
  const regex = /^[A-Z]{6}\d{3}$/;
  return regex.test(code);
};

export const formatBirthDate = (text: string): string => {
  return text.replace(/[^\d\/-]/g, '');
};

export const normalizeBirthDate = (date: string): string => {
  let d = date.trim().replace(/\//g, "-");
  if (d.includes("T")) {
    d = d.slice(0, 10);
  }
  return d;
};

export const parseBirthDateFromApi = (raw?: string): string => {
  if (!raw || raw.length < 10) {
    return "";
  }
  const ymd = raw.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    return ymd;
  }
  return "";
};

export const isValidUUID = (value: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value.trim());
};
