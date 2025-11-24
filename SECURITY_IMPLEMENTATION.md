# Security Implementation Guide

## ✅ Security Checklist

### 1. Webhook Verification
- ✅ **Stripe Webhook**: Signature verification реализована в `/api/webhooks/stripe/route.ts`
- ✅ **PayPal Webhook**: Verification token проверяется в `/api/webhooks/paypal/route.ts`
- ⚠️ **Production**: Убедитесь, что `STRIPE_WEBHOOK_SECRET` и `PAYPAL_WEBHOOK_ID` установлены

### 2. Rate Limiting
- ✅ **Реализовано**: `lib/security/rate-limit.ts`
- ✅ **Конфигурация**: Разные лимиты для разных endpoints
- 📝 **Использование**:
```typescript
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
    const rateLimitResult = rateLimit(request, RATE_LIMITS.createOrder);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Too many requests' },
            { 
                status: 429,
                headers: { 'Retry-After': rateLimitResult.retryAfter.toString() }
            }
        );
    }
    // ... остальная логика
}
```

### 3. Input Validation (Zod)
- ✅ **Реализовано**: `lib/security/validation.ts`
- ✅ **Schemas**: Products, Categories, Orders, Newsletter, Users, Settings
- 📝 **Использование**:
```typescript
import { validateRequest, createProductSchema } from '@/lib/security/validation';

export async function POST(request: NextRequest) {
    const body = await request.json();
    const validation = validateRequest(createProductSchema, body);
    
    if (!validation.success) {
        return NextResponse.json(
            { error: 'Validation failed', details: validation.errors },
            { status: 400 }
        );
    }
    
    const product = validation.data;
    // ... создание продукта
}
```

### 4. Environment Variables Check
- ✅ **Реализовано**: `lib/security/env-check.ts`
- 📝 **Добавьте в `app/layout.tsx` или точку входа**:
```typescript
import { validateEnvironment, checkProductionSecrets } from '@/lib/security/env-check';

if (process.env.NODE_ENV === 'production') {
    validateEnvironment();
    checkProductionSecrets();
}
```

### 5. Security Headers
- ✅ **Реализовано**: `lib/security/headers.ts`
- ✅ **Интегрировано**: В `middleware.ts`
- Включает:
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Content-Security-Policy
  - Strict-Transport-Security (HTTPS only)
  - Permissions-Policy

### 6. Monitoring (Sentry)
- ⚠️ **TODO**: Установить и настроить Sentry
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```
- Добавить в `.env.local`:
```
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### 7. Database Backups
- ⚠️ **Supabase**: Автоматические backups включены в Pro плане
- 📝 **Проверьте**: Supabase Dashboard → Settings → Backups
- 🔄 **Рекомендация**: Настройте Point-in-Time Recovery (PITR)

### 8. Audit Logs
- ✅ **Реализовано**: `lib/security/audit-log.ts`
- ✅ **Таблица**: `audit_logs` в базе данных
- 📝 **Использование**:
```typescript
import { createAuditLog } from '@/lib/security/audit-log';

await createAuditLog({
    action: 'product.create',
    userId: user.id,
    userEmail: user.email,
    resourceType: 'product',
    resourceId: product.id,
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
});
```

### 9. HTTPS Enforcement
- ✅ **Production**: Vercel автоматически использует HTTPS
- ✅ **HSTS Header**: Добавлен в security headers
- 📝 **Проверьте**: `NEXT_PUBLIC_SITE_URL` должен начинаться с `https://`

### 10. Service Role Key Security
- ✅ **Server-only**: Используется только в server components и API routes
- ✅ **Admin Client**: `createServerSupabaseAdminClient()` в `lib/supabase/server.ts`
- ⚠️ **НИКОГДА** не экспортируйте на клиент

### 11. API Timeouts
- 📝 **Добавьте timeouts для внешних API**:
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10000); // 10 seconds

