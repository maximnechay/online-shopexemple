# 🚀 Quick Start: Security Implementation

## Минимально необходимые шаги перед production

### 1. Выполнить SQL миграции (5 минут)

```sql
-- В Supabase SQL Editor выполните:
-- File: supabase/migrations/create_security_tables.sql
```

Это создаст таблицы:
- `audit_logs` - для логирования
- `processed_payments` - защита от дублей
- `idempotency_keys` - идемпотентность запросов

### 2. Установить Sentry (10 минут)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Добавьте в Vercel Environment Variables:
- `NEXT_PUBLIC_SENTRY_DSN=your_dsn`
- `SENTRY_AUTH_TOKEN=your_token`

### 3. Проверить Environment Variables (5 минут)

Убедитесь, что в Vercel установлены:
```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ STRIPE_SECRET_KEY
✅ STRIPE_WEBHOOK_SECRET
✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
✅ NEXT_PUBLIC_PAYPAL_CLIENT_ID
✅ PAYPAL_CLIENT_SECRET
✅ PAYPAL_WEBHOOK_ID
✅ RESEND_API_KEY
✅ NEXT_PUBLIC_SITE_URL (должен начинаться с https://)
```

### 4. Добавить Rate Limiting (1 час)

В критичных endpoints добавьте:

```typescript
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
    // Rate limiting
    const rateLimitResult = rateLimit(request, RATE_LIMITS.createOrder);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Too many requests' },
            { status: 429 }
        );
    }
    
    // ... остальной код
}
```

**Добавьте в**:
- `/api/orders/route.ts` - создание заказов
- `/api/newsletter/subscribe/route.ts` - подписка на newsletter
- `/api/auth/*` - аутентификация (если есть custom endpoints)

### 5. Добавить Input Validation (1 час)

```typescript
import { validateRequest, createOrderSchema } from '@/lib/security/validation';

export async function POST(request: NextRequest) {
    const body = await request.json();
    
    // Validation
    const validation = validateRequest(createOrderSchema, body);
    if (!validation.success) {
        return NextResponse.json(
            { error: 'Invalid input', details: validation.errors },
            { status: 400 }
        );
    }
    
    const orderData = validation.data;
    // ... используйте validated data
}
```

**Добавьте в**:
- `/api/admin/products/route.ts` - создание продуктов
- `/api/admin/categories/route.ts` - создание категорий
- `/api/orders/route.ts` - создание заказов

## ✅ Production Ready Минимум

После выполнения этих 5 шагов у вас будет:

- ✅ Security headers на всех страницах (уже работает)
- ✅ Webhook verification (уже работает)
- ✅ Database таблицы для security
- ✅ Error monitoring (Sentry)
- ✅ Rate limiting на критичных endpoints
- ✅ Input validation на всех POST/PUT endpoints
- ✅ HTTPS enforcement
- ✅ Environment validation

**Время**: ~2-3 часа
**Статус**: Production Ready ✅

## 📝 Дополнительно (опционально)

### Audit Logging (30 минут)

Добавьте в админские операции:

```typescript
import { createAuditLog } from '@/lib/security/audit-log';

// После создания/изменения/удаления
await createAuditLog({
    action: 'product.create',
    resourceId: product.id,
    ipAddress: request.headers.get('x-forwarded-for'),
});
```

### Payment Deduplication (30 минут)

В webhook handlers:

```typescript
import { isPaymentProcessed, markPaymentAsProcessed } from '@/lib/security/payment-deduplication';

// В начале webhook handler
if (await isPaymentProcessed(paymentId, 'stripe')) {
    return NextResponse.json({ received: true });
}

// После успешной обработки
await markPaymentAsProcessed(paymentId, 'stripe', orderId, amount);
```

## 🧪 Testing

После внедрения протестируйте:

```bash
# 1. Rate limiting
# Отправьте 20+ запросов за минуту
curl -X POST https://yoursite.com/api/orders

# 2. Input validation
# Отправьте invalid data
curl -X POST https://yoursite.com/api/orders \
  -H "Content-Type: application/json" \
  -d '{"invalid":"data"}'

# 3. Security headers
# Откройте DevTools → Network → проверьте headers
```

## 📊 Monitoring

После деплоя:

1. **Sentry Dashboard**: Проверяйте ошибки
2. **Supabase Dashboard**: Смотрите audit_logs таблицу
3. **Vercel Logs**: Проверяйте rate limiting срабатывания

## 🆘 Если что-то не работает

1. Проверьте environment variables в Vercel
2. Проверьте, что SQL миграции выполнены
3. Проверьте Sentry DSN правильный
4. Посмотрите Vercel logs для деталей ошибок

## 📚 Полная документация

Подробнее см.:
- `SECURITY_IMPLEMENTATION.md` - Полная документация
- `SECURITY_CHECKLIST.md` - Детальный чеклист
- `EXAMPLE_SECURE_API.ts` - Пример использования
