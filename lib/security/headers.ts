// lib/security/headers.ts
import { NextResponse } from 'next/server';

/**
 * Добавляет security headers к response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // XSS Protection (legacy but still useful)
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Content Security Policy
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.paypal.com https://www.googletagmanager.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://*.supabase.co https://api.stripe.com https://www.paypal.com https://www.google-analytics.com",
        "frame-src https://js.stripe.com https://www.paypal.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
    ].join('; ');

    response.headers.set('Content-Security-Policy', csp);

    // Permissions Policy
    response.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    );

    // Strict Transport Security (HTTPS only)
    if (process.env.NODE_ENV === 'production') {
        response.headers.set(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload'
        );
    }

    return response;
}
