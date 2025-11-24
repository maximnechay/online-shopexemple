// app/api/admin/sms/send/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface Recipient {
    phone: string;
    name?: string;
    source: 'profile' | 'newsletter';
}

export async function POST(request: NextRequest) {
    try {
        const { message, recipients } = await request.json();

        // Validation
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

        console.log(`📱 SMS-Nachrichten initiiert:`);
        console.log(`   Nachricht: "${message}"`);
        console.log(`   Empfänger: ${recipients.length}`);

        // ВАЖНО: Здесь нужно интегрировать реальный SMS-провайдер
        // Популярные варианты для Германии:
        // - Twilio (https://www.twilio.com)
        // - Vonage (https://www.vonage.com)
        // - SMS77 (https://www.sms77.io)
        // - Plivo (https://www.plivo.com)

        // Пример интеграции с Twilio:
        /*
        const twilio = require('twilio');
        const client = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        const results = await Promise.allSettled(
            recipients.map(async (recipient: Recipient) => {
                return await client.messages.create({
                    body: message,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: recipient.phone,
                });
            })
        );
        */

        // Временная имитация отправки для демонстрации
        const results = recipients.map((recipient: Recipient) => ({
            status: 'fulfilled',
            phone: recipient.phone,
            name: recipient.name,
        }));

        const successful = results.filter((r: any) => r.status === 'fulfilled').length;
        const failed = results.length - successful;

        console.log(`✅ SMS gesendet: ${successful} erfolgreich, ${failed} fehlgeschlagen`);

        // Логируем каждого получателя (для демо)
        recipients.forEach((recipient: Recipient) => {
            console.log(`   📱 ${recipient.phone} (${recipient.name || 'Unbekannt'}) - ${recipient.source}`);
        });

        return NextResponse.json({
            success: true,
            message: 'SMS erfolgreich gesendet',
            stats: {
                total: recipients.length,
                successful,
                failed,
            },
        });
    } catch (error) {
        console.error('❌ Error sending SMS:', error);
        return NextResponse.json(
            { error: 'Fehler beim Senden der SMS' },
            { status: 500 }
        );
    }
}
