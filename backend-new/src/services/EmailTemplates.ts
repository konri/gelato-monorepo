import { Language } from '@prisma/client';

interface OrderConfirmationData {
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
}

interface PaymentFailedData {
  name: string;
  orderNumber: string;
  orderId: string;
  total: number;
  errorMessage?: string;
}

interface OrderDeliveredData {
  name: string;
  orderNumber: string;
  orderId: string;
}

const translations = {
  PL: {
    orderConfirmed: 'Zamówienie potwierdzone',
    thankYou: 'Dziękujemy za zamówienie! Właśnie przygotowujemy Twoje pyszne lody.',
    orderNumber: 'Numer zamówienia',
    from: 'Z',
    deliveryAddress: 'Adres dostawy',
    estimatedDelivery: 'Szacowany czas dostawy',
    orderItems: 'Produkty',
    item: 'Produkt',
    qty: 'Ilość',
    price: 'Cena',
    total: 'Razem',
    subtotal: 'Suma częściowa',
    deliveryFee: 'Opłata za dostawę',
    trackOrder: 'Śledź zamówienie',
    needHelp: 'Potrzebujesz pomocy? Skontaktuj się z nami pod adresem',
    allRights: 'Wszelkie prawa zastrzeżone',

    paymentFailed: 'Płatność nieudana',
    paymentFailedMessage: 'Niestety, nie mogliśmy przetworzyć płatności za Twoje zamówienie',
    error: 'Błąd',
    commonReasons: 'Najczęstsze przyczyny niepowodzenia płatności:',
    insufficientFunds: 'Niewystarczające środki na koncie',
    incorrectDetails: 'Nieprawidłowe dane karty',
    cardExpired: 'Karta wygasła lub zablokowana',
    bankDeclined: 'Płatność odrzucona przez bank',
    tryAgain: 'Nie martw się! Możesz spróbować ponownie używając innej metody płatności lub skontaktować się ze swoim bankiem.',
    amount: 'Kwota',
    retryPayment: 'Spróbuj ponownie',

    orderDelivered: 'Zamówienie dostarczone',
    deliveredSuccess: 'Świetne wiadomości! Twoje zamówienie zostało pomyślnie dostarczone. Mamy nadzieję, że będziesz cieszyć się pysznymi lodami!',
    thankYouAgain: 'Dziękujemy za wybór Gelato. Nie możemy się doczekać, aby obsłużyć Cię ponownie!',
    rateOrder: 'Oceń zamówienie',
    orderAgain: 'Zamów ponownie',
  },
  EN: {
    orderConfirmed: 'Order Confirmed',
    thankYou: "Thank you for your order! We're preparing your delicious ice cream right now.",
    orderNumber: 'Order Number',
    from: 'From',
    deliveryAddress: 'Delivery Address',
    estimatedDelivery: 'Estimated Delivery',
    orderItems: 'Order Items',
    item: 'Item',
    qty: 'Qty',
    price: 'Price',
    total: 'Total',
    subtotal: 'Subtotal',
    deliveryFee: 'Delivery Fee',
    trackOrder: 'Track Your Order',
    needHelp: 'Need help? Contact us at',
    allRights: 'All rights reserved',

    paymentFailed: 'Payment Failed',
    paymentFailedMessage: "Unfortunately, we couldn't process the payment for your order",
    error: 'Error',
    commonReasons: 'Common reasons for payment failure:',
    insufficientFunds: 'Insufficient funds in your account',
    incorrectDetails: 'Incorrect card details',
    cardExpired: 'Card expired or blocked',
    bankDeclined: 'Payment declined by your bank',
    tryAgain: "Don't worry! You can try again with a different payment method or contact your bank for assistance.",
    amount: 'Amount',
    retryPayment: 'Retry Payment',

    orderDelivered: 'Order Delivered',
    deliveredSuccess: 'Great news! Your order has been delivered successfully. We hope you enjoy your delicious ice cream!',
    thankYouAgain: "Thank you for choosing Gelato. We can't wait to serve you again!",
    rateOrder: 'Rate Your Order',
    orderAgain: 'Order Again',
  },
  UA: {
    orderConfirmed: 'Замовлення підтверджено',
    thankYou: 'Дякуємо за замовлення! Ми готуємо ваше смачне морозиво прямо зараз.',
    orderNumber: 'Номер замовлення',
    from: 'Від',
    deliveryAddress: 'Адреса доставки',
    estimatedDelivery: 'Орієнтовний час доставки',
    orderItems: 'Товари',
    item: 'Товар',
    qty: 'К-сть',
    price: 'Ціна',
    total: 'Разом',
    subtotal: 'Проміжний підсумок',
    deliveryFee: 'Вартість доставки',
    trackOrder: 'Відстежити замовлення',
    needHelp: 'Потрібна допомога? Зв\'яжіться з нами за адресою',
    allRights: 'Всі права захищені',

    paymentFailed: 'Помилка оплати',
    paymentFailedMessage: 'На жаль, ми не змогли обробити платіж за ваше замовлення',
    error: 'Помилка',
    commonReasons: 'Поширені причини невдачі платежу:',
    insufficientFunds: 'Недостатньо коштів на рахунку',
    incorrectDetails: 'Неправильні дані картки',
    cardExpired: 'Картка прострочена або заблокована',
    bankDeclined: 'Платіж відхилено банком',
    tryAgain: 'Не хвилюйтеся! Ви можете спробувати знову, використовуючи інший спосіб оплати або зв\'язатися зі своїм банком.',
    amount: 'Сума',
    retryPayment: 'Спробувати знову',

    orderDelivered: 'Замовлення доставлено',
    deliveredSuccess: 'Чудові новини! Ваше замовлення успішно доставлено. Сподіваємось, вам сподобається смачне морозиво!',
    thankYouAgain: 'Дякуємо, що обрали Gelato. Ми з нетерпінням чекаємо можливості обслужити вас знову!',
    rateOrder: 'Оцінити замовлення',
    orderAgain: 'Замовити знову',
  },
};

