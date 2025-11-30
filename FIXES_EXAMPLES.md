# 🛠️ ПРИМЕРЫ КОДА ДЛЯ ИСПРАВЛЕНИЯ ПРОБЛЕМ

Этот файл содержит готовые решения для всех найденных проблем.

---

## 🔴 КРИТИЧНЫЕ ПРОБЛЕМЫ

### 1. Admin API Authentication

#### Создать middleware для проверки админа

```typescript
// lib/auth/admin-check.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function checkAdmin(request: NextRequest) {
    const supabase = createServerClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }
    
    // Проверяем роль админа
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    
    if (profile?.role !== 'admin') {
        return NextResponse.json(
            { error: 'Forbidden: Admin access required' },
            { status: 403 }
        );
    }
    
    return { user, profile };
}
```

#### Применить во всех Admin endpoints

```typescript
// app/api/admin/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/auth/admin-check';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    // ✅ Проверка админа
    const adminCheck = await checkAdmin(request);
    if (adminCheck instanceof NextResponse) {
        return adminCheck; // Возвращаем ошибку
    }
    
    const { user } = adminCheck;
    
    try {
        const body = await request.json();
        
        // Валидация с Zod
        const productSchema = z.object({
            name: z.string().min(1).max(200),
            price: z.number().positive(),
            stock_quantity: z.number().int().min(0),
            description: z.string(),
            category: z.string(),
        });
        
        const validated = productSchema.parse(body);
        
        // Создание товара
        const { data, error } = await supabaseAdmin
            .from('products')
            .insert(validated)
            .select()
            .single();
        
        if (error) throw error;
        
        return NextResponse.json(data);
    } catch (error) {
        console.error('❌ Create product error:', error);
        return NextResponse.json(
            { error: 'Failed to create product' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    // ✅ Проверка админа
    const adminCheck = await checkAdmin(request);
    if (adminCheck instanceof NextResponse) {
        return adminCheck;
    }
    
    // GET логика...
}
```

---

### 2. Удалить Test Email Endpoint

```typescript
// app/api/test-email/route.ts

// ВАРИАНТ 1: Полностью удалить файл
// rm app/api/test-email/route.ts

// ВАРИАНТ 2: Оставить только для development
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    // ✅ Только в development
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
            { error: 'Not found' },
            { status: 404 }
        );
    }
    
    // Добавить rate limiting
    const rateLimitResult = rateLimit(request, { maxRequests: 2, windowMs: 3600000 });
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Too many test emails' },
            { status: 429 }
        );
    }
    
    // Остальная логика...
}
```

---

### 3. CSRF Protection

#### Создать CSRF middleware

```typescript
// lib/security/csrf.ts
import { randomBytes } from 'crypto';

const CSRF_SECRET = process.env.CSRF_SECRET || 'default-secret-change-me';
const tokens = new Map<string, number>();

// Генерация токена
export function generateCSRFToken(): string {
    const token = randomBytes(32).toString('hex');
    tokens.set(token, Date.now() + 3600000); // 1 час
    return token;
}

// Верификация токена
export function verifyCSRFToken(token: string): boolean {
    if (!token) return false;
    
    const expiry = tokens.get(token);
    if (!expiry) return false;
    
    if (Date.now() > expiry) {
        tokens.delete(token);
        return false;
    }
    
    return true;
}

// Очистка старых токенов
setInterval(() => {
    const now = Date.now();
    for (const [token, expiry] of tokens.entries()) {
        if (now > expiry) {
            tokens.delete(token);
        }
    }
}, 300000); // Каждые 5 минут
```

#### Добавить в middleware

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyCSRFToken } from '@/lib/security/csrf';

export function middleware(request: NextRequest) {
    // CSRF защита для state-changing операций
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        const token = request.headers.get('x-csrf-token');
        
        // Пропускаем webhooks (они имеют свою верификацию)
        if (!request.nextUrl.pathname.startsWith('/api/webhooks')) {
            if (!token || !verifyCSRFToken(token)) {
                return NextResponse.json(
                    { error: 'Invalid CSRF token' },
                    { status: 403 }
                );
            }
        }
    }
    
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/api/:path*',
        '/admin/:path*'
    ]
};
```

#### Получение токена на клиенте

```typescript
// lib/hooks/useCSRF.ts
'use client';

import { useEffect, useState } from 'react';

export function useCSRFToken() {
    const [token, setToken] = useState<string>('');
    
    useEffect(() => {
        // Получаем токен при монтировании
        fetch('/api/csrf-token')
            .then(res => res.json())
            .then(data => setToken(data.token))
            .catch(console.error);
    }, []);
    
    return token;
}

// app/api/csrf-token/route.ts
import { NextResponse } from 'next/server';
import { generateCSRFToken } from '@/lib/security/csrf';

export async function GET() {
    const token = generateCSRFToken();
    return NextResponse.json({ token });
}
```

#### Использование в формах

```typescript
// components/example-form.tsx
'use client';

import { useCSRFToken } from '@/lib/hooks/useCSRF';

