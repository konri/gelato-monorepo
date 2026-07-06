import { PhoneSmsService } from '../../Auth/PhoneSmsService'

const ORDER_BASE_URL = process.env.ORDER_BASE_URL ?? 'http://localhost:3000'

export class OrderSmsService {
  /**
   * Send SMS when order is created
   */
  static async sendOrderCreatedSms(params: {
    phoneNumber: string
    orderNumber: number
    pickupCode: string | null
    storeName: string
  }): Promise<void> {
    const { phoneNumber, orderNumber, pickupCode, storeName } = params

    const trackingUrl = pickupCode ? `${ORDER_BASE_URL}/order/track/${pickupCode}` : ''

    const message = pickupCode
      ? `Zamówienie #${orderNumber} przyjęte w ${storeName}! Śledź status: ${trackingUrl}`
      : `Zamówienie #${orderNumber} przyjęte w ${storeName}!`

    await this.sendSms(phoneNumber, message)
  }

  /**
   * Send SMS when order is ready
   */
  static async sendOrderReadySms(params: {
    phoneNumber: string
    orderNumber: number
    pickupCode: string | null
    storeName: string
  }): Promise<void> {
    const { phoneNumber, orderNumber, pickupCode, storeName } = params

    const message = pickupCode
      ? `🎉 Zamówienie #${orderNumber} gotowe do odbioru w ${storeName}! Kod: ${pickupCode}`
      : `🎉 Zamówienie #${orderNumber} gotowe do odbioru w ${storeName}!`

    await this.sendSms(phoneNumber, message)
  }

  /**
   * Send SMS via Twilio
   */
  private static async sendSms(phoneNumber: string, message: string): Promise<void> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !fromNumber) {
      console.warn('⚠️ Twilio not configured - SMS not sent:', { phoneNumber, message })
      return
    }

    try {
      const twilio = require('twilio')
      const client = twilio(accountSid, authToken)

      await client.messages.create({
        body: message,
        from: fromNumber,
        to: phoneNumber,
      })

      console.log(`📱 Order SMS sent to ${phoneNumber}`)
    } catch (error) {
      console.error('Failed to send order SMS:', error)
    }
  }
}
