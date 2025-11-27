// lib/security/headers.ts
import { NextResponse } from 'next/server';

/**
 * Security headers для всех responses
 */
export function getSecurityHeaders() {
    const headers = new Headers();

    // Content Security Policy
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.paypal.com https://www.google-analytics.com https://www.googletagmanager.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://*.supabase.co https://api.stripe.com https://www.paypal.com https://www.google-analytics.com https://o4510422575415296.ingest.de.sentry.io",
        "frame-src 'self' https://www.paypal.com https://www.google.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests"
    ].join('; ');

    headers.set('Content-Security-Policy', csp);

    // X-Frame-Options (защита от clickjacking)
    headers.set('X-Frame-Options', 'DENY');

    // X-Content-Type-Options (запретить MIME type sniffing)
    headers.set('X-Content-Type-Options', 'nosniff');

    // Referrer-Policy
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions-Policy
    headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    );

    // X-XSS-Protection (для старых браузеров)
    headers.set('X-XSS-Protection', '1; mode=block');

    // Strict-Transport-Security (только для HTTPS)
    if (process.env.NODE_ENV === 'production') {
        headers.set(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload'
        );
    }

    return headers;
}

/**
 * Применить security headers к response
 * Эта функция используется в middleware.ts
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
    const securityHeaders = getSecurityHeaders();

    securityHeaders.forEach((value, key) => {
        response.headers.set(key, value);
    });

    return response;
}

// Alias для обратной совместимости
export const applySecurityHeaders = addSecurityHeaders;