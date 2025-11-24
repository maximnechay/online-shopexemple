import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || 'Beauty Salon <noreply@xinvestai.com>';

interface Recipient {
    email: string;
    name?: string;
}

interface SendRequest {
    subject: string;
    message: string;
    recipients: Recipient[];
}

export async function POST(request: NextRequest) {
    try {
        const { subject, message, recipients }: SendRequest = await request.json();

        // Валидация
        if (!subject || typeof subject !== 'string') {
            return NextResponse.json(
                { error: 'Betreff ist erforderlich' },
                { status: 400 }
            );
        }

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { error: 'Nachricht ist erforderlich' },
                { status: 400 }
            );
        }

        if (!Array.isArray(recipients) || recipients.length === 0) {
            return NextResponse.json(
                { error: 'Keine Empfänger angegeben' },
                { status: 400 }
            );
        }

        console.log(`📧 Email-Rассылка initiiert:`);
        console.log(`   Betreff: "${subject}"`);
        console.log(`   Empfänger: ${recipients.length}`);

        // Отправляем email каждому получателю
        const results = await Promise.allSettled(
            recipients.map(async (recipient) => {
                return await resend.emails.send({
                    from: FROM_EMAIL,
                    to: recipient.email,
                    subject: subject,
                    html: generateNewsletterHTML(subject, message, recipient.email),
                });
            })
        );

        // Подсчитываем результаты
        const successful = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.length - successful;

        console.log(`✅ E-Mails gesendet: ${successful} erfolgreich, ${failed} fehlgeschlagen`);

        // Логируем каждого получателя
        recipients.forEach((recipient, index) => {
            const result = results[index];
            const status = result.status === 'fulfilled' ? '✅' : '❌';
            console.log(`   ${status} ${recipient.email} (${recipient.name || 'Unbekannt'})`);
        });

        return NextResponse.json({
            success: true,
            message: 'E-Mails erfolgreich gesendet',
            stats: {
                total: recipients.length,
                successful,
                failed,
            },
        });
    } catch (error) {
        console.error('❌ Error sending newsletter emails:', error);
        return NextResponse.json(
            { error: 'Fehler beim Senden der E-Mails' },
            { status: 500 }
        );
    }
}

// Генерация красивого HTML для рассылки
function generateNewsletterHTML(subject: string, message: string, recipientEmail: string): string {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const unsubscribeUrl = `${siteUrl}/unsubscribe?email=${encodeURIComponent(recipientEmail)}`;

    return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 0;">
        <tr>
            <td align="center">
                <!-- Main Container -->
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #ec4899 0%, #be185d 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                                Beauty Salon
                            </h1>
                            <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                                Exklusive Angebote für Sie
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <div style="color: #111827; font-size: 16px; line-height: 1.6;">
                                ${message}
                            </div>
                        </td>
                    </tr>

                    <!-- CTA Button (optional) -->
                    <tr>
                        <td style="padding: 0 30px 40px 30px; text-align: center;">
                            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/catalog" 
                               style="display: inline-block; background-color: #ec4899; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; transition: background-color 0.3s;">
                                Jetzt einkaufen
                            </a>
                        </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                        <td style="padding: 0 30px;">
                            <div style="border-top: 1px solid #e5e7eb;"></div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; text-align: center; color: #6b7280; font-size: 13px;">
                            <p style="margin: 0 0 10px 0;">
                                Sie erhalten diese E-Mail, weil Sie sich für unseren Newsletter angemeldet haben.
                            </p>
                            <p style="margin: 0 0 10px 0;">
                                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}" style="color: #ec4899; text-decoration: none;">Beauty Salon Shop besuchen</a>
                                 | 
                                <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Abmelden</a>
                            </p>
                            <p style="margin: 0 0 10px 0;">
                                <strong>Beauty Salon</strong><br>
                                Musterstraße 123, 10115 Berlin, Deutschland<br>
                                Telefon: +49 30 12345678<br>
                                E-Mail: info@beautysalon.de
                            </p>
                            <p style="margin: 10px 0 0 0;">
                                © ${new Date().getFullYear()} Beauty Salon. Alle Rechte vorbehalten.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}
