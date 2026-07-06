import sgMail from '@sendgrid/mail';
import { Language } from '@prisma/client';
import { EmailTemplates } from './EmailTemplates';

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static initialized = false;

  static initialize() {
    const apiKey = process.env.SENDGRID_API_KEY;

    if (!apiKey) {
      console.warn('SENDGRID_API_KEY not set - Email notifications disabled');
      return;
    }

    sgMail.setApiKey(apiKey);
    this.initialized = true;
    console.log('✅ SendGrid email service initialized');
  }

  static isEnabled(): boolean {
    return this.initialized;
  }

  private static getFromEmail() {
    return {
      email: process.env.SENDGRID_FROM_EMAIL || 'noreply@gelato.com',
      name: process.env.SENDGRID_FROM_NAME || 'Gelato',
    };
  }

  /**
   * Send a generic email
   */
  static async sendEmail(template: EmailTemplate): Promise<boolean> {
    if (!this.initialized) {
      console.warn('Email service not initialized - skipping email');
      return false;
    }

    try {
      await sgMail.send({
        to: template.to,
        from: this.getFromEmail(),
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`📧 Email sent to ${template.to}: ${template.subject}`);
      return true;
    } catch (error: any) {
      console.error('Failed to send email:', error.response?.body || error.message);
      return false;
    }
  }

  /**
   * Send order confirmation email
   */
  static async sendOrderConfirmation(data: {
    email: string;
    name: string;
    orderNumber: string;
    orderId: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    subtotal: number;
    deliveryFee: number;
    total: number;
    deliveryAddress: string;
    estimatedDelivery: string;
    spotName: string;
    language?: Language;
  }): Promise<boolean> {
    const lang = data.language || Language.EN;
    const html = EmailTemplates.getOrderConfirmationHTML(
      {
        name: data.name,
        orderNumber: data.orderNumber,
        orderId: data.orderId,
        items: data.items,
        subtotal: data.subtotal,
        deliveryFee: data.deliveryFee,
        total: data.total,
        deliveryAddress: data.deliveryAddress,
        estimatedDelivery: data.estimatedDelivery,
        spotName: data.spotName,
      },
      lang
    );

    const subjectMap = {
      [Language.PL]: `Zamówienie potwierdzone - ${data.orderNumber} 🍦`,
      [Language.EN]: `Order Confirmed - ${data.orderNumber} 🍦`,
      [Language.UA]: `Замовлення підтверджено - ${data.orderNumber} 🍦`,
    };

    return await this.sendEmail({
      to: data.email,
      subject: subjectMap[lang] || subjectMap[Language.EN],
      html,
    });
  }

  /**
   * Send payment failed email
   */
  static async sendPaymentFailed(data: {
    email: string;
    name: string;
    orderNumber: string;
    orderId: string;
    total: number;
    errorMessage?: string;
    language?: Language;
  }): Promise<boolean> {
    const lang = data.language || Language.EN;
    const html = EmailTemplates.getPaymentFailedHTML(
      {
        name: data.name,
        orderNumber: data.orderNumber,
        orderId: data.orderId,
        total: data.total,
        errorMessage: data.errorMessage,
      },
      lang
    );

    const subjectMap = {
      [Language.PL]: `Płatność nieudana - Zamówienie ${data.orderNumber} ⚠️`,
      [Language.EN]: `Payment Failed - Order ${data.orderNumber} ⚠️`,
      [Language.UA]: `Помилка оплати - Замовлення ${data.orderNumber} ⚠️`,
    };

    return await this.sendEmail({
      to: data.email,
      subject: subjectMap[lang] || subjectMap[Language.EN],
      html,
    });
  }

  /**
   * Send order delivered email
   */
  static async sendOrderDelivered(data: {
    email: string;
    name: string;
    orderNumber: string;
    orderId: string;
    language?: Language;
  }): Promise<boolean> {
    const lang = data.language || Language.EN;
    const html = EmailTemplates.getOrderDeliveredHTML(
      {
        name: data.name,
        orderNumber: data.orderNumber,
        orderId: data.orderId,
      },
      lang
    );

    const subjectMap = {
      [Language.PL]: `Twoje zamówienie zostało dostarczone! 🎉`,
      [Language.EN]: `Your order has been delivered! 🎉`,
      [Language.UA]: `Ваше замовлення доставлено! 🎉`,
    };

    return await this.sendEmail({
      to: data.email,
      subject: subjectMap[lang] || subjectMap[Language.EN],
      html,
    });
  }
}
