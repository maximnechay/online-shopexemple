# 🔒 Production Security Checklist

## ✅ Implemented

### Core Security
- [x] **Webhook Verification** - Stripe & PayPal signatures проверяются
- [x] **Rate Limiting** - Система rate limiting реализована (`lib/security/rate-limit.ts`)
- [x] **Input Validation** - Zod schemas для всех endpoints (`lib/security/validation.ts`)
- [x] **Security Headers** - CSP, HSTS, X-Frame-Options и др. (`lib/security/headers.ts`)
- [x] **Audit Logs** - Logging всех админских операций (`lib/security/audit-log.ts`)
- [x] **Payment Deduplication** - Защита от двойных платежей (`lib/security/payment-deduplication.ts`)
- [x] **HTTPS Enforcement** - Vercel автоматически + HSTS header
- [x] **Service Role Security** - Admin client только на сервере
- [x] **Environment Validation** - Проверка переменных окружения (`lib/security/env-check.ts`)

### Database
- [x] **RLS Policies** - Row Level Security на всех таблицах
- [x] **Audit Logs Table** - SQL миграция создана
- [x] **Processed Payments Table** - Для отслеживания платежей
- [x] **Idempotency Keys Table** - Для предотвращения дублирования

## ⚠️ TODO - High Priority

### 1. Integrate Rate Limiting
**Status**: Код готов, нужно интегрировать в API routes

**Действия**:
```typescript
// Добавить в каждый API route:
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

const rateLimitResult = rateLimit(request, RATE_LIMITS.createOrder);
if (!rateLimitResult.success) {
    return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': rateLimitResult.retryAfter.toString() }}
    );
}
```

**Priority**: 🔴 CRITICAL
**Estimate**: 2-3 hours

### 2. Add Input Validation
**Status**: Schemas готовы, нужно использовать

**Действия**:
```typescript
// В каждом POST/PUT endpoint:
import { validateRequest, createProductSchema } from '@/lib/security/validation';

const validation = validateRequest(createProductSchema, body);
if (!validation.success) {
    return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
    );
}
```

**Priority**: 🔴 CRITICAL
**Estimate**: 3-4 hours

### 3. Setup Sentry
**Status**: Не установлен

**Действия**:
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Добавить в Vercel:
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`

**Priority**: 🔴 CRITICAL
**Estimate**: 1 hour

### 4. Execute SQL Migrations
**Status**: SQL файлы созданы, не выполнены

**Действия**:
1. Открыть Supabase SQL Editor
2. Выполнить:
   - `supabase/migrations/create_security_tables.sql`
   - `supabase/migrations/create_categories_table.sql`

**Priority**: 🔴 CRITICAL
**Estimate**: 15 minutes

### 5. Add Audit Logging
**Status**: Функции готовы, нужно использовать

**Действия**:
Добавить в критичные операции:
```typescript
import { createAuditLog } from '@/lib/security/audit-log';

await createAuditLog({
    action: 'product.create',
    resourceType: 'product',
    resourceId: product.id,
    ipAddress: request.headers.get('x-forwarded-for'),
    userAgent: request.headers.get('user-agent'),
});
```

**Priority**: 🟡 HIGH
**Estimate**: 2 hours

## ⚠️ TODO - Medium Priority

### 6. API Timeouts
**Status**: Нужно добавить во внешние запросы

**Действия**:
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10000);

try {
    const response = await fetch(url, { signal: controller.signal });
} finally {
    clearTimeout(timeout);
}
```

**Priority**: 🟡 MEDIUM
**Estimate**: 1-2 hours

### 7. Payment Deduplication в Webhooks
**Status**: Функции готовы, нужно интегрировать

**Действия**:
```typescript
import { isPaymentProcessed, markPaymentAsProcessed } from '@/lib/security/payment-deduplication';

if (await isPaymentProcessed(paymentId, 'stripe')) {
    return NextResponse.json({ received: true });
}

// После обработки:
await markPaymentAsProcessed(paymentId, 'stripe', orderId, amount);
```

**Priority**: 🟡 MEDIUM
**Estimate**: 1 hour

