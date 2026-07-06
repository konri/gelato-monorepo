import twilio from 'twilio';
import { CodeGenerator } from '../shared/utils/CodeGenerator';

/**
 * OTP Verification storage interface
 */
interface OTPVerification {
  phone: string;
  code: string;
  codeHash: string; // Store hashed OTP for security
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Rate limit tracking
 */
interface RateLimit {
  count: number;
  resetAt: Date;
}

/**
 * Twilio SMS Service for OTP verification
 *
 * Security features:
 * - OTP codes are hashed before storage
 * - Rate limiting (max 3 SMS per 10 minutes per phone)
 * - Attempt limiting (max 3 verification attempts per code)
 * - 10-minute OTP expiration
 * - Phone number format validation
 */
export class TwilioService {
  private static twilioClient: twilio.Twilio | null = null;

  // In-memory storage (use Redis in production for scalability)
  private static otpStore = new Map<string, OTPVerification>();
  private static rateLimits = new Map<string, RateLimit>();

  // Configuration
  private static readonly OTP_EXPIRY_MINUTES = 10;
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly RATE_LIMIT_WINDOW_MINUTES = 10;
  private static readonly RATE_LIMIT_MAX_REQUESTS = 3;

  /**
   * Initialize Twilio client
   */
  private static getTwilioClient(): twilio.Twilio {
    if (!this.twilioClient) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;

      if (!accountSid || !authToken) {
        throw new Error('Twilio credentials not configured');
      }

      this.twilioClient = twilio(accountSid, authToken);
    }

    return this.twilioClient;
  }

  /**
   * Validate phone number format
   */
  private static validatePhoneNumber(phone: string): { valid: boolean; message?: string } {
    // Must start with +
    if (!phone.startsWith('+')) {
      return { valid: false, message: 'Phone number must include country code (e.g., +48...)' };
    }

    // Polish phone validation
    if (phone.startsWith('+48')) {
      const digitsAfterCode = phone.substring(3);
      if (digitsAfterCode.length !== 9 || !/^\d+$/.test(digitsAfterCode)) {
        return {
          valid: false,
          message: 'Invalid Polish phone number. Format: +48XXXXXXXXX (9 digits)',
        };
      }
    }

    // Ukrainian phone validation
    if (phone.startsWith('+380')) {
      const digitsAfterCode = phone.substring(4);
      if (digitsAfterCode.length !== 9 || !/^\d+$/.test(digitsAfterCode)) {
        return {
          valid: false,
          message: 'Invalid Ukrainian phone number. Format: +380XXXXXXXXX (9 digits)',
        };
      }
    }

    // Generic validation for other countries (at least 8 digits after country code)
    const digits = phone.substring(1).replace(/\D/g, '');
    if (digits.length < 8) {
      return { valid: false, message: 'Phone number too short' };
    }

    return { valid: true };
  }

  /**
   * Check rate limit for phone number
   */
  private static checkRateLimit(phone: string): { allowed: boolean; message?: string } {
    const now = new Date();
    const limit = this.rateLimits.get(phone);

    if (limit) {
      if (now < limit.resetAt) {
        if (limit.count >= this.RATE_LIMIT_MAX_REQUESTS) {
          const secondsLeft = Math.floor((limit.resetAt.getTime() - now.getTime()) / 1000);
          return {
            allowed: false,
            message: `Rate limit exceeded. Please wait ${secondsLeft} seconds before requesting a new code`,
          };
        }
        limit.count++;
      } else {
        // Reset window expired
        limit.count = 1;
        limit.resetAt = new Date(now.getTime() + this.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
      }
    } else {
      // First request
      this.rateLimits.set(phone, {
        count: 1,
        resetAt: new Date(now.getTime() + this.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000),
      });
    }

    return { allowed: true };
  }

  /**
   * Hash OTP code for secure storage
   */
  private static async hashOTP(code: string): Promise<string> {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Send OTP code via SMS
   */
  static async sendOTP(
    phone: string,
    language: 'pl' | 'en' | 'ua' = 'pl'
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate phone number
      const validation = this.validatePhoneNumber(phone);
      if (!validation.valid) {
        return { success: false, message: validation.message! };
      }

      // Check rate limit
      const rateCheck = this.checkRateLimit(phone);
      if (!rateCheck.allowed) {
        return { success: false, message: rateCheck.message! };
      }

      // Generate 6-digit OTP
      const code = CodeGenerator.generateOTP();
      const codeHash = await this.hashOTP(code);

      // Store OTP with expiration
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);
      this.otpStore.set(phone, {
        phone,
        code, // Keep plain code temporarily for sending SMS
        codeHash,
        attempts: 0,
        expiresAt,
        createdAt: new Date(),
      });

      // Dev-only: log the plain OTP so you can verify without SMS delivery.
      // Never enable in production - would leak auth codes.
      if (process.env.NODE_ENV !== 'production') {
        console.log(`🔑 [DEV] OTP for ${phone}: ${code} (expires ${expiresAt.toISOString()})`);
      }

      // Send SMS. In dev, if delivery fails (e.g. Twilio not configured), don't
      // block the flow — the code was already generated and logged above so it
      // can still be entered. In production a delivery failure is a real error.
      try {
        await this.sendSMS(phone, code, language);
        console.log(`📱 OTP sent to ${phone} (expires in ${this.OTP_EXPIRY_MINUTES} minutes)`);
      } catch (smsError) {
        // Twilio errors carry code/status/moreInfo beyond the terse .message.
        const e = smsError as {
          message?: string;
          code?: number | string;
          status?: number;
          moreInfo?: string;
        };
        const fromNumber = process.env.TWILIO_PHONE_NUMBER;
        const sid = process.env.TWILIO_ACCOUNT_SID;
        console.warn('⚠️  [DEV] SMS delivery failed. Details:', {
          message: e.message,
          twilioCode: e.code, // e.g. 20003 = auth error, 21211 = invalid 'to', 21606 = bad 'from'
          httpStatus: e.status,
          moreInfo: e.moreInfo,
          to: phone,
          from: fromNumber || '(TWILIO_PHONE_NUMBER not set)',
          accountSid: sid ? `${sid.slice(0, 6)}…` : '(TWILIO_ACCOUNT_SID not set)',
        });
        console.warn('   → Use the 🔑 [DEV] OTP logged above to continue.');
        if (process.env.NODE_ENV === 'production') {
          throw smsError;
        }
      }

      // Clear plain code after sending (keep only hash)
      const stored = this.otpStore.get(phone);
      if (stored) {
        stored.code = ''; // Remove plain text code
      }

      return {
        success: true,
        message: 'Verification code sent successfully',
      };
    } catch (error) {
      console.error('Send OTP error:', error);
      return {
        success: false,
        message: 'Failed to send verification code. Please try again.',
      };
    }
  }

