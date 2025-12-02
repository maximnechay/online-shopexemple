# 🚀 КРИТИЧНЫЕ ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ

## ✅ Что было сделано (1 декабря 2025)

### 1. 🔐 Admin Authentication
**Файлы:**
- ✅ `lib/auth/admin-check.ts` - Проверка прав админа
- ✅ `app/api/admin/products/route.ts` - Защищено

**Как использовать:**
```typescript
import { checkAdmin } from '@/lib/auth/admin-check';

export async function POST(request: NextRequest) {
    const adminCheck = await checkAdmin(request);
    if (adminCheck instanceof NextResponse) {
        return adminCheck; // Возвращаем ошибку 401/403
    }
    // Продолжаем...
}
```

**Статус:** ✅ Применено к `/api/admin/products`  
**TODO:** Применить к остальным admin endpoints (см. список ниже)

---

### 2. 🛡️ CSRF Protection
**Файлы:**
- ✅ `lib/security/csrf.ts` - Генерация и верификация токенов
- ✅ `app/api/csrf-token/route.ts` - Endpoint для получения токена
- ✅ `lib/hooks/useCSRF.ts` - React hook

**Как использовать на клиенте:**
```typescript
import { useCSRFToken } from '@/lib/hooks/useCSRF';

function MyForm() {
    const { token, loading } = useCSRFToken();
    
    async function handleSubmit() {
        await fetch('/api/endpoint', {
            method: 'POST',
            headers: {
                'x-csrf-token': token,
            },
            body: JSON.stringify(data),
        });
    }
}
```

**Статус:** ✅ Код готов  
**TODO:** Добавить проверку в middleware.ts (см. инструкцию ниже)

---

### 3. 🧹 XSS Protection
**Файлы:**
- ✅ `lib/utils/sanitize.ts` - Санитизация HTML

**Функции:**
- `sanitizeHTML(text)` - Полная санитизация (для заголовков)
- `sanitizeReview(text)` - Базовое форматирование
- `sanitizeProductDescription(text)` - Для админа

**Где применено:**
- ✅ `app/api/reviews/route.ts` - Отзывы санитизируются
- ✅ `app/api/admin/products/route.ts` - Описания санитизируются

**Статус:** ✅ Применено

---

### 4. 🔒 Test Email Protection
**Файлы:**
- ✅ `app/api/test-email/route.ts`

**Защита:**
- ⚠️ Доступен только в development
- ⚠️ Rate limit: 2 запроса в час
- ⚠️ В production возвращает 404

**Статус:** ✅ Защищено

---

### 5. ✅ Input Validation
**Файлы:**
- ✅ `lib/validation/schemas.ts` - Zod схемы для всех endpoints

**Где применено:**
- ✅ `app/api/admin/products/route.ts` - Products валидируются
- ✅ `app/api/reviews/route.ts` - Reviews валидируются

**Статус:** ✅ Применено  
**TODO:** Применить к остальным endpoints

---

### 6. 📝 Safe Logging
**Файлы:**
- ✅ `lib/utils/logger.ts` - Безопасное логирование

**Функции:**
- `safeLog(message, data)` - Автоматически скрывает PII
- `safeError(message, data)` - Для ошибок
- `redactSensitiveData(obj)` - Ручная очистка

**Где применено:**
- ✅ `app/api/admin/products/route.ts`
- ✅ `app/api/reviews/route.ts`

**Статус:** ✅ Применено

---

## 📋 СЛЕДУЮЩИЕ ШАГИ

### Критично (сегодня):

#### 1. Добавить CSRF в middleware
```typescript
// middleware.ts
import { verifyCSRFToken } from '@/lib/security/csrf';

export function middleware(request: NextRequest) {
    // CSRF для state-changing запросов
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        // Пропускаем webhooks (они имеют свою верификацию)
        if (!request.nextUrl.pathname.startsWith('/api/webhooks')) {
            const token = request.headers.get('x-csrf-token');
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
```

#### 2. Защитить остальные Admin endpoints