### 8. Environment Variables Check
**Status**: Функция готова, нужно вызвать при старте

**Действия**:
Добавить в `app/layout.tsx`:
```typescript
import { validateEnvironment, checkProductionSecrets } from '@/lib/security/env-check';

if (process.env.NODE_ENV === 'production') {
    validateEnvironment();
    checkProductionSecrets();
}
```

**Priority**: 🟡 MEDIUM
**Estimate**: 15 minutes

### 9. Suspicious Activity Logging
**Status**: Нужно реализовать

**Действия**:
- Отслеживать failed login attempts
- Логировать multiple failed payments
- Мониторить unusual order patterns

**Priority**: 🟡 MEDIUM
**Estimate**: 2-3 hours

## 📝 TODO - Low Priority

### 10. CAPTCHA
**Status**: Не реализовано

**Рекомендация**: Cloudflare Turnstile (бесплатно)
**Priority**: 🟢 LOW
**Estimate**: 2 hours

### 11. 2FA для админов
**Status**: Не реализовано

**Рекомендация**: Supabase Auth поддерживает TOTP
**Priority**: 🟢 LOW
**Estimate**: 4-6 hours

### 12. Database Backups Monitoring
**Status**: Supabase делает автоматически (Pro план)

**Действия**: Проверить настройки в Supabase Dashboard
**Priority**: 🟢 LOW
**Estimate**: 15 minutes

## 📊 Testing Checklist

### После внедрения изменений:
- [ ] Test rate limiting (превысить лимит)
- [ ] Test input validation (отправить invalid data)
- [ ] Test webhook verification (invalid signature)
- [ ] Test payment deduplication (duplicate payment)
- [ ] Test security headers (DevTools → Network)
- [ ] Test HTTPS redirect
- [ ] Test audit logs (выполнить админскую операцию)
- [ ] Test Sentry error reporting
- [ ] Test environment validation

## 🚀 Deployment Steps

### Before Production:
1. ✅ Execute SQL migrations
2. ✅ Setup Sentry in Vercel
3. ✅ Verify all env vars in Vercel
4. ✅ Test webhooks with live keys
5. ✅ Enable audit logging
6. ✅ Test rate limiting

### After Production:
1. 📊 Monitor Sentry for errors
2. 📊 Check audit logs for suspicious activity
3. 📊 Monitor webhook delivery rates
4. 📊 Check database performance
5. 📊 Review security headers in production

## 📞 Quick Reference

### Files Created:
- `lib/security/validation.ts` - Zod schemas
- `lib/security/rate-limit.ts` - Rate limiting
- `lib/security/audit-log.ts` - Audit logging
- `lib/security/headers.ts` - Security headers
- `lib/security/env-check.ts` - Environment validation
- `lib/security/payment-deduplication.ts` - Payment protection
- `supabase/migrations/create_security_tables.sql` - Database tables
- `SECURITY_IMPLEMENTATION.md` - Full documentation
- `EXAMPLE_SECURE_API.ts` - Example implementation

### Integration Points:
- ✅ `middleware.ts` - Security headers added
- ⚠️ API routes - Need rate limiting + validation
- ⚠️ Webhook handlers - Need deduplication
- ⚠️ Admin operations - Need audit logging

## ⏰ Estimated Total Time
- **Critical (Must Do)**: 7-9 hours
- **High Priority (Should Do)**: 4-5 hours
- **Medium Priority (Nice to Have)**: 6-8 hours
- **Low Priority (Future)**: 6-8 hours

**Total**: ~23-30 hours for full implementation

## 🎯 Recommended Implementation Order

1. **Day 1 (4-5 hours)**:
   - Execute SQL migrations
   - Setup Sentry
   - Add environment validation

2. **Day 2 (4-5 hours)**:
   - Integrate rate limiting in critical endpoints
   - Add input validation to all POST/PUT

3. **Day 3 (3-4 hours)**:
   - Add audit logging to admin operations
   - Integrate payment deduplication in webhooks
   - Add API timeouts

4. **Testing & Deployment (2-3 hours)**:
   - Test all security features
   - Deploy to production
   - Monitor for issues
