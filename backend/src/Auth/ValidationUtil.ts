export class ValidationUtil {
  static validateEmail(email: string): { isValid: boolean; message?: string } {
    if (!email || email.trim() === '') {
      return { isValid: false, message: 'Email is required' }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return { isValid: false, message: 'Invalid email format' }
    }

    return { isValid: true }
  }

  static validatePassword(password: string): { isValid: boolean; message?: string } {
    if (!password || password.trim() === '') {
      return { isValid: false, message: 'Password is required' }
    }

    if (password.length < 6) {
      return { isValid: false, message: 'Password must be at least 6 characters long' }
    }

    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' }
    }

    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' }
    }

    return { isValid: true }
  }
}