**Список endpoints без защиты:**
```
app/api/admin/
├── categories/route.ts          ❌ НЕТ checkAdmin()
├── coupons/route.ts             ❌ НЕТ checkAdmin()
├── orders/
│   ├── route.ts                 ❌ НЕТ checkAdmin()
│   └── [orderId]/route.ts       ❌ НЕТ checkAdmin()
├── reviews/
│   └── [id]/approve/route.ts    ❌ НЕТ checkAdmin() - КРИТИЧНО!
└── newsletter/
    └── send/route.ts            ❌ НЕТ checkAdmin() - КРИТИЧНО!
```

**Шаблон для копирования:**
```typescript
import { checkAdmin } from '@/lib/auth/admin-check';
import { validateSchema, YourSchema } from '@/lib/validation/schemas';
import { safeLog } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
    // ✅ Admin check
    const adminCheck = await checkAdmin(request);
    if (adminCheck instanceof NextResponse) {
        return adminCheck;
    }
    
    // ✅ Rate limiting
    const rateLimitResult = rateLimit(request, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Too many requests' },
            { status: 429 }
        );
    }
    
    // ✅ Validation
    const body = await request.json();
    const validation = validateSchema(YourSchema, body);
    if (!validation.success) {
        return NextResponse.json(
            { error: 'Validation failed', details: validation.errors },
            { status: 400 }
        );
    }
    
    // Your logic...
    safeLog('✅ Action completed', { id: result.id });
}
```

---

## 🔧 УСТАНОВКА ЗАВИСИМОСТЕЙ

```bash
# Уже установлены:
npm install dompurify isomorphic-dompurify jsdom @types/dompurify @types/jsdom

# Environment variables
cp .env.local.example .env.local
```

Добавьте в `.env.local`:
```env
# CSRF Secret (generate random string)
CSRF_SECRET=your-random-secret-min-32-chars
```

Генерация секрета:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ✅ ТЕСТИРОВАНИЕ

### 1. Проверка Admin Auth
```bash
# Должно вернуть 401 (без авторизации)
curl http://localhost:3000/api/admin/products

# После входа как админ - 200
curl -H "Cookie: sb-xxx" http://localhost:3000/api/admin/products
```

### 2. Проверка CSRF
```bash
# Должно вернуть 403 (без токена)
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{}'

# С токеном - успех
```

### 3. Проверка XSS
```bash
curl -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -d '{"comment": "<script>alert(\"XSS\")</script>", ...}'
  
# В базе должно быть без <script>
```

### 4. Проверка Test Email
```bash
# Production - должно вернуть 404
curl http://localhost:3000/api/test-email
```

---

## 📊 ПРОГРЕСС

### Критичные проблемы:
- [x] Admin API authentication (частично - 1 из 6 endpoints)
- [x] Test email protection
- [x] XSS protection
- [x] Input validation (частично)
- [x] Safe logging
- [ ] CSRF middleware (код готов, нужно подключить)

### Следующие endpoints для защиты:
```
Priority 1 (критично):
- [ ] /api/admin/newsletter/send
- [ ] /api/admin/reviews/[id]/approve
- [ ] /api/admin/orders/[orderId]

Priority 2 (важно):
- [ ] /api/admin/categories
- [ ] /api/admin/coupons
- [ ] /api/admin/orders
```

---

## 🎯 ОЦЕНКА ВРЕМЕНИ

**Выполнено:** ~4 часа  
**Осталось:**
- CSRF middleware: 30 минут
- Защита 5 admin endpoints: 2 часа
- Тестирование: 1 час

**Итого:** ~3.5 часа до полной готовности критичных исправлений

---

## 📞 HELP

Если что-то не работает:

1. **Ошибки TypeScript** - проверьте что установлены все пакеты
2. **401/403 ошибки** - проверьте что пользователь имеет role='admin' в profiles
3. **CSRF ошибки** - проверьте что токен передаётся в header 'x-csrf-token'
4. **Sanitize ошибки** - проверьте что установлен isomorphic-dompurify

---

**Дата:** 1 декабря 2025  
**Статус:** ✅ Критичные компоненты созданы, частично применены  
**Следующий шаг:** Применить к оставшимся endpoints + CSRF middleware
