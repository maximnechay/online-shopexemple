import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { subject, message } = await request.json();

        // Используем ту же функцию генерации HTML, что и в send/route.ts
        const emailHTML = generateNewsletterHTML(
            subject || 'Betreffzeile erscheint hier...',
            message || '<p style="color: #9ca3af; font-style: italic;">Ihre Nachricht erscheint hier...</p>',
            'kunde@example.com'
        );

        return NextResponse.json({
            success: true,
            html: emailHTML,
        });
    } catch (error) {
        console.error('Error generating preview:', error);
        return NextResponse.json(
            { error: 'Fehler beim Generieren der Vorschau' },
            { status: 500 }
        );
    }
}

// Та же функция генерации HTML, что и в send/route.ts
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
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafaf9;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafaf9; padding: 40px 20px;">
        <tr>
            <td align="center">
                <!-- Main Container -->
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 0; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); border: 1px solid #e7e5e4;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #ffffff; padding: 48px 40px 32px 40px; border-bottom: 1px solid #e7e5e4;">
                            <h1 style="margin: 0; color: #1c1917; font-size: 32px; font-weight: 300; letter-spacing: -0.02em; line-height: 1.2; font-family: Georgia, 'Times New Roman', serif;">
                                Beauty Salon
                            </h1>
                            <p style="margin: 8px 0 0 0; color: #78716c; font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase;">
                                Exklusive Angebote
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 48px 40px;">
                            <div style="color: #1c1917; font-size: 16px; line-height: 1.7;">
                                ${message}
                            </div>
                        </td>
                    </tr>

                    <!-- CTA Button -->
                    <tr>
                        <td style="padding: 0 40px 48px 40px; text-align: center;">
                            <a href="${siteUrl}/catalog" 
                               style="display: inline-block; background-color: #1c1917; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 0; font-weight: 500; font-size: 15px; letter-spacing: 0.02em; transition: background-color 0.2s;">
                                Jetzt einkaufen
                            </a>
                        </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="border-top: 1px solid #e7e5e4;"></div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px 40px; background-color: #fafaf9;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="text-align: center; color: #78716c; font-size: 13px; line-height: 1.6;">
                                        <p style="margin: 0 0 12px 0;">
                                            Sie erhalten diese E-Mail, weil Sie sich für unseren Newsletter angemeldet haben.
                                        </p>
                                        <p style="margin: 0 0 16px 0;">
                                            <a href="${siteUrl}" style="color: #1c1917; text-decoration: none; border-bottom: 1px solid #d6d3d1;">Beauty Salon besuchen</a>
                                            <span style="color: #d6d3d1; margin: 0 8px;">|</span>
                                            <a href="${unsubscribeUrl}" style="color: #78716c; text-decoration: none; border-bottom: 1px solid #e7e5e4;">Abmelden</a>
                                        </p>
                                        <p style="margin: 0 0 4px 0; color: #1c1917; font-weight: 500;">
                                            Beauty Salon
                                        </p>
                                        <p style="margin: 0; line-height: 1.8;">
                                            Musterstraße 123<br>
                                            10115 Berlin, Deutschland<br>
                                            <a href="tel:+493012345678" style="color: #78716c; text-decoration: none;">+49 30 12345678</a><br>
                                            <a href="mailto:info@beautysalon.de" style="color: #78716c; text-decoration: none;">info@beautysalon.de</a>
                                        </p>
                                        <p style="margin: 16px 0 0 0; color: #a8a29e; font-size: 12px;">
                                            © ${new Date().getFullYear()} Beauty Salon. Alle Rechte vorbehalten.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>
                
                <!-- Spacer -->
                <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
                    <tr>
                        <td style="text-align: center; color: #a8a29e; font-size: 11px; line-height: 1.5;">
                            <p style="margin: 0;">
                                Diese E-Mail wurde an ${recipientEmail} gesendet.
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
