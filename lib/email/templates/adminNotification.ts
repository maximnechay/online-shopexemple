// lib/email/templates/adminNotification.ts

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
 * Generate admin order notification HTML email template
 */
export function generateAdminOrderHTML(data: OrderEmailData): string {
  const itemsHTML = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.price)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatCurrency(item.price * item.quantity)}</td>
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
  <title>Neue Bestellung</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1c1917; max-width: 700px; margin: 0 auto; padding: 0; background-color: #ffffff;">
  
  <div style="background-color: #ffffff; border: 1px solid #e7e5e4;">
    
    <!-- Header -->
    <div style="background-color: #1c1917; padding: 30px 20px; text-align: center; border-bottom: 1px solid #e7e5e4;">
      <h1 style="font-family: Georgia, serif; color: #ffffff; margin: 0; font-size: 24px; font-weight: 400; letter-spacing: 0.5px;">Neue Bestellung eingegangen</h1>
      <p style="color: #a8a29e; margin: 10px 0 0 0; font-size: 14px;">Beauty Salon Admin</p>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">
      
      <!-- Alert Box -->
      <div style="background-color: #fafaf9; border-left: 1px solid #1c1917; padding: 15px; margin-bottom: 25px;">
        <strong style="color: #1c1917; font-size: 15px;">Sofortige Aktion erforderlich</strong>
        <p style="margin: 5px 0 0 0; color: #78716c; font-size: 14px;">
          Eine neue Bestellung muss bearbeitet werden.
        </p>
      </div>

      <!-- Order Summary -->
      <h2 style="font-family: Georgia, serif; color: #1c1917; margin: 0 0 20px 0; font-size: 18px; font-weight: 400; border-bottom: 1px solid #e7e5e4; padding-bottom: 10px;">
        Bestellübersicht
      </h2>
      
      <table style="width: 100%; margin-bottom: 20px; background-color: #fafaf9; padding: 15px; border: 1px solid #e7e5e4;">
        <tr>
          <td style="padding: 8px 0; color: #78716c; font-size: 14px; width: 40%;">Bestellnummer:</td>
          <td style="padding: 8px 0; font-weight: 600; color: #1c1917; font-size: 15px;">#${data.orderNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #78716c; font-size: 14px;">Datum & Uhrzeit:</td>
          <td style="padding: 8px 0; color: #1c1917; font-size: 14px;">${formatDate(data.createdAt)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #78716c; font-size: 14px;">Kunde:</td>
          <td style="padding: 8px 0; color: #1c1917; font-size: 14px;">${data.customerName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #78716c; font-size: 14px;">E-Mail:</td>
          <td style="padding: 8px 0;">
            <a href="mailto:${data.customerEmail}" style="color: #1c1917; text-decoration: underline; font-size: 14px;">${data.customerEmail}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #78716c; font-size: 14px;">Zahlungsmethode:</td>
          <td style="padding: 8px 0; color: #1c1917; font-size: 14px;">
            ${data.paymentMethod === 'paypal' ? 'PayPal' : data.paymentMethod === 'stripe' ? 'Kreditkarte' : data.paymentMethod}
          </td>
        </tr>
      </table>

      <!-- Items Table -->
      <h2 style="font-family: Georgia, serif; color: #1c1917; margin: 30px 0 15px 0; font-size: 18px; font-weight: 400; border-bottom: 1px solid #e7e5e4; padding-bottom: 10px;">
        Bestellte Artikel
      </h2>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; background-color: #ffffff; border: 1px solid #e7e5e4;">
        <thead>
          <tr style="background-color: #fafaf9;">
            <th style="padding: 12px; text-align: left; color: #1c1917; font-size: 13px; font-weight: 600; border-bottom: 1px solid #e7e5e4;">Produkt</th>
            <th style="padding: 12px; text-align: center; color: #1c1917; font-size: 13px; font-weight: 600; border-bottom: 1px solid #e7e5e4;">Menge</th>
            <th style="padding: 12px; text-align: right; color: #1c1917; font-size: 13px; font-weight: 600; border-bottom: 1px solid #e7e5e4;">Preis</th>
            <th style="padding: 12px; text-align: right; color: #1c1917; font-size: 13px; font-weight: 600; border-bottom: 1px solid #e7e5e4;">Gesamt</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <!-- Totals -->
      <div style="background-color: #fafaf9; padding: 20px; margin-bottom: 25px; border: 1px solid #e7e5e4;">
        <table style="width: 100%;">
          <tr>
            <td style="padding: 5px 0; color: #78716c; font-size: 14px;">Zwischensumme:</td>
            <td style="padding: 5px 0; text-align: right; color: #1c1917; font-size: 14px;">${formatCurrency(data.subtotal)}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #78716c; font-size: 14px;">Versand:</td>
            <td style="padding: 5px 0; text-align: right; color: #1c1917; font-size: 14px;">
              ${data.shipping === 0 ? 'Kostenlos' : formatCurrency(data.shipping)}
            </td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #78716c; font-size: 14px;">MwSt.:</td>
            <td style="padding: 5px 0; text-align: right; color: #1c1917; font-size: 14px;">${formatCurrency(data.tax)}</td>
          </tr>
          <tr style="border-top: 1px solid #e7e5e4;">
            <td style="padding: 15px 0 0 0; color: #1c1917; font-size: 16px; font-weight: 600;">Gesamt:</td>
            <td style="padding: 15px 0 0 0; text-align: right; color: #1c1917; font-size: 18px; font-weight: 600;">
              ${formatCurrency(data.total)}
            </td>
          </tr>
        </table>
      </div>

      <!-- Shipping Address -->
      <h2 style="font-family: Georgia, serif; color: #1c1917; margin: 30px 0 15px 0; font-size: 18px; font-weight: 400; border-bottom: 1px solid #e7e5e4; padding-bottom: 10px;">
        Lieferadresse
      </h2>
      
      <div style="background-color: #fafaf9; padding: 20px; margin-bottom: 30px; border: 1px solid #e7e5e4;">
        <p style="margin: 0; color: #1c1917; font-size: 14px; line-height: 1.8;">
          <strong style="font-size: 15px;">${data.customerName}</strong><br>
          ${data.shippingAddress.street}<br>
          ${data.shippingAddress.postalCode} ${data.shippingAddress.city}<br>
          ${data.shippingAddress.country}
        </p>
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/orders" 
           style="display: inline-block; background-color: #1c1917; color: #ffffff; text-decoration: none; padding: 14px 40px; font-size: 14px; font-weight: 500; border: 1px solid #1c1917; transition: all 0.2s;">
          Bestellung in Admin anzeigen
        </a>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #fafaf9; padding: 20px; text-align: center; border-top: 1px solid #e7e5e4;">
      <p style="margin: 0; color: #78716c; font-size: 12px;">
        Diese E-Mail wurde automatisch generiert. Bitte nicht antworten.
      </p>
      <p style="margin: 5px 0 0 0; color: #a8a29e; font-size: 11px;">
        Beauty Salon Admin System © 2024
      </p>
    </div>

  </div>

</body>
</html>
  `;
}