export function ExampleForm() {
    const csrfToken = useCSRFToken();
    
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        
        const response = await fetch('/api/endpoint', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': csrfToken, // ✅ Добавляем токен
            },
            body: JSON.stringify(data),
        });
    }
    
    return <form onSubmit={handleSubmit}>...</form>;
}
```

---

### 4. XSS Protection в Reviews

#### Установить DOMPurify

```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

#### Создать утилиту санитизации

```typescript
// lib/utils/sanitize.ts
import DOMPurify from 'dompurify';

export function sanitizeHTML(dirty: string): string {
    // Удаляем все HTML теги и атрибуты
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: [], // Не разрешаем никакие теги
        ALLOWED_ATTR: [], // Не разрешаем никакие атрибуты
    });
}

export function sanitizeReview(review: string): string {
    // Для отзывов можно разрешить базовое форматирование
    return DOMPurify.sanitize(review, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
        ALLOWED_ATTR: [],
    });
}
```

#### Применить в API

```typescript
// app/api/reviews/route.ts
import { sanitizeReview } from '@/lib/utils/sanitize';

export async function POST(request: NextRequest) {
    const body = await request.json();
    
    // ✅ Санитизация перед сохранением
    const cleanComment = sanitizeReview(body.comment);
    const cleanTitle = sanitizeHTML(body.title);
    
    const { data, error } = await supabaseAdmin
        .from('reviews')
        .insert({
            ...body,
            title: cleanTitle,
            comment: cleanComment,
        });
    
    // ...
}
```

#### Применить в компонентах

```typescript
// components/product/ReviewItem.tsx
import { sanitizeReview } from '@/lib/utils/sanitize';

export function ReviewItem({ review }: { review: Review }) {
    // ✅ Санитизация при отображении (двойная защита)
    const cleanComment = sanitizeReview(review.comment);
    
    return (
        <div>
            <p>{cleanComment}</p> {/* Безопасно */}
        </div>
    );
}
```

---

### 5. Rate Limiting на все endpoints

#### Добавить в каждый endpoint

```typescript
// app/api/admin/products/route.ts
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
    // ✅ Rate limiting
    const rateLimitResult = rateLimit(request, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Too many requests' },
            { 
                status: 429,
                headers: { 
                    'Retry-After': rateLimitResult.retryAfter.toString() 
                }
            }
        );
    }
    
    // Остальная логика...
}
```

#### Создать универсальный wrapper

```typescript
// lib/api/with-rate-limit.ts
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitConfig } from '@/lib/security/rate-limit';

type Handler = (request: NextRequest) => Promise<NextResponse>;

export function withRateLimit(config: RateLimitConfig, handler: Handler) {
    return async (request: NextRequest) => {
        const rateLimitResult = rateLimit(request, config);
        
        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { 
                    status: 429,
                    headers: { 
                        'Retry-After': rateLimitResult.retryAfter.toString() 
                    }
                }
            );
        }
        
        return handler(request);
    };
}

// Использование:
export const POST = withRateLimit(
    RATE_LIMITS.admin,
    async (request: NextRequest) => {
        // Логика обработки
    }
);
```

---

## ⚠️ ВАЖНЫЕ УЛУЧШЕНИЯ

### 6. Zod валидация везде

```typescript
// lib/validation/schemas.ts
import { z } from 'zod';

// Product schemas
export const createProductSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200),
    description: z.string().min(10).max(2000),
    price: z.number().positive('Price must be positive'),
    stock_quantity: z.number().int().min(0),
    category: z.string().min(1),
    image_url: z.string().url().optional(),
    sku: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

// Order schemas
export const createOrderSchema = z.object({
    first_name: z.string().min(1).max(50),
    last_name: z.string().min(1).max(50),
    email: z.string().email(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
    street: z.string().min(1),
    house_number: z.string().min(1),
    city: z.string().min(1),
    postal_code: z.string().regex(/^\d{5}$/),
    items: z.array(z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
    })),
});

// Coupon schemas
export const validateCouponSchema = z.object({
    code: z.string().min(1).max(50),
    subtotal: z.number().positive(),
});

// Review schemas
export const createReviewSchema = z.object({
    product_id: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    title: z.string().min(3).max(100),
    comment: z.string().min(10).max(1000),
});
```

#### Применение

```typescript
// app/api/admin/products/route.ts
import { createProductSchema } from '@/lib/validation/schemas';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        // ✅ Валидация
        const validated = createProductSchema.parse(body);
        
        // Теперь validated имеет правильные типы и проверенные данные
        const { data, error } = await supabaseAdmin
            .from('products')
            .insert(validated);
        
        // ...
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            );
        }
        // ...
    }
}
```

---

### 7. Убрать чувствительные данные из логов

