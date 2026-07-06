export class CodeGenerator {
  /**
   * Generate 6-digit OTP code
   */
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate random alphanumeric string
   */
  static generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  /**
   * Generate referral code from user name
   * Format: NAMEXX999 (6 letters + 3 digits)
   */
  static generateReferralCode(name: string): string {
    const sanitized = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const prefix = sanitized.substring(0, 6).padEnd(6, 'X');
    const suffix = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `${prefix}${suffix}`;
  }

  /**
   * Generate secure token for password reset, email verification, etc.
   */
  static generateSecureToken(): string {
    return this.generateRandomString(64);
  }
}
