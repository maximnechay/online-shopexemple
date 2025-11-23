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
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fafafa;">
  
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #f5f5dc 0%, #d4a574 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 28px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      Beauty Salon
    </h1>
    <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">Bestellstatus aktualisiert</p>
  </div>

  <!-- Content -->
  <div style="background-color: #ffffff; padding: 40px 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
    
    <!-- Status Badge -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background-color: ${statusInfo.color}; color: #ffffff; padding: 12px 30px; border-radius: 25px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        ${statusIcon} ${statusInfo.text}
      </div>
    </div>

    <h2 style="color: #333; margin: 0 0 20px 0; font-size: 22px; text-align: center;">
      Hallo ${data.customerName}!
    </h2>
    
    <p style="font-size: 16px; color: #555; margin: 20px 0; text-align: center;">
      ${statusMessage}
    </p>

    <!-- Order Info -->
    <div style="background-color: #fafafa; padding: 25px; border-radius: 8px; margin: 30px 0;">
      <table style="width: 100%;">
        <tr>
          <td style="padding: 8px 0; color: #666; font-size: 14px;">Bestellnummer:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #333; font-size: 14px;">
            #${data.orderNumber}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-size: 14px;">Bestelldatum:</td>
          <td style="padding: 8px 0; text-align: right; color: #333; font-size: 14px;">
            ${formatDate(data.createdAt)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-size: 14px;">Gesamtsumme:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #d4a574; font-size: 16px;">
            ${formatCurrency(data.total)}
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 35px 0;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/profile/orders/${data.orderId}" 
         style="display: inline-block; background: linear-gradient(135deg, #d4a574 0%, #c9984a 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(212, 165, 116, 0.3);">
        Details anzeigen
      </a>
    </div>

  </div>

  <!-- Footer -->
  <div style="background-color: #ffffff; padding: 30px; text-align: center; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-top: 2px;">
    <p style="margin: 0 0 10px 0; color: #666; font-size: 13px;">
      Bei Fragen kontaktieren Sie uns:
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