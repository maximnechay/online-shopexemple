// lib/security/env-check.ts

/**
 * Проверяет наличие всех необходимых environment variables при старте
 */
export function validateEnvironment(): void {
    const requiredEnvVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
        'STRIPE_SECRET_KEY',
        'NEXT_PUBLIC_PAYPAL_CLIENT_ID',
        'PAYPAL_CLIENT_SECRET',
        'RESEND_API_KEY',
        'EMAIL_FROM',
        'ADMIN_EMAIL',
    ];

    const missingVars: string[] = [];

    for (const varName of requiredEnvVars) {
        if (!process.env[varName]) {
            missingVars.push(varName);
        }
    }

    if (missingVars.length > 0) {
        console.error('❌ Missing required environment variables:');
        missingVars.forEach(varName => {
            console.error(`   - ${varName}`);
        });
        throw new Error('Missing required environment variables');
    }

    // Validate URLs
    try {
        new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
    } catch {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL is not a valid URL');
    }

    // Check for production-specific requirements
    if (process.env.NODE_ENV === 'production') {
        const productionEnvVars = [
            'STRIPE_WEBHOOK_SECRET',
            'PAYPAL_WEBHOOK_ID',
            'NEXT_PUBLIC_SITE_URL',
        ];

        const missingProdVars: string[] = [];

        for (const varName of productionEnvVars) {
            if (!process.env[varName]) {
                missingProdVars.push(varName);
            }
        }

        if (missingProdVars.length > 0) {
            console.error('❌ Missing required production environment variables:');
            missingProdVars.forEach(varName => {
                console.error(`   - ${varName}`);
            });
            throw new Error('Missing required production environment variables');
        }

        // Ensure HTTPS in production
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
        if (!siteUrl.startsWith('https://')) {
            throw new Error('NEXT_PUBLIC_SITE_URL must use HTTPS in production');
        }
    }

    console.log('✅ All required environment variables are set');
}

/**
 * Проверяет, не используются ли дефолтные/test значения в production
 */
export function checkProductionSecrets(): void {
    if (process.env.NODE_ENV !== 'production') {
        return;
    }

    const dangerousPatterns = [
        { key: 'STRIPE_SECRET_KEY', pattern: /_test_/i },
        { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', pattern: /_test_/i },
        { key: 'SUPABASE_SERVICE_ROLE_KEY', pattern: /test|demo|example/i },
    ];

    const warnings: string[] = [];

    for (const { key, pattern } of dangerousPatterns) {
        const value = process.env[key];
        if (value && pattern.test(value)) {
            warnings.push(`${key} appears to be a test/demo key`);
        }
    }

    if (warnings.length > 0) {
        console.warn('⚠️  Production security warnings:');
        warnings.forEach(warning => {
            console.warn(`   - ${warning}`);
        });
    }
}
