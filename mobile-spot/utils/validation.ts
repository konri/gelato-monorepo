export class ValidationUtil {
  static validateEmail(email: string): { isValid: boolean; messageKey?: string } {
    if (!email || email.trim() === '') {
      return { isValid: false, messageKey: 'Validation.emailRequired' }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return { isValid: false, messageKey: 'Validation.emailInvalid' }
    }

    return { isValid: true }
  }

  static validatePassword(password: string): { isValid: boolean; messageKey?: string } {
    if (!password || password.trim() === '') {
      return { isValid: false, messageKey: 'Validation.passwordRequired' }
    }

    if (password.length < 6) {
      return { isValid: false, messageKey: 'Validation.passwordTooShort' }
    }

    if (!/[A-Z]/.test(password)) {
      return { isValid: false, messageKey: 'Validation.passwordNoUppercase' }
    }

    if (!/[0-9]/.test(password)) {
      return { isValid: false, messageKey: 'Validation.passwordNoNumber' }
    }

    return { isValid: true }
  }
}