  /**
   * Verify OTP code
   */
  static async verifyOTP(
    phone: string,
    code: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const stored = this.otpStore.get(phone);

      if (!stored) {
        return {
          success: false,
          message: 'No verification code found. Please request a new code.',
        };
      }

      // Check expiration
      if (stored.expiresAt < new Date()) {
        this.otpStore.delete(phone);
        return {
          success: false,
          message: 'Verification code expired. Please request a new code.',
        };
      }

      // Check attempts
      if (stored.attempts >= this.MAX_ATTEMPTS) {
        this.otpStore.delete(phone);
        return {
          success: false,
          message: 'Too many failed attempts. Please request a new code.',
        };
      }

      // Verify code (hash comparison for security)
      const codeHash = await this.hashOTP(code.trim());
      if (codeHash !== stored.codeHash) {
        stored.attempts++;
        const attemptsLeft = this.MAX_ATTEMPTS - stored.attempts;

        if (attemptsLeft === 0) {
          this.otpStore.delete(phone);
          return {
            success: false,
            message: 'Invalid code. Maximum attempts reached. Please request a new code.',
          };
        }

        return {
          success: false,
          message: `Invalid verification code. ${attemptsLeft} attempt(s) remaining.`,
        };
      }

      // Success - delete OTP
      this.otpStore.delete(phone);

      console.log(`✅ OTP verified successfully for ${phone}`);

      return { success: true };
    } catch (error) {
      console.error('Verify OTP error:', error);
      return {
        success: false,
        message: 'Failed to verify code. Please try again.',
      };
    }
  }

  /**
   * Send SMS via Twilio
   */
  private static async sendSMS(phone: string, code: string, language: 'pl' | 'en' | 'ua'): Promise<void> {
    const messages = {
      pl: `Twój kod weryfikacyjny Gelato: ${code}\nWażny przez ${this.OTP_EXPIRY_MINUTES} minut.`,
      en: `Your Gelato verification code: ${code}\nValid for ${this.OTP_EXPIRY_MINUTES} minutes.`,
      ua: `Ваш код верифікації Gelato: ${code}\nДійсний ${this.OTP_EXPIRY_MINUTES} хвилин.`,
    };

    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!fromNumber) {
      throw new Error('TWILIO_PHONE_NUMBER not configured');
    }

    const client = this.getTwilioClient();

    await client.messages.create({
      body: messages[language],
      from: fromNumber,
      to: phone,
    });
  }

  /**
   * Clean up expired OTPs (call periodically)
   */
  static cleanupExpired(): void {
    const now = new Date();

    // Clean OTPs
    for (const [phone, otp] of this.otpStore.entries()) {
      if (otp.expiresAt < now) {
        this.otpStore.delete(phone);
      }
    }

    // Clean rate limits
    for (const [phone, limit] of this.rateLimits.entries()) {
      if (limit.resetAt < now) {
        this.rateLimits.delete(phone);
      }
    }
  }
}

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  TwilioService.cleanupExpired();
}, 5 * 60 * 1000);