try {
    const response = await fetch(url, {
        signal: controller.signal,
        // ... other options
    });
} finally {
    clearTimeout(timeout);
}
```

### 12. Payment Deduplication
- ✅ **Реализовано**: `lib/security/payment-deduplication.ts`
- ✅ **Таблицы**: `processed_payments`, `idempotency_keys`
- 📝 **Использование в webhook handlers**:
```typescript
import { isPaymentProcessed, markPaymentAsProcessed } from '@/lib/security/payment-deduplication';

// В webhook handler
if (await isPaymentProcessed(paymentIntent.id, 'stripe')) {
    return NextResponse.json({ received: true }); // Уже обработан
}

// После успешной обработки
await markPaymentAsProcessed(
    paymentIntent.id,
    'stripe',
    order.id,
    amount
);
```

### 13. Security Logging
- ✅ **Suspicious Activity Detection**:
```typescript
// Логируйте подозрительные действия
if (failedLoginAttempts > 5) {
    await createAuditLog({
        action: 'user.suspicious_activity',
        userEmail: email,
        ipAddress: ip,
        metadata: { reason: 'Multiple failed login attempts' }
    });
}
```

## 🗄️ Database Setup

Выполните SQL миграции в Supabase:

1. **Security Tables**:
```bash
supabase/migrations/create_security_tables.sql
```

Это создаст:
- `audit_logs` - Audit trail всех админских действий
- `processed_payments` - Предотвращение дублирования платежей
- `idempotency_keys` - Идемпотентность API запросов

## 🔒 Production Deployment Checklist

### Перед деплоем:

1. ✅ Все environment variables установлены в Vercel
2. ✅ Webhook secrets настроены (Stripe, PayPal)
3. ✅ HTTPS URL в `NEXT_PUBLIC_SITE_URL`
4. ✅ Service role key не экспортируется на клиент
5. ✅ SQL миграции выполнены в production database
6. ✅ Sentry настроен для error monitoring
7. ✅ Rate limiting включен на всех public endpoints
8. ✅ Audit logging включен для админских действий
9. ✅ Database backups настроены
10. ✅ Security headers проверены

### После деплоя:

1. 🧪 Проверьте webhook endpoints с тестовыми событиями
2. 🧪 Протестируйте rate limiting (превысьте лимит)
3. 🧪 Проверьте CSP headers (откройте DevTools → Console)
4. 🧪 Убедитесь, что HTTPS redirect работает
5. 📊 Проверьте Sentry dashboard на ошибки
6. 📊 Проверьте audit logs в Supabase

## 📝 Recommended Next Steps

### Высокий приоритет:
1. **Установить Sentry** для мониторинга ошибок
2. **Добавить rate limiting** во все public API endpoints
3. **Включить audit logging** в критичные операции

### Средний приоритет:
4. **Настроить alerts** в Sentry для критичных ошибок
5. **Добавить CAPTCHA** на формы (например, Cloudflare Turnstile)
6. **Реализовать 2FA** для админов

### Низкий приоритет:
7. **Pen testing** для проверки безопасности
8. **Security audit** кода третьей стороной
9. **GDPR compliance** review

## 🛡️ Security Best Practices

### API Routes:
- Всегда используйте validation schemas
- Добавляйте rate limiting
- Логируйте suspicious activity
- Используйте admin client только на сервере
- Добавляйте timeouts для внешних запросов

### Database:
- Используйте RLS policies
- Service role только для админских операций
- Regular backups
- Audit logs для sensitive operations

### Secrets:
- Никогда не коммитьте `.env.local`
- Используйте Vercel Environment Variables
- Rotate secrets регулярно
- Используйте разные ключи для dev/prod

### Monitoring:
- Настройте Sentry alerts
- Мониторьте audit logs
- Проверяйте failed payment attempts
- Track suspicious IP addresses

## 📞 Emergency Response

### Если обнаружена breach:
1. 🚨 Немедленно rotate все secrets (Stripe, PayPal, Supabase)
2. 🔍 Проверьте audit logs за последние 48 часов
3. 📧 Уведомите пользователей если нужно
4. 🔒 Temporarily disable affected functionality
5. 📊 Review и patch уязвимости
6. 📝 Document incident для future reference
