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
      <td style="padding: 15px; border-bottom: 1px solid #f0f0f0;">
        <strong style="color: #333; font-size: 15px;">${item.name}</strong>
        <div style="color: #888; font-size: 13px; margin-top: 5px;">Menge: ${item.quantity}</div>
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #f0f0f0; text-align: right; color: #333; font-weight: 600;">
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
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fafafa;">
  
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #f5f5dc 0%, #d4a574 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 28px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      Beauty Salon
    </h1>
    <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">Vielen Dank für Ihre Bestellung</p>
  </div>

  <!-- Content -->
  <div style="background-color: #ffffff; padding: 40px 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
    
    <!-- Success Message -->
    <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
      <h2 style="color: #059669; margin: 0 0 10px 0; font-size: 20px;">
        ✓ Bestellung erfolgreich aufgegeben!
      </h2>
      <p style="margin: 0; color: #047857; font-size: 14px;">
        Ihre Bestellung wurde erfolgreich bearbeitet und wird in Kürze vorbereitet.
      </p>
    </div>

    <!-- Order Details -->
    <h3 style="color: #d4a574; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
      Bestelldetails
    </h3>
    
    <table style="width: 100%; margin-bottom: 20px;">
      <tr>
        <td style="padding: 8px 0; color: #666; font-size: 14px;">Bestellnummer:</td>
        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #333; font-size: 14px;">
          #${data.orderNumber}
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666; font-size: 14px;">Datum:</td>
        <td style="padding: 8px 0; text-align: right; color: #333; font-size: 14px;">
          ${formatDate(data.createdAt)}
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666; font-size: 14px;">Zahlungsmethode:</td>
        <td style="padding: 8px 0; text-align: right; color: #333; font-size: 14px;">
          ${data.paymentMethod === 'paypal' ? 'PayPal' : data.paymentMethod === 'stripe' ? 'Kreditkarte' : data.paymentMethod}
        </td>
      </tr>
    </table>

    <!-- Items -->
    <h3 style="color: #d4a574; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
      Bestellte Artikel
    </h3>
    
    <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
      ${itemsHTML}
    </table>

    <!-- Totals -->
    <div style="background-color: #fafafa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <table style="width: 100%;">
        <tr>
          <td style="padding: 8px 0; color: #666; font-size: 14px;">Zwischensumme:</td>
          <td style="padding: 8px 0; text-align: right; color: #333; font-size: 14px;">
            ${formatCurrency(data.subtotal)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-size: 14px;">Versand:</td>
          <td style="padding: 8px 0; text-align: right; color: #333; font-size: 14px;">
            ${data.shipping === 0 ? 'Kostenlos' : formatCurrency(data.shipping)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-size: 14px;">MwSt. (${(data.tax / data.subtotal * 100).toFixed(0)}%):</td>
          <td style="padding: 8px 0; text-align: right; color: #333; font-size: 14px;">
            ${formatCurrency(data.tax)}
          </td>
        </tr>
        <tr style="border-top: 2px solid #d4a574;">
          <td style="padding: 15px 0 0 0; color: #333; font-size: 18px; font-weight: 700;">Gesamt:</td>
          <td style="padding: 15px 0 0 0; text-align: right; color: #d4a574; font-size: 20px; font-weight: 700;">
            ${formatCurrency(data.total)}
          </td>
        </tr>
      </table>
    </div>

    <!-- Shipping Address -->
    <h3 style="color: #d4a574; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
      Lieferadresse
    </h3>
    
    <div style="background-color: #fafafa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
      <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.8;">
        <strong>${data.customerName}</strong><br>
        ${data.shippingAddress.street}<br>
        ${data.shippingAddress.postalCode} ${data.shippingAddress.city}<br>
        ${data.shippingAddress.country}
      </p>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 40px 0 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/profile/orders/${data.orderId}" 
         style="display: inline-block; background: linear-gradient(135deg, #d4a574 0%, #c9984a 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(212, 165, 116, 0.3);">
        Bestellung verfolgen
      </a>
    </div>

    <!-- Footer Note -->
    <div style="background-color: #fff8f0; border-left: 4px solid #d4a574; padding: 15px; margin: 25px 0 0 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #666;">
        Sie erhalten eine weitere E-Mail, sobald Ihre Bestellung versandt wurde.
      </p>
    </div>

  </div>

  <!-- Footer -->
  <div style="background-color: #ffffff; padding: 30px; text-align: center; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-top: 2px;">
    <p style="margin: 0 0 10px 0; color: #666; font-size: 13px;">
      Bei Fragen zu Ihrer Bestellung kontaktieren Sie uns gerne:
    </p>
    <p style="margin: 0 0 20px 0;">
      <a href="mailto:kontakt@beautysalon.de" style="color: #d4a574; text-decoration: none; font-size: 14px;">kontakt@beautysalon.de</a>
    </p>
    <div style="border-top: 1px solid #f0f0f0; padding-top: 20px; margin-top: 20px;">
      <p style="margin: 5px 0; color: #999; font-size: 12px;">© 2024 Beauty Salon. Alle Rechte vorbehalten.</p>
      <p style="margin: 5px 0; color: #999; font-size: 12px;">Hildesheimer Str. 22, 30169 Hannover</p>
    </div>
  </div>

</body>
</html>
  `;
}