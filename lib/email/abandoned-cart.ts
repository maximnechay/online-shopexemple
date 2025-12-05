// lib/email/abandoned-cart.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://elegance-beauty.de';
const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev';

interface CartItem {
    product_id: string;
    name: string;
    slug: string;
    price: number;
    quantity: number;
    image?: string;
}

interface AbandonedCart {
    id: string;
    email: string;
    cart_items: CartItem[];
    cart_total: number;
    recovery_token: string;
    coupon_code?: string;
    created_at: string;
}

/**
 * Email #1: Через 1 час - Напоминание о корзине
 */
export async function sendAbandonedCartEmail1h(cart: AbandonedCart): Promise<boolean> {
    try {
        const recoveryUrl = `${SITE_URL}/cart/recover?token=${cart.recovery_token}`;

        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: cart.email,
            subject: '✨ Sie haben etwas Wunderschönes vergessen! 🛍️',
            html: generateEmail1hHTML(cart, recoveryUrl),
        });

        if (error) {
            console.error('Error sending 1h email:', error);
            return false;
        }

        console.log('1h abandoned cart email sent:', data?.id);
        return true;
    } catch (error) {
        console.error('Failed to send 1h email:', error);
        return false;
    }
}

/**
 * Email #2: Через 24 часа - С купоном 10%
 */
export async function sendAbandonedCartEmail24h(cart: AbandonedCart): Promise<boolean> {
    try {
        const recoveryUrl = `${SITE_URL}/cart/recover?token=${cart.recovery_token}`;

        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: cart.email,
            subject: '🎁 Nur für Sie: 10% Rabatt wartet! ✨',
            html: generateEmail24hHTML(cart, recoveryUrl),
        });

        if (error) {
            console.error('Error sending 24h email:', error);
            return false;
        }

        console.log('24h abandoned cart email sent:', data?.id);
        return true;
    } catch (error) {
        console.error('Failed to send 24h email:', error);
        return false;
    }
}

/**
 * Email #3: Через 3 дня - Последний шанс
 */
export async function sendAbandonedCartEmail3d(cart: AbandonedCart): Promise<boolean> {
    try {
        const recoveryUrl = `${SITE_URL}/cart/recover?token=${cart.recovery_token}`;

        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: cart.email,
            subject: '⏰ Letzte Chance! Ihre Lieblinge warten noch 💝',
            html: generateEmail3dHTML(cart, recoveryUrl),
        });

        if (error) {
            console.error('Error sending 3d email:', error);
            return false;
        }

        console.log('3d abandoned cart email sent:', data?.id);
        return true;
    } catch (error) {
        console.error('Failed to send 3d email:', error);
        return false;
    }
}

// ============================================================================
// EMAIL HTML TEMPLATES
// ============================================================================

