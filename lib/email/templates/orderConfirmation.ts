// lib/email/templates/orderConfirmation.ts

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

export interface OrderEmailData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: string;
  status: string;
  createdAt: string;
}

/**
 * Generate order confirmation HTML email template
 */
export function generateOrderConfirmationHTML(data: OrderEmailData): string {
  const itemsHTML = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #e7e5e4;">
        <strong style="color: #1c1917; font-size: 15px;">${item.name}</strong>
        <div style="color: #78716c; font-size: 13px; margin-top: 5px;">Menge: ${item.quantity}</div>
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #e7e5e4; text-align: right; color: #1c1917; font-weight: 600;">
        ${formatCurrency(item.price * item.quantity)}
      </td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bestellbestätigung</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff;">
  
  <!-- Header -->
  <div style="background-color: #ffffff; padding: 40px 30px; text-align: center; border-bottom: 1px solid #e7e5e4;">
    <h1 style="font-family: Georgia, serif; color: #1c1917; margin: 0; font-size: 32px; font-weight: 400; letter-spacing: 0.5px;">
      Beauty Salon
    </h1>
    <p style="color: #78716c; margin: 10px 0 0 0; font-size: 14px;">Vielen Dank für Ihre Bestellung</p>
  </div>

  <!-- Content -->
  <div style="background-color: #ffffff; padding: 40px 30px;">
    
    <!-- Success Message -->
    <div style="background-color: #fafaf9; border-left: 1px solid #1c1917; padding: 20px; margin-bottom: 30px;">
      <h2 style="font-family: Georgia, serif; color: #1c1917; margin: 0 0 10px 0; font-size: 20px; font-weight: 400;">
        Bestellung erfolgreich aufgegeben
      </h2>
      <p style="margin: 0; color: #78716c; font-size: 14px;">
        Ihre Bestellung wurde erfolgreich bearbeitet und wird in Kürze vorbereitet.
      </p>
    </div>

    <!-- Order Details -->
    <h3 style="font-family: Georgia, serif; color: #1c1917; margin: 30px 0 15px 0; font-size: 18px; font-weight: 400; border-bottom: 1px solid #e7e5e4; padding-bottom: 10px;">
      Bestelldetails
    </h3>
    
    <table style="width: 100%; margin-bottom: 20px;">
      <tr>
        <td style="padding: 8px 0; color: #78716c; font-size: 14px;">Bestellnummer:</td>
        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1c1917; font-size: 14px;">
          #${data.orderNumber}
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #78716c; font-size: 14px;">Datum:</td>
        <td style="padding: 8px 0; text-align: right; color: #1c1917; font-size: 14px;">
          ${formatDate(data.createdAt)}
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #78716c; font-size: 14px;">Zahlungsmethode:</td>
        <td style="padding: 8px 0; text-align: right; color: #1c1917; font-size: 14px;">
          ${data.paymentMethod === 'paypal' ? 'PayPal' : data.paymentMethod === 'stripe' ? 'Kreditkarte' : data.paymentMethod}
        </td>
      </tr>
    </table>

    <!-- Items -->
    <h3 style="font-family: Georgia, serif; color: #1c1917; margin: 30px 0 15px 0; font-size: 18px; font-weight: 400; border-bottom: 1px solid #e7e5e4; padding-bottom: 10px;">
      Bestellte Artikel
    </h3>
    
    <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
      ${itemsHTML}
    </table>

    <!-- Totals -->
    <div style="background-color: #fafaf9; padding: 20px; margin: 20px 0; border: 1px solid #e7e5e4;">
      <table style="width: 100%;">
        <tr>
          <td style="padding: 8px 0; color: #78716c; font-size: 14px;">Zwischensumme:</td>
          <td style="padding: 8px 0; text-align: right; color: #1c1917; font-size: 14px;">
            ${formatCurrency(data.subtotal)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #78716c; font-size: 14px;">Versand:</td>
          <td style="padding: 8px 0; text-align: right; color: #1c1917; font-size: 14px;">
            ${data.shipping === 0 ? 'Kostenlos' : formatCurrency(data.shipping)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #78716c; font-size: 14px;">MwSt. (${(data.tax / data.subtotal * 100).toFixed(0)}%):</td>
          <td style="padding: 8px 0; text-align: right; color: #1c1917; font-size: 14px;">
            ${formatCurrency(data.tax)}
          </td>
        </tr>
        <tr style="border-top: 1px solid #e7e5e4;">
          <td style="padding: 15px 0 0 0; color: #1c1917; font-size: 18px; font-weight: 600;">Gesamt:</td>
          <td style="padding: 15px 0 0 0; text-align: right; color: #1c1917; font-size: 20px; font-weight: 600;">
            ${formatCurrency(data.total)}
          </td>
        </tr>
      </table>
    </div>

    <!-- Shipping Address -->
    <h3 style="font-family: Georgia, serif; color: #1c1917; margin: 30px 0 15px 0; font-size: 18px; font-weight: 400; border-bottom: 1px solid #e7e5e4; padding-bottom: 10px;">
      Lieferadresse
    </h3>
    
    <div style="background-color: #fafaf9; padding: 20px; margin-bottom: 30px; border: 1px solid #e7e5e4;">
      <p style="margin: 0; color: #1c1917; font-size: 14px; line-height: 1.8;">
        <strong>${data.customerName}</strong><br>
        ${data.shippingAddress.street}<br>
        ${data.shippingAddress.postalCode} ${data.shippingAddress.city}<br>
        ${data.shippingAddress.country}
      </p>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 40px 0 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/profile/orders/${data.orderId}" 
         style="display: inline-block; background-color: #1c1917; color: #ffffff; text-decoration: none; padding: 14px 40px; font-size: 14px; font-weight: 500; border: 1px solid #1c1917; transition: all 0.2s;">
        Bestellung verfolgen
      </a>
    </div>

    <!-- Footer Note -->
    <div style="background-color: #fafaf9; border-left: 1px solid #e7e5e4; padding: 15px; margin: 25px 0 0 0;">
      <p style="margin: 0; font-size: 14px; color: #78716c;">
        Sie erhalten eine weitere E-Mail, sobald Ihre Bestellung versandt wurde.
      </p>
    </div>

  </div>

  <!-- Footer -->
  <div style="background-color: #fafaf9; padding: 30px; text-align: center; border-top: 1px solid #e7e5e4;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 10px; text-align: center;">
          <p style="margin: 0 0 5px 0; color: #78716c; font-size: 13px;">Bei Fragen kontaktieren Sie uns gerne</p>
          <a href="mailto:kontakt@beautysalon.de" style="color: #1c1917; text-decoration: none; font-size: 14px;">kontakt@beautysalon.de</a>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px 10px 10px 10px; text-align: center; border-top: 1px solid #e7e5e4;">
          <p style="margin: 0; color: #a8a29e; font-size: 12px;">© 2024 Beauty Salon</p>
          <p style="margin: 5px 0 0 0; color: #a8a29e; font-size: 12px;">Hildesheimer Str. 22, 30169 Hannover</p>
        </td>
      </tr>
    </table>
  </div>

</body>
</html>
  `;
}