// lib/email/templates/statusUpdate.ts

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

/**
 * Get status display text in German
 */
function getStatusText(status: string): { text: string; color: string } {
  const statusMap: Record<string, { text: string; color: string }> = {
    pending: { text: 'Ausstehend', color: '#f59e0b' },
    processing: { text: 'In Bearbeitung', color: '#3b82f6' },
    shipped: { text: 'Versandt', color: '#8b5cf6' },
    delivered: { text: 'Zugestellt', color: '#10b981' },
    cancelled: { text: 'Storniert', color: '#ef4444' },
  };
  return statusMap[status] || { text: status, color: '#6b7280' };
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
 * Generate order status update HTML email template
 */
export function generateOrderStatusHTML(data: OrderEmailData): string {
  const statusInfo = getStatusText(data.status);

  let statusMessage = '';
  let statusIcon = '';

  switch (data.status) {
    case 'processing':
      statusIcon = '⚙️';
      statusMessage = 'Ihre Bestellung wird gerade bearbeitet und für den Versand vorbereitet.';
      break;
    case 'shipped':
      statusIcon = '📦';
      statusMessage = 'Ihre Bestellung wurde versandt und ist unterwegs zu Ihnen!';
      break;
    case 'delivered':
      statusIcon = '✓';
      statusMessage = 'Ihre Bestellung wurde erfolgreich zugestellt. Wir hoffen, Sie sind zufrieden!';
      break;
    case 'cancelled':
      statusIcon = '✕';
      statusMessage = 'Ihre Bestellung wurde storniert. Bei Fragen kontaktieren Sie uns bitte.';
      break;
    default:
      statusIcon = 'ℹ️';
      statusMessage = 'Der Status Ihrer Bestellung wurde aktualisiert.';
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bestellstatus aktualisiert</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff;">
  
  <!-- Header -->
  <div style="background-color: #ffffff; padding: 40px 30px; text-align: center; border-bottom: 1px solid #e7e5e4;">
    <h1 style="font-family: Georgia, serif; color: #1c1917; margin: 0; font-size: 32px; font-weight: 400; letter-spacing: 0.5px;">
      Beauty Salon
    </h1>
    <p style="color: #78716c; margin: 10px 0 0 0; font-size: 14px;">Bestellstatus aktualisiert</p>
  </div>

  <!-- Content -->
  <div style="background-color: #ffffff; padding: 40px 30px;">
    
    <!-- Status Badge -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background-color: #1c1917; color: #ffffff; padding: 12px 30px; font-size: 16px; font-weight: 500; border: 1px solid #1c1917;">
        ${statusInfo.text}
      </div>
    </div>

    <h2 style="font-family: Georgia, serif; color: #1c1917; margin: 0 0 20px 0; font-size: 22px; font-weight: 400; text-align: center;">
      Hallo ${data.customerName}
    </h2>
    
    <p style="font-size: 16px; color: #78716c; margin: 20px 0; text-align: center;">
      ${statusMessage}
    </p>

    <!-- Order Info -->
    <div style="background-color: #fafaf9; padding: 25px; margin: 30px 0; border: 1px solid #e7e5e4;">
      <table style="width: 100%;">
        <tr>
          <td style="padding: 8px 0; color: #78716c; font-size: 14px;">Bestellnummer:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1c1917; font-size: 14px;">
            #${data.orderNumber}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #78716c; font-size: 14px;">Bestelldatum:</td>
          <td style="padding: 8px 0; text-align: right; color: #1c1917; font-size: 14px;">
            ${formatDate(data.createdAt)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #78716c; font-size: 14px;">Gesamtsumme:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1c1917; font-size: 16px;">
            ${formatCurrency(data.total)}
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 35px 0;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/profile/orders/${data.orderId}" 
         style="display: inline-block; background-color: #1c1917; color: #ffffff; text-decoration: none; padding: 14px 40px; font-size: 14px; font-weight: 500; border: 1px solid #1c1917; transition: all 0.2s;">
        Details anzeigen
      </a>
    </div>

  </div>

  <!-- Footer -->
  <div style="background-color: #fafaf9; padding: 30px; text-align: center; border-top: 1px solid #e7e5e4;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 10px; text-align: center;">
          <p style="margin: 0 0 5px 0; color: #78716c; font-size: 13px;">Bei Fragen kontaktieren Sie uns</p>
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