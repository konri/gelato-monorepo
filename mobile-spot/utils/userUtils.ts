export const getInitials = (firstName?: string, surname?: string): string => {
  if (firstName && surname) {
    return `${firstName.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  }
  if (firstName) {
    return firstName.charAt(0).toUpperCase();
  }
  return 'U';
};