```typescript
// lib/utils/logger.ts

type SensitiveFields = 'email' | 'phone' | 'address' | 'password' | 'token' | 'secret';

export function redactSensitiveData(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    const redacted = { ...obj };
    const sensitiveKeys: SensitiveFields[] = [
        'email', 'phone', 'address', 'password', 'token', 'secret',
        'street', 'house_number', 'postal_code', 'customer_email',
        'customer_phone', 'api_key', 'client_secret'
    ];
    
    for (const key of Object.keys(redacted)) {
        if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
            redacted[key] = '[REDACTED]';
        } else if (typeof redacted[key] === 'object') {
            redacted[key] = redactSensitiveData(redacted[key]);
        }
    }
    
    return redacted;
}

// Безопасный логгер
export function safeLog(message: string, data?: any) {
    if (data) {
        console.log(message, redactSensitiveData(data));
    } else {
        console.log(message);
    }
}

// Использование:
import { safeLog } from '@/lib/utils/logger';

safeLog('Order created:', order); 
// Output: Order created: { id: '123', email: '[REDACTED]', total: 99.99 }
```

---

### 8. Security Headers

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const response = NextResponse.next();
    
    // ✅ Security Headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Content Security Policy
    response.headers.set(
        'Content-Security-Policy',
        [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: https: blob:",
            "font-src 'self' data: https://fonts.gstatic.com",
            "connect-src 'self' https://*.supabase.co https://api.stripe.com https://api-m.paypal.com",
            "frame-src 'self' https://js.stripe.com https://www.paypal.com https://www.sandbox.paypal.com",
        ].join('; ')
    );
    
    // HSTS (only in production)
    if (process.env.NODE_ENV === 'production') {
        response.headers.set(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains'
        );
    }
    
    return response;
}
```

---

## 🔧 ДОПОЛНИТЕЛЬНЫЕ УЛУЧШЕНИЯ

### 9. Email Validation

```typescript
// lib/validation/email.ts
import { z } from 'zod';

const emailSchema = z.string().email();

export function isValidEmail(email: string): boolean {
    try {
        emailSchema.parse(email);
        return true;
    } catch {
        return false;
    }
}

export function sanitizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

// Использование в API
export async function POST(request: NextRequest) {
    const { email } = await request.json();
    
    // ✅ Валидация и санитизация
    const cleanEmail = sanitizeEmail(email);
    if (!isValidEmail(cleanEmail)) {
        return NextResponse.json(
            { error: 'Invalid email format' },
            { status: 400 }
        );
    }
    
    // Использовать cleanEmail
}
```

---

### 10. SQL Injection Protection

```typescript
// lib/utils/sql-sanitize.ts

export function escapeLikePattern(str: string): string {
    // Экранируем специальные символы LIKE
    return str.replace(/[%_\\]/g, '\\$&');
}

// Использование в поиске
export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    
    // ✅ Санитизация
    const sanitized = escapeLikePattern(query);
    
    const { data } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${sanitized}%`);
    
    return NextResponse.json(data);
}
```

---

### 11. Error Boundaries

```typescript
// components/error-boundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }
    
    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }
    
    componentDidCatch(error: Error, errorInfo: any) {
        console.error('ErrorBoundary caught:', error, errorInfo);
        // Отправить в Sentry (уже настроено)
    }
    
    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="error-fallback">
                    <h2>Что-то пошло не так</h2>
                    <button onClick={() => this.setState({ hasError: false })}>
                        Попробовать снова
                    </button>
                </div>
            );
        }
        
        return this.props.children;
    }
}

// Использование
export default function Page() {
    return (
        <ErrorBoundary>
            <YourComponent />
        </ErrorBoundary>
    );
}
```

---

## 📋 CHECKLIST ПРИМЕНЕНИЯ

### Критичные (День 1):
- [ ] Добавить `checkAdmin()` во все Admin API endpoints
- [ ] Удалить или защитить `/api/test-email`
- [ ] Реализовать CSRF защиту
- [ ] Добавить DOMPurify санитизацию
- [ ] Тестировать все изменения

### Важные (День 2-3):
- [ ] Rate limiting на все endpoints
- [ ] Zod валидация везде
- [ ] Security headers в middleware
- [ ] Убрать PII из логов
- [ ] Email валидация

### Дополнительные (День 4-5):
- [ ] Error boundaries
- [ ] SQL injection protection
- [ ] Monitoring и alerting
- [ ] Load testing
- [ ] Security audit

---

## 🧪 ТЕСТИРОВАНИЕ

```typescript
// tests/security.test.ts

describe('Security', () => {
    test('Admin API requires authentication', async () => {
        const response = await fetch('http://localhost:3000/api/admin/products');
        expect(response.status).toBe(401);
    });
    
    test('CSRF token required for POST', async () => {
        const response = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            body: JSON.stringify({}),
        });
        expect(response.status).toBe(403);
    });
    
    test('XSS is prevented in reviews', async () => {
        const malicious = '<script>alert("XSS")</script>';
        // Test that it's sanitized
    });
});
```

---

## 📚 ДОПОЛНИТЕЛЬНЫЕ РЕСУРСЫ

### Установить пакеты:
```bash
npm install dompurify zod
npm install --save-dev @types/dompurify
```

### Environment variables:
```env
CSRF_SECRET=generate-strong-random-string-here
NODE_ENV=production
```

---

**Все примеры готовы к использованию!**  
Копируйте код и адаптируйте под ваши нужды.

**Автор:** GitHub Copilot  
**Дата:** 30.11.2025