function generateEmail1hHTML(cart: AbandonedCart, recoveryUrl: string): string {
    const items = Array.isArray(cart.cart_items) ? cart.cart_items : [];

    const itemsHTML = items.map(item => `
        <tr>
            <td style="padding: 15px; border-bottom: 1px solid #e7e5e4;">
                <strong style="color: #1c1917; font-size: 15px;">${item.name}</strong>
                <div style="color: #78716c; font-size: 13px; margin-top: 5px;">Menge: ${item.quantity}</div>
            </td>
            <td style="padding: 15px; border-bottom: 1px solid #e7e5e4; text-align: right; color: #1c1917; font-weight: 600;">
                €${(item.price * item.quantity).toFixed(2)}
            </td>
        </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ihr Warenkorb wartet</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff;">
    
    <!-- Header -->
    <div style="background-color: #ffffff; padding: 40px 30px; text-align: center; border-bottom: 1px solid #e7e5e4;">
        <h1 style="font-family: Georgia, serif; color: #1c1917; margin: 0; font-size: 32px; font-weight: 400; letter-spacing: 0.5px;">
            Beauty Salon
        </h1>
        <p style="color: #78716c; margin: 10px 0 0 0; font-size: 14px;">Ihr Warenkorb wartet auf Sie</p>
    </div>

    <!-- Content -->
    <div style="background-color: #ffffff; padding: 40px 30px;">
        
        <!-- Message -->
        <div style="background-color: #fafaf9; border-left: 1px solid #1c1917; padding: 20px; margin-bottom: 30px;">
            <h2 style="font-family: Georgia, serif; color: #1c1917; margin: 0 0 10px 0; font-size: 20px; font-weight: 400;">
                Sie haben etwas Wunderschönes vergessen
            </h2>
            <p style="margin: 0; color: #78716c; font-size: 14px;">
                Ihre ausgewählten Produkte warten noch in Ihrem Warenkorb. 
                Schließen Sie Ihren Einkauf jetzt ab, solange die Produkte verfügbar sind.
            </p>
        </div>

        <!-- Items -->
        <h3 style="font-family: Georgia, serif; color: #1c1917; margin: 30px 0 15px 0; font-size: 18px; font-weight: 400; border-bottom: 1px solid #e7e5e4; padding-bottom: 10px;">
            Ihre Auswahl
        </h3>
        
        <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
            ${itemsHTML}
        </table>

        <!-- Total -->
        <div style="background-color: #fafaf9; padding: 20px; margin: 20px 0; border: 1px solid #e7e5e4;">
            <table style="width: 100%;">
                <tr>
                    <td style="padding: 8px 0; color: #1c1917; font-size: 18px; font-weight: 600;">Gesamt:</td>
                    <td style="padding: 8px 0; text-align: right; color: #1c1917; font-size: 20px; font-weight: 600;">
                        €${cart.cart_total.toFixed(2)}
                    </td>
                </tr>
            </table>
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin: 40px 0 30px 0;">
            <a href="${recoveryUrl}" 
               style="display: inline-block; background-color: #1c1917; color: #ffffff; text-decoration: none; padding: 14px 40px; font-size: 14px; font-weight: 500; border: 1px solid #1c1917;">
                Zum Warenkorb
            </a>
        </div>

        <!-- Note -->
        <div style="background-color: #fafaf9; border-left: 1px solid #e7e5e4; padding: 15px; margin: 25px 0 0 0;">
            <p style="margin: 0; font-size: 14px; color: #78716c;">
                Dieser Link ist 7 Tage gültig. Danach werden die Artikel aus Ihrem Warenkorb entfernt.
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
                </td>
            </tr>
        </table>
    </div>

</body>
</html>
    `.trim();
}

function generateEmail24hHTML(cart: AbandonedCart, recoveryUrl: string): string {
    const items = Array.isArray(cart.cart_items) ? cart.cart_items : [];
    const discountedTotal = cart.cart_total * 0.9; // 10% скидка
    const expirationDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ihr exklusiver 10% Rabatt</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #fafaf9;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e7e5e4;">
            <!-- Header -->
            <tr>
                <td style="padding: 30px 20px; text-align: center; border-bottom: 1px solid #e7e5e4;">
                    <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; color: #1c1917; font-weight: 400;">Ihr exklusiver Rabatt</h1>
                    <p style="margin: 10px 0 0 0; color: #78716c; font-size: 15px;">Wir schenken Ihnen 10% auf Ihren Warenkorb</p>
                </td>
            </tr>

            <!-- Coupon Code -->
            <tr>
                <td style="padding: 30px 20px; text-align: center; background-color: #fafaf9;">
                    <div style="border: 1px solid #e7e5e4; background-color: #ffffff; padding: 20px; margin: 0 20px;">
                        <p style="margin: 0 0 10px 0; color: #78716c; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Ihr Gutscheincode</p>
                        <p style="margin: 0; font-size: 24px; color: #1c1917; font-weight: 600; letter-spacing: 2px;">${cart.coupon_code}</p>
                        <p style="margin: 10px 0 0 0; color: #78716c; font-size: 13px;">Gültig bis ${expirationDate}</p>
                    </div>
                </td>
            </tr>

            <!-- Message -->
            <tr>
                <td style="padding: 30px 20px;">
                    <h2 style="margin: 0 0 15px 0; font-family: Georgia, serif; font-size: 20px; color: #1c1917; font-weight: 400;">Als Dankeschön für Ihr Interesse</h2>
                    <p style="margin: 0; color: #1c1917; font-size: 15px; line-height: 1.6;">
                        Wir haben Ihren Warenkorb gespeichert und möchten Ihnen als besonderes Dankeschön <strong>10% Rabatt</strong> anbieten. 
                        Verwenden Sie einfach den obigen Code beim Checkout.
                    </p>
                </td>
            </tr>

            <!-- Cart Items -->
            <tr>
                <td style="padding: 0 20px 20px 20px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fafaf9; border: 1px solid #e7e5e4;">
                        ${items.map(item => `
                        <tr>
                            <td style="padding: 15px; border-bottom: 1px solid #e7e5e4;">
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td width="70">
                                            ${item.image ? `
                                                <img src="${item.image}" alt="${item.name}" style="width: 70px; height: 70px; object-fit: cover; border: 1px solid #e7e5e4;">
                                            ` : ''}
                                        </td>
                                        <td style="padding-left: 15px;">
                                            <p style="margin: 0 0 5px 0; color: #1c1917; font-size: 15px; font-weight: 500;">${item.name}</p>
                                            <p style="margin: 0; color: #78716c; font-size: 14px;">Menge: ${item.quantity}</p>
                                        </td>
                                        <td style="text-align: right; vertical-align: top;">
                                            <p style="margin: 0 0 5px 0; color: #78716c; font-size: 14px; text-decoration: line-through;">€${item.price.toFixed(2)}</p>
                                            <p style="margin: 0; color: #1c1917; font-size: 16px; font-weight: 600;">€${(item.price * 0.9).toFixed(2)}</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        `).join('')}
                        
                        <!-- Savings Summary -->
                        <tr>
                            <td style="padding: 15px; background-color: #ffffff;">
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td>
                                            <p style="margin: 0; color: #78716c; font-size: 14px;">Zwischensumme</p>
                                        </td>
                                        <td style="text-align: right;">
                                            <p style="margin: 0; color: #78716c; font-size: 14px;">€${cart.cart_total.toFixed(2)}</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding-top: 5px;">
                                            <p style="margin: 0; color: #1c1917; font-size: 14px; font-weight: 500;">Rabatt (10%)</p>
                                        </td>
                                        <td style="text-align: right; padding-top: 5px;">
                                            <p style="margin: 0; color: #1c1917; font-size: 14px; font-weight: 500;">-€${(cart.cart_total * 0.1).toFixed(2)}</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding-top: 10px; border-top: 1px solid #e7e5e4;">
                                            <p style="margin: 10px 0 0 0; color: #1c1917; font-size: 16px; font-weight: 600;">Ihr Preis</p>
                                        </td>
                                        <td style="text-align: right; padding-top: 10px; border-top: 1px solid #e7e5e4;">
                                            <p style="margin: 10px 0 0 0; color: #1c1917; font-size: 18px; font-weight: 600;">€${discountedTotal.toFixed(2)}</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <!-- CTA Button -->
            <tr>
                <td style="padding: 30px 20px; text-align: center;">
                    <a href="${recoveryUrl}" style="display: inline-block; background-color: #1c1917; color: #ffffff; text-decoration: none; padding: 14px 40px; font-size: 15px; font-weight: 500; border: 1px solid #1c1917;">Jetzt einlösen</a>
                    <p style="margin: 15px 0 0 0; color: #78716c; font-size: 13px;">Gutschein gültig für 48 Stunden</p>
                </td>
            </tr>

            <!-- Footer -->
            <tr>
                <td style="padding: 20px; text-align: center; border-top: 1px solid #e7e5e4; background-color: #fafaf9;">
                    <p style="margin: 0 0 5px 0; color: #78716c; font-size: 13px;">Bei Fragen kontaktieren Sie uns gerne</p>
                    <a href="mailto:kontakt@beautysalon.de" style="color: #1c1917; text-decoration: none; font-size: 14px;">kontakt@beautysalon.de</a>
                </td>
            </tr>
            <tr>
                <td style="padding: 10px 20px; text-align: center; border-top: 1px solid #e7e5e4;">
                    <p style="margin: 0; color: #a8a29e; font-size: 12px;">© 2024 Beauty Salon</p>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
    `.trim();
}

function generateEmail3dHTML(cart: AbandonedCart, recoveryUrl: string): string {
    const items = Array.isArray(cart.cart_items) ? cart.cart_items : [];

    return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Letzte Chance - Ihre Produkte warten!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #fafaf9;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e7e5e4;">
            <!-- Header -->
            <tr>
                <td style="padding: 30px 20px; text-align: center; border-bottom: 1px solid #e7e5e4;">
                    <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; color: #1c1917; font-weight: 400;">Letzte Erinnerung</h1>
                    <p style="margin: 10px 0 0 0; color: #78716c; font-size: 15px;">Ihre ausgewählten Produkte warten noch</p>
                </td>
            </tr>

            <!-- Message -->
            <tr>
                <td style="padding: 30px 20px;">
                    <h2 style="margin: 0 0 15px 0; font-family: Georgia, serif; font-size: 20px; color: #1c1917; font-weight: 400;">Wir möchten Sie nicht verlieren</h2>
                    <p style="margin: 0 0 15px 0; color: #1c1917; font-size: 15px; line-height: 1.6;">
                        Dies ist unsere letzte Erinnerung bezüglich Ihres Warenkorbs.
                    </p>
                    <p style="margin: 0; color: #1c1917; font-size: 15px; line-height: 1.6;">
                        Die Verfügbarkeit der Produkte kann sich ändern, und wir möchten nicht, dass Sie Ihre Lieblingsprodukte verpassen.
                    </p>
                </td>
            </tr>

            <!-- Cart Items -->
            <tr>
                <td style="padding: 0 20px 20px 20px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fafaf9; border: 1px solid #e7e5e4;">
                        ${items.map(item => `
                        <tr>
                            <td style="padding: 15px; border-bottom: 1px solid #e7e5e4;">
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td width="70">
                                            ${item.image ? `
                                                <img src="${item.image}" alt="${item.name}" style="width: 70px; height: 70px; object-fit: cover; border: 1px solid #e7e5e4;">
                                            ` : ''}
                                        </td>
                                        <td style="padding-left: 15px;">
                                            <p style="margin: 0 0 5px 0; color: #1c1917; font-size: 15px; font-weight: 500;">${item.name}</p>
                                            <p style="margin: 0 0 5px 0; color: #78716c; font-size: 14px;">Menge: ${item.quantity}</p>
                                            <p style="margin: 0; color: #78716c; font-size: 13px; font-style: italic;">Begrenzte Verfügbarkeit</p>
                                        </td>
                                        <td style="text-align: right; vertical-align: top;">
                                            <p style="margin: 0; color: #1c1917; font-size: 16px; font-weight: 600;">€${item.price.toFixed(2)}</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        `).join('')}
                        
                        <!-- Total -->
                        <tr>
                            <td style="padding: 15px; background-color: #ffffff; border-top: 1px solid #e7e5e4;">
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td>
                                            <p style="margin: 0; color: #1c1917; font-size: 16px; font-weight: 600;">Gesamt</p>
                                        </td>
                                        <td style="text-align: right;">
                                            <p style="margin: 0; color: #1c1917; font-size: 18px; font-weight: 600;">€${cart.cart_total.toFixed(2)}</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            ${cart.coupon_code ? `
            <!-- Coupon Reminder -->
            <tr>
                <td style="padding: 0 20px 20px 20px;">
                    <div style="background-color: #fafaf9; border-left: 3px solid #1c1917; padding: 15px;">
                        <p style="margin: 0 0 5px 0; color: #1c1917; font-size: 14px; font-weight: 500;">Ihr Gutschein ist noch gültig</p>
                        <p style="margin: 0; color: #78716c; font-size: 14px;">Code <strong>${cart.coupon_code}</strong> für 10% Rabatt</p>
                    </div>
                </td>
            </tr>
            ` : ''}

            <!-- CTA Button -->
            <tr>
                <td style="padding: 30px 20px; text-align: center;">
                    <a href="${recoveryUrl}" style="display: inline-block; background-color: #1c1917; color: #ffffff; text-decoration: none; padding: 14px 40px; font-size: 15px; font-weight: 500; border: 1px solid #1c1917;">Jetzt abschließen</a>
                    <p style="margin: 15px 0 0 0; color: #78716c; font-size: 13px;">Dies ist Ihre letzte Erinnerung</p>
                </td>
            </tr>

            <!-- Social Proof -->
            <tr>
                <td style="padding: 20px; background-color: #fafaf9; border-top: 1px solid #e7e5e4;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                            <td style="text-align: center; padding-bottom: 10px;">
                                <p style="margin: 0; color: #1c1917; font-size: 16px;">⭐⭐⭐⭐⭐</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align: center; padding-bottom: 5px;">
                                <p style="margin: 0; color: #1c1917; font-size: 14px; font-style: italic;">"Ausgezeichnete Qualität und schnelle Lieferung!"</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align: center;">
                                <p style="margin: 0; color: #78716c; font-size: 13px;">Über 10.000 zufriedene Kunden</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <!-- Note -->
            <tr>
                <td style="padding: 20px; text-align: center; border-top: 1px solid #e7e5e4;">
                    <p style="margin: 0; color: #78716c; font-size: 13px; line-height: 1.5;">
                        Ihr Warenkorb wird in Kürze automatisch gelöscht.<br>
                        Schließen Sie jetzt Ihre Bestellung ab.
                    </p>
                </td>
            </tr>

            <!-- Footer -->
            <tr>
                <td style="padding: 20px; text-align: center; border-top: 1px solid #e7e5e4; background-color: #fafaf9;">
                    <p style="margin: 0 0 5px 0; color: #78716c; font-size: 13px;">Bei Fragen kontaktieren Sie uns gerne</p>
                    <a href="mailto:kontakt@beautysalon.de" style="color: #1c1917; text-decoration: none; font-size: 14px;">kontakt@beautysalon.de</a>
                </td>
            </tr>
            <tr>
                <td style="padding: 10px 20px; text-align: center; border-top: 1px solid #e7e5e4;">
                    <p style="margin: 0; color: #a8a29e; font-size: 12px;">© 2024 Beauty Salon</p>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
    `.trim();
}
