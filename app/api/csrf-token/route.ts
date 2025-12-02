// app/api/csrf-token/route.ts
import { NextResponse } from 'next/server';
import { generateCSRFToken } from '@/lib/security/csrf';

/**
 * Endpoint для получения CSRF токена
 * Используется на клиенте перед отправкой форм
 */
export async function GET() {
    try {
        const token = await generateCSRFToken();

        return NextResponse.json({
            token,
            expiresIn: 3600 // секунды
        });
    } catch (error) {
        console.error('❌ Error generating CSRF token:', error);
        return NextResponse.json(
            { error: 'Failed to generate token' },
            { status: 500 }
        );
    }
}
