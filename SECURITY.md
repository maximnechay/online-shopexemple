# 🔒 Security Guide

Руководство по безопасности проекта Beauty Salon E-commerce.

---

## 📋 Содержание

- [Обзор безопасности](#обзор-безопасности)
- [Аутентификация](#аутентификация)
- [Авторизация](#авторизация)
- [Защита API](#защита-api)
- [Защита платежей](#защита-платежей)
- [Защита данных](#защита-данных)
- [Best Practices](#best-practices)
- [Security Checklist](#security-checklist)

---

## 🛡️ Обзор безопасности

### Архитектура безопасности

```
┌─────────────┐
│   Browser   │ ← HTTPS, CSP Headers
└──────┬──────┘
       │
┌──────▼──────┐
│   Next.js   │ ← Middleware, API Routes
│  (Vercel)   │
└──────┬──────┘
       │
┌──────▼──────┐
│  Supabase   │ ← Row Level Security (RLS)
│ PostgreSQL  │
└──────┬──────┘
       │
┌──────▼──────┐
│   Payment   │ ← Webhook Verification
│  Providers  │
└─────────────┘
```

### Принципы безопасности

1. **Defense in Depth** - Многоуровневая защита
2. **Least Privilege** - Минимальные необходимые права
3. **Secure by Default** - Безопасность по умолчанию
4. **Never Trust Client** - Никогда не доверяй клиенту
5. **Always Validate** - Всегда валидируй данные

---

## 🔐 Аутентификация

### Supabase Auth

Проект использует Supabase Auth для управления пользователями.

#### Безопасное хранение паролей

```javascript
// ✅ Supabase автоматически хеширует пароли
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure_password' // Будет захеширован bcrypt
});

// ❌ НИКОГДА не храните пароли в plain text!
```

#### Требования к паролям

```javascript
// Рекомендации для паролей
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
};

function validatePassword(password: string): boolean {
  if (password.length < PASSWORD_REQUIREMENTS.minLength) return false;
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) return false;
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) return false;
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/[0-9]/.test(password)) return false;
  return true;
}
```

#### Session Management

```javascript
// ✅ Правильное управление сессиями
const { data: { session } } = await supabase.auth.getSession();

// Автоматическое обновление токенов
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // Очистите локальное состояние
    clearUserData();
  }
});

// ✅ Logout везде
await supabase.auth.signOut();
```

#### Защита от атак

**CSRF Protection:**
```javascript
// Next.js автоматически защищает от CSRF через SameSite cookies
// cookies настраиваются в middleware.ts
```

**Rate Limiting:**
```javascript
// Рекомендуется добавить rate limiting для auth endpoints
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 попыток за 15 минут
});

// В API route
const { success } = await ratelimit.limit(ip);
if (!success) {
  return new Response('Too many requests', { status: 429 });
}
```

---

## 🔓 Авторизация

### Row Level Security (RLS)

**Критически важно!** Все таблицы должны иметь RLS политики.

#### Базовые политики

```sql
-- Включаем RLS для таблицы
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Все могут читать товары
CREATE POLICY "Anyone can view products"
    ON products FOR SELECT
    TO PUBLIC
    USING (true);

-- Только админы могут изменять
CREATE POLICY "Admins can manage products"
    ON products FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

#### Продвинутые политики

```sql
-- Пользователи видят только свои заказы
CREATE POLICY "Users view own orders"
    ON orders FOR SELECT
    USING (
        auth.uid() = user_id
        OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Пользователи могут создавать заказы
CREATE POLICY "Authenticated users can create orders"
    ON orders FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Только админы могут обновлять статусы
CREATE POLICY "Admins update orders"
    ON orders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

### Middleware Protection

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Создаем Supabase клиент
  const supabase = createServerClient(/* ... */);
  
  // Получаем пользователя
  const { data: { user } } = await supabase.auth.getUser();
  
  const pathname = request.nextUrl.pathname;
  
  // Защита admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!user) {
      // Редирект на логин
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    // Проверка роли
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!profile || profile.role !== 'admin') {
      // 403 Forbidden
      return new NextResponse('Access denied', { status: 403 });
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
```

---

## 🛡️ Защита API

### Input Validation

**ВСЕГДА валидируйте входные данные!**

```typescript
// ❌ ОПАСНО - без валидации
export async function POST(request: Request) {
  const { email, price } = await request.json();
  // Используем данные напрямую - ОПАСНО!
}

// ✅ БЕЗОПАСНО - с валидацией
import { z } from 'zod';

const orderSchema = z.object({
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  items: z.array(z.object({
    id: z.string().uuid(),
    quantity: z.number().int().min(1).max(99),
  })),
  total: z.number().positive(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = orderSchema.parse(body); // Throws на неверных данных
    
    // Безопасно используем validatedData
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
  }
}
```

### SQL Injection Protection

```typescript
// ✅ Supabase автоматически защищает от SQL injection
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('category', userInput); // Безопасно - параметризованный запрос

// ❌ ОПАСНО - если используете raw SQL
const { data } = await supabase.rpc('custom_function', {
  query: `SELECT * FROM products WHERE name = '${userInput}'` // SQL INJECTION!
});

// ✅ БЕЗОПАСНО - используйте параметры
const { data } = await supabase.rpc('search_products', {
  search_term: userInput // Параметр
});
```

### XSS Protection

```typescript
// React автоматически экранирует данные
function ProductCard({ product }: { product: Product }) {
  // ✅ Безопасно - React экранирует
  return <div>{product.name}</div>;
  
  // ❌ ОПАСНО - dangerouslySetInnerHTML
  return <div dangerouslySetInnerHTML={{ __html: product.description }} />;
  
  // ✅ БЕЗОПАСНО - используйте sanitize
  import DOMPurify from 'isomorphic-dompurify';
  const clean = DOMPurify.sanitize(product.description);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

### API Rate Limiting

```typescript
// Пример с Vercel KV (Redis)
import { kv } from '@vercel/kv';

export async function rateLimit(identifier: string, limit: number = 10) {
  const key = `rate-limit:${identifier}`;
  const current = await kv.incr(key);
  
  if (current === 1) {
    await kv.expire(key, 60); // Окно 60 секунд
  }
  
  return current <= limit;
}

// В API route
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  const allowed = await rateLimit(ip, 10); // 10 запросов в минуту
  if (!allowed) {
    return new Response('Too many requests', { status: 429 });
  }
  
  // Обработка запроса
}
```

---

## 💳 Защита платежей

### Критические принципы

1. **НИКОГДА не доверяйте сумме от клиента**
2. **ВСЕГДА получайте сумму из БД**
3. **ВСЕГДА верифицируйте webhooks**
4. **Используйте HTTPS**
5. **Логируйте все платежные операции**

### Безопасное создание заказа

```typescript
// ❌ ОПАСНО - клиент контролирует сумму
export async function POST(request: Request) {
  const { items, total } = await request.json();
  // Клиент может отправить любую сумму!
  
  const order = await createPayPalOrder(total); // ОПАСНО!
}

// ✅ БЕЗОПАСНО - сервер вычисляет сумму
export async function POST(request: Request) {
  const { supabaseOrderId } = await request.json();
  
  // Получаем данные заказа из БД (источник правды)
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('total, status')
    .eq('id', supabaseOrderId)
    .single();
  
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  
  // Используем сумму из БД
  const paypalOrder = await createPayPalOrder(order.total);
  
  // Связываем PayPal order с нашим заказом
  await supabaseAdmin
    .from('orders')
    .update({ paypal_order_id: paypalOrder.id })
    .eq('id', supabaseOrderId);
}
```

### Webhook Verification

**PayPal Webhook Verification:**

```typescript
async function verifyPayPalWebhook(
  webhookId: string,
  headers: Headers,
  body: any
): Promise<boolean> {
  try {
    // Получаем access token
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenResponse = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    
    const { access_token } = await tokenResponse.json();
    
    // Верифицируем webhook
    const verifyResponse = await fetch(
      `${PAYPAL_API}/v1/notifications/verify-webhook-signature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          transmission_id: headers.get('paypal-transmission-id'),
          transmission_time: headers.get('paypal-transmission-time'),
          cert_url: headers.get('paypal-cert-url'),
          auth_algo: headers.get('paypal-auth-algo'),
          transmission_sig: headers.get('paypal-transmission-sig'),
          webhook_id: webhookId,
          webhook_event: body,
        }),
      }
    );
    
    const verifyData = await verifyResponse.json();
    return verifyData.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('PayPal webhook verification error:', error);
    return false;
  }
}

// В webhook handler
export async function POST(request: Request) {
  const body = await request.json();
  const headers = request.headers;
  
  // ✅ ВАЖНО: Верифицируем webhook
  const isValid = await verifyPayPalWebhook(
    process.env.PAYPAL_WEBHOOK_ID!,
    headers,
    body
  );
  
  if (!isValid) {
    console.error('Invalid PayPal webhook signature');
    return new Response('Invalid signature', { status: 401 });
  }
  
  // Обрабатываем только верифицированные webhooks
  handleWebhook(body);
}
```

**Stripe Webhook Verification:**

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text(); // Raw body нужен для проверки подписи
  const signature = request.headers.get('stripe-signature');
  
  if (!signature) {
    return new Response('No signature', { status: 401 });
  }
  
  try {
    // ✅ Верифицируем webhook
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    // Обрабатываем только верифицированные события
    handleStripeEvent(event);
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook verification failed:', error);
    return new Response('Invalid signature', { status: 401 });
  }
}
```

### Защита от дублирования платежей

```typescript
// Проверяем что платеж еще не обработан
async function handlePaymentSuccess(orderId: string, paymentId: string) {
  // Атомарно обновляем статус
  const { data: updated, error } = await supabaseAdmin
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'processing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('payment_status', 'pending') // Только если еще pending!
    .select()
    .single();
  
  if (!updated) {
    // Платеж уже был обработан ранее
    console.log('Payment already processed:', orderId);
    return;
  }
  
  // Логируем успешный платеж
  await logPayment(orderId, paymentId, 'success');
  
  // Отправляем email уведомление
  await sendOrderConfirmation(updated);
}
```

---

## 🔐 Защита данных

### Encryption at Rest

- **Supabase**: Автоматическое шифрование данных
- **Vercel**: Зашифрованные environment variables
- **PayPal/Stripe**: PCI DSS compliant

### Encryption in Transit

```typescript
// ✅ Всегда используйте HTTPS
const PAYPAL_API = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com' // HTTPS!
  : 'https://api-m.sandbox.paypal.com';

// ❌ НИКОГДА не используйте HTTP в production
```

### Sensitive Data Handling

```typescript
// ❌ НЕ логируйте чувствительные данные
console.log('User data:', { email, password, creditCard }); // ОПАСНО!

// ✅ Логируйте только необходимое
console.log('User registered:', { userId, email });

// ✅ Маскируйте чувствительные данные в логах
function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  return `${name[0]}***@${domain}`;
}

console.log('Processing order for:', maskEmail(email));
```

### Environment Variables

```bash
# ✅ Правильное именование
NEXT_PUBLIC_SUPABASE_URL=...     # Публичный (виден в браузере)
SUPABASE_SERVICE_ROLE_KEY=...    # Приватный (только на сервере)

# ❌ ОПАСНО - секреты с NEXT_PUBLIC_
NEXT_PUBLIC_STRIPE_SECRET_KEY=... # Будет виден в браузере!

# ✅ Разделяйте по окружениям
.env.local           # Локальная разработка (не коммитить!)
.env.production      # Production (использовать Vercel)
.env.example         # Пример (коммитить)
```

---

## 🎯 Best Practices

### 1. Принцип минимальных привилегий

```typescript
// ❌ Использование service role key на клиенте
const supabase = createClient(url, SERVICE_ROLE_KEY); // ОПАСНО!

// ✅ На клиенте - только anon key
const supabase = createClient(url, ANON_KEY);

// ✅ Service role только на сервере
import { supabaseAdmin } from '@/lib/supabase/admin';
```

### 2. Валидация на всех уровнях

```
┌─────────────┐
│   Client    │ ← Валидация UX (быстрая обратная связь)
└──────┬──────┘
       │
┌──────▼──────┐
│   API       │ ← Валидация безопасности (обязательна!)
└──────┬──────┘
       │
┌──────▼──────┐
│  Database   │ ← Constraints + RLS (последняя линия)
└─────────────┘
```

### 3. Логирование безопасности

```typescript
// Логируйте важные события
async function logSecurityEvent(event: {
  type: 'auth' | 'payment' | 'access_denied';
  userId?: string;
  ip: string;
  details: string;
}) {
  await supabaseAdmin.from('security_logs').insert({
    event_type: event.type,
    user_id: event.userId,
    ip_address: event.ip,
    details: event.details,
    created_at: new Date().toISOString(),
  });
}

// Примеры использования
await logSecurityEvent({
  type: 'access_denied',
  ip: request.ip,
  details: 'Attempted admin access without role',
});

await logSecurityEvent({
  type: 'payment',
  userId: user.id,
  ip: request.ip,
  details: `Order ${orderId} paid successfully`,
});
```

### 4. Regular Security Updates

```bash
# Регулярно обновляйте зависимости
npm update

# Проверяйте на уязвимости
npm audit
npm audit fix

# Используйте automated security tools
npm install -g snyk
snyk test
```

### 5. Error Handling

```typescript
// ❌ НЕ показывайте технические детали пользователю
catch (error) {
  return NextResponse.json({ 
    error: error.message, // Может содержать stack traces!
  });
}

// ✅ Общие сообщения пользователю, детали в логи
catch (error) {
  console.error('Payment processing error:', error); // В логи
  
  return NextResponse.json({ 
    error: 'Payment processing failed. Please try again.', // Пользователю
  }, { status: 500 });
}
```

---

## ✅ Security Checklist

### Pre-Production

- [ ] Все environment variables настроены
- [ ] Service role keys НЕ используются на клиенте
- [ ] RLS политики включены для всех таблиц
- [ ] Webhook verification реализована
- [ ] HTTPS включен (через Vercel автоматически)
- [ ] CORS настроен правильно
- [ ] Input validation добавлена
- [ ] Error handling не раскрывает детали
- [ ] Rate limiting настроен
- [ ] Логирование security events включено

### Production

- [ ] Используются production ключи PayPal/Stripe
- [ ] Webhooks настроены на production URLs
- [ ] Backup база данных настроен
- [ ] Monitoring errors настроен (Sentry)
- [ ] Security headers настроены
- [ ] Password requirements усилены
- [ ] Все секреты ротируются регулярно
- [ ] Audit logs проверяются регулярно

### Ongoing

- [ ] Регулярное обновление зависимостей
- [ ] Мониторинг security alerts
- [ ] Проверка access logs
- [ ] Тестирование disaster recovery
- [ ] Обучение команды security best practices

---

## 🚨 Incident Response

### При обнаружении breach:

1. **Немедленно:**
   - Ротируйте все API keys
   - Проверьте logs на suspicious activity
   - Заблокируйте скомпрометированные аккаунты

2. **В течение часа:**
   - Уведомите затронутых пользователей
   - Документируйте инцидент
   - Исправьте уязвимость

3. **В течение дня:**
   - Проведите полный security audit
   - Обновите документацию
   - Реализуйте дополнительные меры

---

## 🔗 Полезные ресурсы

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [PCI DSS Compliance](https://www.pcisecuritystandards.org/)

---

## 🔗 Связанные документы

- [Database Schema](./DATABASE.md)
- [API Documentation](./API.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)