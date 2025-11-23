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
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  
  <div style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); padding: 30px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🛍️ Neue Bestellung eingegangen</h1>
      <p style="color: #d1d5db; margin: 10px 0 0 0; font-size: 14px;">Beauty Salon Admin</p>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">
      
      <!-- Alert Box -->
      <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <strong style="color: #1e40af; font-size: 15px;">⚡ Sofortige Aktion erforderlich</strong>
        <p style="margin: 5px 0 0 0; color: #1e3a8a; font-size: 14px;">
          Eine neue Bestellung muss bearbeitet werden.
        </p>
      </div>

      <!-- Order Summary -->
      <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
        Bestellübersicht
      </h2>
      
      <table style="width: 100%; margin-bottom: 20px; background-color: #f9fafb; padding: 15px; border-radius: 8px;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">Bestellnummer:</td>
          <td style="padding: 8px 0; font-weight: 600; color: #1f2937; font-size: 15px;">#${data.orderNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Datum & Uhrzeit:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${formatDate(data.createdAt)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Kunde:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${data.customerName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">E-Mail:</td>
          <td style="padding: 8px 0;">
            <a href="mailto:${data.customerEmail}" style="color: #3b82f6; text-decoration: none; font-size: 14px;">${data.customerEmail}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Zahlungsmethode:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">
            ${data.paymentMethod === 'paypal' ? '💳 PayPal' : data.paymentMethod === 'stripe' ? '💳 Kreditkarte' : data.paymentMethod}
          </td>
        </tr>
      </table>

      <!-- Items Table -->
      <h2 style="color: #1f2937; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
        Bestellte Artikel
      </h2>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 12px; text-align: left; color: #374151; font-size: 13px; font-weight: 600;">Produkt</th>
            <th style="padding: 12px; text-align: center; color: #374151; font-size: 13px; font-weight: 600;">Menge</th>
            <th style="padding: 12px; text-align: right; color: #374151; font-size: 13px; font-weight: 600;">Preis</th>
            <th style="padding: 12px; text-align: right; color: #374151; font-size: 13px; font-weight: 600;">Gesamt</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <!-- Totals -->
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <table style="width: 100%;">
          <tr>
            <td style="padding: 5px 0; color: #6b7280; font-size: 14px;">Zwischensumme:</td>
            <td style="padding: 5px 0; text-align: right; color: #1f2937; font-size: 14px;">${formatCurrency(data.subtotal)}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #6b7280; font-size: 14px;">Versand:</td>
            <td style="padding: 5px 0; text-align: right; color: #1f2937; font-size: 14px;">
              ${data.shipping === 0 ? 'Kostenlos' : formatCurrency(data.shipping)}
            </td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #6b7280; font-size: 14px;">MwSt.:</td>
            <td style="padding: 5px 0; text-align: right; color: #1f2937; font-size: 14px;">${formatCurrency(data.tax)}</td>
          </tr>
          <tr style="border-top: 2px solid #d1d5db;">
            <td style="padding: 15px 0 0 0; color: #1f2937; font-size: 16px; font-weight: 700;">Gesamt:</td>
            <td style="padding: 15px 0 0 0; text-align: right; color: #059669; font-size: 18px; font-weight: 700;">
              ${formatCurrency(data.total)}
            </td>
          </tr>
        </table>
      </div>

      <!-- Shipping Address -->
      <h2 style="color: #1f2937; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
        Lieferadresse
      </h2>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <p style="margin: 0; color: #1f2937; font-size: 14px; line-height: 1.8;">
          <strong style="font-size: 15px;">${data.customerName}</strong><br>
          ${data.shippingAddress.street}<br>
          ${data.shippingAddress.postalCode} ${data.shippingAddress.city}<br>
          ${data.shippingAddress.country}
        </p>
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/orders" 
           style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
          🎯 Bestellung in Admin anzeigen
        </a>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #6b7280; font-size: 12px;">
        Diese E-Mail wurde automatisch generiert. Bitte nicht antworten.
      </p>
      <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 11px;">
        Beauty Salon Admin System © 2024
      </p>
    </div>

  </div>

</body>
</html>
  `;
}