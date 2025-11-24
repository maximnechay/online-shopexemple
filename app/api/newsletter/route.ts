// app/api/newsletter/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

const getResend = () => new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
    // Rate limiting - 5 requests per hour
    const rateLimitResult = rateLimit(request, RATE_LIMITS.newsletter);
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
        const { email } = await request.json();

        // Validation
        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Save to database
        const supabase = supabaseAdmin;

        // Check if email already exists
        const { data: existingSubscriber } = await supabase
            .from('newsletter_subscribers')
            .select('id, email, is_active')
            .eq('email', email.toLowerCase())
            .single();

        if (existingSubscriber) {
            if (existingSubscriber.is_active) {
                return NextResponse.json(
                    { error: 'Diese E-Mail-Adresse ist bereits angemeldet' },
                    { status: 400 }
                );
            } else {
                // Reactivate subscription
                const { error: updateError } = await supabase
                    .from('newsletter_subscribers')
                    .update({
                        is_active: true,
                        subscribed_at: new Date().toISOString(),
                        unsubscribed_at: null
                    })
                    .eq('id', existingSubscriber.id);

                if (updateError) {
                    console.error('❌ Error reactivating subscription:', updateError);
                    throw updateError;
                }

                console.log('✅ Subscription reactivated for:', email);
            }
        } else {
            // Insert new subscriber
            const { error: insertError } = await supabase
                .from('newsletter_subscribers')
                .insert({
                    email: email.toLowerCase(),
                    source: 'homepage',
                    is_active: true
                });

            if (insertError) {
                console.error('❌ Error saving subscriber:', insertError);
                throw insertError;
            }

            console.log('✅ New subscriber saved to database:', email);
        }

        const fromEmail = process.env.EMAIL_FROM || 'Beauty Salon <noreply@xinvestai.com>';
        const adminEmail = process.env.ADMIN_EMAIL || 'nechay1996@gmail.com';

        console.log('📧 Sending newsletter subscription emails...');

        const resend = getResend();

        // Send notification to admin
        const adminEmailPromise = resend.emails.send({
            from: fromEmail,
            to: adminEmail,
            subject: 'Neue Newsletter-Anmeldung',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Neue Newsletter-Anmeldung</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #ffffff;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
                        <tr>
                            <td align="center">
                                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e7e5e4;">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background-color: #1c1917; padding: 30px 20px; text-align: center; border-bottom: 1px solid #e7e5e4;">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-family: Georgia, serif; font-weight: 400; letter-spacing: 0.5px;">
                                                Neue Newsletter-Anmeldung
                                            </h1>
                                            <p style="margin: 10px 0 0 0; color: #a8a29e; font-size: 14px;">Beauty Salon Admin</p>
                                        </td>
                                    </tr>

                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 30px;">
                                            <p style="margin: 0 0 24px 0; color: #78716c; font-size: 16px; line-height: 1.6;">
                                                Ein neuer Kunde hat sich für den Newsletter angemeldet:
                                            </p>

                                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafaf9; border: 1px solid #e7e5e4; padding: 20px; margin-bottom: 24px;">
                                                <tr>
                                                    <td>
                                                        <p style="margin: 0 0 8px 0; color: #78716c; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
                                                            Email-Adresse
                                                        </p>
                                                        <p style="margin: 0; color: #1c1917; font-size: 16px; font-weight: 600;">
                                                            ${email}
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>

                                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafaf9; border-left: 1px solid #1c1917; padding: 15px; margin-bottom: 24px;">
                                                <tr>
                                                    <td>
                                                        <p style="margin: 0; color: #78716c; font-size: 14px; line-height: 1.5;">
                                                            Fügen Sie diese Email-Adresse zu Ihrer Newsletter-Liste hinzu, um exklusive Angebote und Updates zu versenden.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>

                                            <p style="margin: 0; color: #78716c; font-size: 13px; line-height: 1.6;">
                                                Anmeldedatum: ${new Date().toLocaleString('de-DE', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}
                                            </p>
                                        </td>
                                    </tr>

                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #fafaf9; padding: 30px; text-align: center; border-top: 1px solid #e7e5e4;">
                                            <table width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td style="padding: 10px; text-align: center;">
                                                        <p style="margin: 0; color: #78716c; font-size: 13px;">Diese Nachricht wurde automatisch generiert</p>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 10px 10px 0 10px; text-align: center; border-top: 1px solid #e7e5e4;">
                                                        <p style="margin: 0; color: #a8a29e; font-size: 12px;">Beauty Salon Admin System</p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `
        });

        // Send confirmation to customer
        const customerEmailPromise = resend.emails.send({
            from: fromEmail,
            to: email,
            subject: 'Willkommen bei unserem Newsletter',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Newsletter-Anmeldung bestätigt</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #ffffff;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
                        <tr>
                            <td align="center">
                                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff;">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background-color: #ffffff; padding: 40px 30px; text-align: center; border-bottom: 1px solid #e7e5e4;">
                                            <h1 style="margin: 0 0 8px 0; color: #1c1917; font-size: 32px; font-family: Georgia, serif; font-weight: 400; letter-spacing: 0.5px;">
                                                Beauty Salon
                                            </h1>
                                            <p style="margin: 0; color: #78716c; font-size: 14px;">
                                                Willkommen bei unserem Newsletter
                                            </p>
                                        </td>
                                    </tr>

                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <p style="margin: 0 0 24px 0; color: #1c1917; font-size: 16px; line-height: 1.6;">
                                                Vielen Dank, dass Sie sich für unseren Newsletter angemeldet haben.
                                            </p>

                                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafaf9; border: 1px solid #e7e5e4; padding: 20px; margin-bottom: 32px;">
                                                <tr>
                                                    <td>
                                                        <p style="margin: 0 0 12px 0; color: #1c1917; font-family: Georgia, serif; font-size: 16px; font-weight: 400;">
                                                            Was Sie erwartet
                                                        </p>
                                                        <ul style="margin: 0; padding-left: 20px; color: #78716c; font-size: 14px; line-height: 1.8;">
                                                            <li>Exklusive Angebote und Rabatte</li>
                                                            <li>Neue Produktankündigungen</li>
                                                            <li>Beauty-Tipps und Pflegeanleitungen</li>
                                                            <li>Limitierte Editionen und Sonderaktionen</li>
                                                        </ul>
                                                    </td>
                                                </tr>
                                            </table>

                                            <p style="margin: 0 0 24px 0; color: #78716c; font-size: 16px; line-height: 1.6;">
                                                Sie erhalten in Kürze unsere besten Angebote und Neuigkeiten direkt in Ihr Postfach.
                                            </p>

                                            <table width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td align="center" style="padding-top: 8px;">
                                                        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-site.com'}/catalog" 
                                                           style="display: inline-block; padding: 14px 40px; background-color: #1c1917; color: #ffffff; text-decoration: none; border: 1px solid #1c1917; font-weight: 500; font-size: 14px;">
                                                            Zum Shop
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #fafaf9; padding: 30px; text-align: center; border-top: 1px solid #e7e5e4;">
                                            <table width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td style="padding: 10px; text-align: center;">
                                                        <p style="margin: 0 0 5px 0; color: #78716c; font-size: 13px;">Bei Fragen kontaktieren Sie uns gerne</p>
                                                        <a href="mailto:${adminEmail}" style="color: #1c1917; text-decoration: none; font-size: 14px;">${adminEmail}</a>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 20px 10px 10px 10px; text-align: center; border-top: 1px solid #e7e5e4;">
                                                        <p style="margin: 0; color: #a8a29e; font-size: 12px;">© ${new Date().getFullYear()} Beauty Salon</p>
                                                        <p style="margin: 5px 0 0 0; color: #a8a29e; font-size: 12px;">Hildesheimer Str. 22, 30169 Hannover</p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `
        });

        // Send both emails in parallel
        const results = await Promise.allSettled([adminEmailPromise, customerEmailPromise]);

        console.log('✅ Newsletter subscription emails sent:', {
            admin: results[0].status,
            customer: results[1].status
        });

        // Check if both emails were sent successfully
        const allSuccessful = results.every(result => result.status === 'fulfilled');

        if (!allSuccessful) {
            console.error('❌ Some emails failed to send:', results);
            return NextResponse.json(
                { error: 'Failed to send some emails' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Newsletter subscription confirmed'
        });

    } catch (error) {
        console.error('❌ Error processing newsletter subscription:', error);
        return NextResponse.json(
            { error: 'Failed to process subscription' },
            { status: 500 }
        );
    }
}
