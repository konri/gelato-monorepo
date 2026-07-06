export const validatePhone = (phoneNumber: string): boolean => {
  if (!phoneNumber) return true;
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
};

export const formatPhoneNumber = (text: string): string => {
  // Remove all non-digit characters
  const digits = text.replace(/\D/g, '');
  
  // Add space every 3 digits
  const formatted = digits.match(/.{1,3}/g)?.join(' ') || digits;
  
  return formatted;
};

export const unformatPhoneNumber = (text: string): string => {
  // Remove all spaces
  return text.replace(/\s/g, '');
};

export const validateBirthDate = (date: string): boolean => {
  if (!date) return true;
  
  const dashFormat = /^\d{4}-\d{2}-\d{2}$/;
  const slashFormat = /^\d{4}\/\d{2}\/\d{2}$/;
  
  if (!dashFormat.test(date) && !slashFormat.test(date)) return false;
  
  const normalizedDate = date.replace(/\//g, '-');
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
  return date.replace(/\//g, '-');
};