export class EmailTemplates {
  private static getTranslation(lang: Language = Language.EN) {
    return translations[lang] || translations.EN;
  }

  /**
   * Get order confirmation email HTML
   */
  static getOrderConfirmationHTML(data: OrderConfirmationData, lang: Language = Language.EN): string {
    const t = this.getTranslation(lang);

    const itemsList = data.items
      .map(
        (item) =>
          `<tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.price.toFixed(2)} PLN</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${(item.price * item.quantity).toFixed(2)} PLN</td>
          </tr>`
      )
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.orderConfirmed} - ${data.orderNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 36px;">🍦</h1>
              <h2 style="margin: 10px 0 0 0; color: #ffffff; font-size: 24px; font-weight: 600;">${t.orderConfirmed}!</h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <p style="margin: 0; font-size: 18px; color: #111827; font-weight: 600;">${data.name},</p>
              <p style="margin: 16px 0 0 0; font-size: 16px; color: #6b7280; line-height: 1.6;">
                ${t.thankYou}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                <tr>
                  <td style="padding-bottom: 12px;">
                    <strong style="color: #111827;">${t.orderNumber}:</strong>
                    <span style="color: #6b7280; margin-left: 8px;">${data.orderNumber}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 12px;">
                    <strong style="color: #111827;">${t.from}:</strong>
                    <span style="color: #6b7280; margin-left: 8px;">${data.spotName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 12px;">
                    <strong style="color: #111827;">${t.deliveryAddress}:</strong>
                    <span style="color: #6b7280; margin-left: 8px;">${data.deliveryAddress}</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong style="color: #111827;">${t.estimatedDelivery}:</strong>
                    <span style="color: #6b7280; margin-left: 8px;">${data.estimatedDelivery}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px 20px 40px;">
              <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #111827;">${t.orderItems}</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">${t.item}</th>
                    <th style="padding: 12px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">${t.qty}</th>
                    <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">${t.price}</th>
                    <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">${t.total}</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsList}
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">${t.subtotal}</td>
                  <td style="padding: 8px 0; text-align: right; color: #111827;">${data.subtotal.toFixed(2)} PLN</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">${t.deliveryFee}</td>
                  <td style="padding: 8px 0; text-align: right; color: #111827;">${data.deliveryFee.toFixed(2)} PLN</td>
                </tr>
                <tr>
                  <td style="padding: 16px 0 0 0; border-top: 2px solid #e5e7eb; font-size: 18px; font-weight: 600; color: #111827;">${t.total}</td>
                  <td style="padding: 16px 0 0 0; border-top: 2px solid #e5e7eb; text-align: right; font-size: 18px; font-weight: 600; color: #111827;">${data.total.toFixed(2)} PLN</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
              <a href="${process.env.CLIENT_MOBILE_URL || 'gelato://'}order/${data.orderId}"
                 style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                ${t.trackOrder}
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                ${t.needHelp} <a href="mailto:support@gelato.com" style="color: #f59e0b; text-decoration: none;">support@gelato.com</a>
              </p>
              <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} Gelato. ${t.allRights}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Get payment failed email HTML
   */
  static getPaymentFailedHTML(data: PaymentFailedData, lang: Language = Language.EN): string {
    const t = this.getTranslation(lang);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.paymentFailed} - ${data.orderNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 36px;">⚠️</h1>
              <h2 style="margin: 10px 0 0 0; color: #ffffff; font-size: 24px; font-weight: 600;">${t.paymentFailed}</h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0; font-size: 18px; color: #111827; font-weight: 600;">${data.name},</p>
              <p style="margin: 16px 0; font-size: 16px; color: #6b7280; line-height: 1.6;">
                ${t.paymentFailedMessage} <strong>${data.orderNumber}</strong>.
              </p>
              ${
                data.errorMessage
                  ? `
              <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #991b1b;">
                  <strong>${t.error}:</strong> ${data.errorMessage}
                </p>
              </div>
              `
                  : ''
              }
              <p style="margin: 20px 0; font-size: 16px; color: #6b7280; line-height: 1.6;">
                <strong>${t.commonReasons}</strong>
              </p>
              <ul style="margin: 0; padding-left: 20px; color: #6b7280; line-height: 1.8;">
                <li>${t.insufficientFunds}</li>
                <li>${t.incorrectDetails}</li>
                <li>${t.cardExpired}</li>
                <li>${t.bankDeclined}</li>
              </ul>
              <p style="margin: 24px 0 0 0; font-size: 16px; color: #6b7280; line-height: 1.6;">
                ${t.tryAgain}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                <tr>
                  <td style="padding-bottom: 12px;">
                    <strong style="color: #111827;">${t.orderNumber}:</strong>
                    <span style="color: #6b7280; margin-left: 8px;">${data.orderNumber}</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong style="color: #111827;">${t.amount}:</strong>
                    <span style="color: #6b7280; margin-left: 8px;">${data.total.toFixed(2)} PLN</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
              <a href="${process.env.CLIENT_MOBILE_URL || 'gelato://'}order/${data.orderId}"
                 style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                ${t.retryPayment}
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                ${t.needHelp} <a href="mailto:support@gelato.com" style="color: #f59e0b; text-decoration: none;">support@gelato.com</a>
              </p>
              <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} Gelato. ${t.allRights}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Get order delivered email HTML
   */
  static getOrderDeliveredHTML(data: OrderDeliveredData, lang: Language = Language.EN): string {
    const t = this.getTranslation(lang);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.orderDelivered} - ${data.orderNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 36px;">🎉</h1>
              <h2 style="margin: 10px 0 0 0; color: #ffffff; font-size: 24px; font-weight: 600;">${t.orderDelivered}!</h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0; font-size: 18px; color: #111827; font-weight: 600;">${data.name},</p>
              <p style="margin: 16px 0; font-size: 16px; color: #6b7280; line-height: 1.6;">
                ${t.deliveredSuccess}
              </p>
              <p style="margin: 16px 0; font-size: 16px; color: #6b7280; line-height: 1.6;">
                ${t.thankYouAgain}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
              <a href="${process.env.CLIENT_MOBILE_URL || 'gelato://'}order/${data.orderId}"
                 style="display: inline-block; margin: 0 8px 16px 8px; padding: 16px 32px; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                ${t.rateOrder}
              </a>
              <a href="${process.env.CLIENT_MOBILE_URL || 'gelato://'}"
                 style="display: inline-block; margin: 0 8px 16px 8px; padding: 16px 32px; background-color: #f3f4f6; color: #111827; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                ${t.orderAgain}
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                ${t.needHelp} <a href="mailto:support@gelato.com" style="color: #f59e0b; text-decoration: none;">support@gelato.com</a>
              </p>
              <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} Gelato. ${t.allRights}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }
}
