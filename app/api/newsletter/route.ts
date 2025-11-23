// app/api/newsletter/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase/admin';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
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

        const fromEmail = process.env.FROM_EMAIL || 'Beauty Salon <noreply@xinvestai.com>';
        const adminEmail = process.env.ADMIN_EMAIL || 'nechay1996@gmail.com';

        console.log('📧 Sending newsletter subscription emails...');

        // Send notification to admin
        const adminEmailPromise = resend.emails.send({
            from: fromEmail,
            to: adminEmail,
            subject: '🎉 Neue Newsletter-Anmeldung',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Neue Newsletter-Anmeldung</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
                        <tr>
                            <td align="center">
                                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); padding: 40px 40px 40px 40px; text-align: center;">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                                                🎉 Neue Newsletter-Anmeldung
                                            </h1>
                                        </td>
                                    </tr>

                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 40px;">
                                            <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                                                Ein neuer Kunde hat sich für den Newsletter angemeldet:
                                            </p>

                                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                                                <tr>
                                                    <td>
                                                        <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                                            Email-Adresse
                                                        </p>
                                                        <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">
                                                            ${email}
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>

                                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 24px;">
                                                <tr>
                                                    <td>
                                                        <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
                                                            💡 <strong>Tipp:</strong> Fügen Sie diese Email-Adresse zu Ihrer Newsletter-Liste hinzu, um exklusive Angebote und Updates zu versenden.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>

                                            <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
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
                                        <td style="background-color: #f9fafb; padding: 32px; text-align: center; border-top: 1px solid #e5e7eb;">
                                            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                                                Diese Nachricht wurde automatisch generiert
                                            </p>
                                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                                Beauty Salon Shop - Admin Benachrichtigung
                                            </p>
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
            subject: '✨ Willkommen bei unserem Newsletter!',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Newsletter-Anmeldung bestätigt</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
                        <tr>
                            <td align="center">
                                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); padding: 40px 40px 40px 40px; text-align: center;">
                                            <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 32px; font-weight: 300; letter-spacing: -0.5px;">
                                                ✨ Willkommen!
                                            </h1>
                                            <p style="margin: 0; color: #d1d5db; font-size: 16px; font-weight: 400;">
                                                Vielen Dank für Ihre Newsletter-Anmeldung
                                            </p>
                                        </td>
                                    </tr>

                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 40px;">
                                            <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                                                Vielen Dank, dass Sie sich für unseren Newsletter angemeldet haben! 
                                            </p>

                                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 32px;">
                                                <tr>
                                                    <td>
                                                        <p style="margin: 0 0 12px 0; color: #065f46; font-size: 16px; font-weight: 600;">
                                                            🎁 Was erwartet Sie:
                                                        </p>
                                                        <ul style="margin: 0; padding-left: 20px; color: #047857; font-size: 14px; line-height: 1.8;">
                                                            <li>Exklusive Angebote und Rabatte</li>
                                                            <li>Neue Produktankündigungen</li>
                                                            <li>Beauty-Tipps und Pflegeanleitungen</li>
                                                            <li>Limitierte Editionen und Sonderaktionen</li>
                                                        </ul>
                                                    </td>
                                                </tr>
                                            </table>

                                            <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                                                Sie erhalten in Kürze unsere besten Angebote und Neuigkeiten direkt in Ihr Postfach.
                                            </p>

                                            <table width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td align="center" style="padding-top: 8px;">
                                                        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-site.com'}/catalog" 
                                                           style="display: inline-block; padding: 16px 32px; background-color: #111827; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                                            Zum Shop
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #f9fafb; padding: 32px; text-align: center; border-top: 1px solid #e5e7eb;">
                                            <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                                Wenn Sie diese Email irrtümlich erhalten haben oder sich abmelden möchten, 
                                                kontaktieren Sie uns bitte unter <a href="mailto:${adminEmail}" style="color: #3b82f6; text-decoration: none;">${adminEmail}</a>
                                            </p>
                                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                                © ${new Date().getFullYear()} Beauty Salon Shop. Alle Rechte vorbehalten.
                                            </p>
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
