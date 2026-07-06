import prisma from '../shared/prisma'
import { CodeGenerator } from '../shared/util/CodeGenerator'
import * as firebaseAdmin from 'firebase-admin'

interface PhoneVerification {
  phone: string
  code: string
  expiresAt: Date
}

// In-memory storage for verification codes (use Redis in production)
const verificationCodes = new Map<string, PhoneVerification>()

export class PhoneSmsService {
  /**
   * Send SMS verification code to phone number
   */
  static async sendVerificationCode(phoneNumber: string): Promise<{ success: boolean; message: string }> {
    try {
      // Validate phone number format
      if (!phoneNumber.startsWith('+')) {
        return { success: false, message: 'Phone number must include country code (e.g., +48...)' }
      }

      // Validate Polish phone number format
      if (phoneNumber.startsWith('+48')) {
        const digitsAfterCode = phoneNumber.substring(3)
        if (digitsAfterCode.length !== 9 || !/^\d+$/.test(digitsAfterCode)) {
          return { success: false, message: 'Invalid Polish phone number. Format: +48XXXXXXXXX (9 digits after +48)' }
        }
      }

      // Rate limiting - check if code was sent recently
      const existing = verificationCodes.get(phoneNumber)
      if (existing && existing.expiresAt > new Date()) {
        const secondsLeft = Math.floor((existing.expiresAt.getTime() - Date.now()) / 1000)
        if (secondsLeft > 240) {
          // If more than 4 minutes left, don't send new code
          return {
            success: false,
            message: `Please wait ${secondsLeft} seconds before requesting a new code`,
          }
        }
      }

      // Generate 6-digit verification code
      const code = CodeGenerator.generateVerificationCode()

      // Store code with 5-minute expiration
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
      verificationCodes.set(phoneNumber, { phone: phoneNumber, code, expiresAt })

      // Send SMS via Twilio
      await this.sendSmsViaTwilio(phoneNumber, code)

      return {
        success: true,
        message: 'Verification code sent successfully',
      }
    } catch (error) {
      console.error('Send SMS error:', error)
      return {
        success: false,
        message: 'Failed to send verification code',
      }
    }
  }

  /**
   * Verify SMS code and return user data
   */
  static async verifyCode(
    phoneNumber: string,
    code: string
  ): Promise<{ success: boolean; user?: any; isNewUser?: boolean; message?: string }> {
    try {
      // Get stored verification code
      const verification = verificationCodes.get(phoneNumber)

      if (!verification) {
        return { success: false, message: 'No verification code found. Please request a new code.' }
      }

      // Check if code expired
      if (verification.expiresAt < new Date()) {
        verificationCodes.delete(phoneNumber)
        return { success: false, message: 'Verification code expired. Please request a new code.' }
      }

      // Verify code
      if (verification.code !== code.trim()) {
        return { success: false, message: 'Invalid verification code' }
      }

      // Code is valid - delete it
      verificationCodes.delete(phoneNumber)

      // Check if user exists
      let user = await prisma.user.findFirst({
        where: { phone: phoneNumber },
      })

      let isNewUser = false

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: `${phoneNumber}@phone.easybons`,
            password: '',
            phone: phoneNumber,
            name: phoneNumber,
            firstName: '',
            surname: '',
            roles: ['CLIENT'],
            registrationSource: 'MOBILE_CLIENT',
            profileType: 'phone',
            emailVerified: true,
          },
        })
        isNewUser = true
      }

      return {
        success: true,
        user,
        isNewUser,
      }
    } catch (error) {
      console.error('Verify code error:', error)
      return {
        success: false,
        message: 'Failed to verify code',
      }
    }
  }

  /**
   * Send SMS via Twilio
   */
  private static async sendSmsViaTwilio(phoneNumber: string, code: string): Promise<void> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !fromNumber) {
      console.error('Twilio credentials missing:', {
        accountSid: !!accountSid,
        authToken: !!authToken,
        fromNumber: !!fromNumber,
      })
      throw new Error('Twilio credentials not configured')
    }

    const twilio = require('twilio')
    const client = twilio(accountSid, authToken)

    await client.messages.create({
      body: `Your EasyBons verification code is: ${code}`,
      from: fromNumber,
      to: phoneNumber,
    })

    console.log(`📱 SMS sent to ${phoneNumber}`)
  }
}
