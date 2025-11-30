// app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

const getResend = () => new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';

/**
 * POST /api/contact
 * Отправка контактной формы
 */
export async function POST(request: NextRequest) {
    // Rate limiting - 5 requests per hour to prevent spam
    const rateLimitResult = rateLimit(request, RATE_LIMITS.contact);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' },
            {
                status: 429,
                headers: { 'Retry-After': rateLimitResult.retryAfter.toString() }
            }
        );
    }

    try {
        const { name, email, subject, message } = await request.json();

        console.log('📧 Contact form submission:', { name, email, subject });

        // Валидация
        if (!name || !email || !subject || !message) {
            return NextResponse.json(
                { error: 'Alle Felder sind erforderlich' },
                { status: 400 }
            );
        }

        // Определяем тему письма
        const subjectMap: Record<string, string> = {
            product: 'Produktanfrage',
            order: 'Bestellung & Lieferung',
            advice: 'Beratung',
            other: 'Sonstiges',
        };

        const subjectText = subjectMap[subject] || subject;

        // HTML шаблон письма админу
        const adminEmailHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f9fafb;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); padding: 30px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📧 Neue Kontaktanfrage</h1>
            <p style="color: #d1d5db; margin: 10px 0 0 0; font-size: 14px;">Beauty Salon Kontaktformular</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
            
            <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
                <strong style="color: #1e40af; font-size: 15px;">📋 ${subjectText}</strong>
            </div>

            <div style="margin-bottom: 25px;">
                <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                    Kontaktdaten
                </h2>
                
                <table style="width: 100%; background-color: #f9fafb; padding: 15px; border-radius: 8px;">
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 30%;">Name:</td>
                        <td style="padding: 8px 0; font-weight: 600; color: #1f2937; font-size: 14px;">${name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">E-Mail:</td>
                        <td style="padding: 8px 0;">
                            <a href="mailto:${email}" style="color: #3b82f6; text-decoration: none; font-size: 14px;">${email}</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Datum:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">
                            ${new Date().toLocaleDateString('de-DE', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })}
                        </td>
                    </tr>
                </table>
            </div>

            <div style="margin-bottom: 25px;">
                <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                    Nachricht
                </h2>
                <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #1f2937; font-size: 14px; line-height: 1.8; white-space: pre-wrap;">${message}</p>
                </div>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <a href="mailto:${email}" 
                   style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-size: 14px; font-weight: 600;">
                    📧 Antworten
                </a>
            </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">
                Diese E-Mail wurde automatisch generiert vom Kontaktformular
            </p>
            <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 11px;">
                Beauty Salon © ${new Date().getFullYear()}
            </p>
        </div>

    </div>
</body>
</html>
        `;

        // HTML шаблон подтверждения для клиента
        const customerEmailHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #fafafa;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f5f5dc 0%, #d4a574 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                Beauty Salon
            </h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">Vielen Dank für Ihre Nachricht</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
            
            <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
                <h2 style="color: #059669; margin: 0 0 10px 0; font-size: 20px;">
                    ✓ Nachricht erhalten!
                </h2>
                <p style="margin: 0; color: #047857; font-size: 14px;">
                    Wir haben Ihre Anfrage erhalten und werden uns schnellstmöglich bei Ihnen melden.
                </p>
            </div>

            <p style="margin: 0 0 20px 0; color: #666; font-size: 15px;">
                Hallo <strong>${name}</strong>,
            </p>

            <p style="margin: 0 0 20px 0; color: #666; font-size: 15px;">
                vielen Dank für Ihre Kontaktaufnahme bezüglich <strong>${subjectText}</strong>. 
                Wir haben Ihre Nachricht erhalten und werden sie so schnell wie möglich bearbeiten.
            </p>

            <div style="background-color: #fafafa; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">Ihre Nachricht:</h3>
                <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.8; white-space: pre-wrap;">${message}</p>
            </div>

            <p style="margin: 25px 0 0 0; color: #666; font-size: 15px;">
                In der Zwischenzeit können Sie gerne unseren <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/catalog" style="color: #d4a574; text-decoration: none; font-weight: 600;">Online-Shop</a> besuchen oder uns direkt kontaktieren.
            </p>

        </div>

        <!-- Footer -->
        <div style="background-color: #ffffff; padding: 30px; text-align: center; border-top: 1px solid #f0f0f0;">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 13px;">
                Bei weiteren Fragen:
            </p>
            <p style="margin: 0 0 20px 0;">
                <a href="mailto:${ADMIN_EMAIL}" style="color: #d4a574; text-decoration: none; font-size: 14px;">${ADMIN_EMAIL}</a>
            </p>
            <div style="border-top: 1px solid #f0f0f0; padding-top: 20px; margin-top: 20px;">
                <p style="margin: 5px 0; color: #999; font-size: 12px;">© ${new Date().getFullYear()} Beauty Salon. Alle Rechte vorbehalten.</p>
            </div>
        </div>

    </div>
</body>
</html>
        `;

        // Отправляем письмо админу
        console.log('📤 Sending email to admin:', ADMIN_EMAIL);
        const resend = getResend();
        const adminEmail = await resend.emails.send({
            from: EMAIL_FROM,
            to: ADMIN_EMAIL,
            subject: `Kontaktanfrage: ${subjectText} - ${name}`,
            html: adminEmailHTML,
            replyTo: email,
        });

        console.log('✅ Admin email sent:', adminEmail);

        // Отправляем подтверждение клиенту
        console.log('📤 Sending confirmation to customer:', email);
        const customerEmail = await resend.emails.send({
            from: EMAIL_FROM,
            to: email,
            subject: `Wir haben Ihre Nachricht erhalten - Beauty Salon`,
            html: customerEmailHTML,
        });

        console.log('✅ Customer confirmation sent:', customerEmail);

        return NextResponse.json({
            success: true,
            message: 'Nachricht erfolgreich gesendet',
        });
    } catch (error: any) {
        console.error('❌ Error sending contact form:', error);
        return NextResponse.json(
            { error: error.message || 'Fehler beim Senden der Nachricht' },
            { status: 500 }
        );
    }
}
