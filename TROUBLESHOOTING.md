# 🔧 Troubleshooting Guide

Решение распространенных проблем и ошибок в проекте.

---

## 📋 Содержание

- [Проблемы с установкой](#проблемы-с-установкой)
- [Проблемы с Supabase](#проблемы-с-supabase)
- [Проблемы с аутентификацией](#проблемы-с-аутентификацией)
- [Проблемы с платежами](#проблемы-с-платежами)
- [Проблемы с API](#проблемы-с-api)
- [Проблемы с производительностью](#проблемы-с-производительностью)
- [Проблемы с деплоем](#проблемы-с-деплоем)

---

## 🔨 Проблемы с установкой

### Ошибка: "Module not found"

**Симптомы:**
```
Error: Cannot find module '@/lib/types'
```

**Решение:**
```bash
# 1. Очистите кэш
rm -rf node_modules
rm package-lock.json

# 2. Переустановите зависимости
npm install

# 3. Проверьте tsconfig.json paths
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}

# 4. Перезапустите dev server
npm run dev
```

---

### Ошибка: "npm ERR! peer dependency"

**Симптомы:**
```
npm ERR! peer dep missing: react@^18.0.0
```

**Решение:**
```bash
# Опция 1: Используйте --legacy-peer-deps
npm install --legacy-peer-deps

# Опция 2: Обновите проблемную зависимость
npm install react@latest react-dom@latest

# Опция 3: Используйте force (не рекомендуется)
npm install --force
```

---

### Ошибка: "Port 3000 already in use"

**Решение:**
```bash
# Найдите процесс использующий порт
lsof -i :3000

# Убейте процесс (замените PID)
kill -9 <PID>

# Или запустите на другом порту
PORT=3001 npm run dev
```

---

## 🗄️ Проблемы с Supabase

### Ошибка: "Invalid API key"

**Симптомы:**
```
Error: Invalid API key
Failed to fetch from Supabase
```

**Решение:**
```bash
# 1. Проверьте .env файл
cat .env | grep SUPABASE

# 2. Убедитесь что используете правильные ключи
# Supabase Dashboard → Settings → API
# Project URL → NEXT_PUBLIC_SUPABASE_URL
# anon/public → NEXT_PUBLIC_SUPABASE_ANON_KEY
# service_role → SUPABASE_SERVICE_ROLE_KEY

# 3. Перезапустите сервер после изменения .env
npm run dev
```

---

### Ошибка: "Row Level Security policy violation"

**Симптомы:**
```
Error: new row violates row-level security policy
Permission denied for table products
```

**Решение:**

1. **Проверьте RLS политики в Supabase SQL Editor:**

```sql
-- Посмотрите текущие политики
SELECT * FROM pg_policies WHERE tablename = 'products';

-- Для products должна быть политика для публичного чтения
CREATE POLICY "Anyone can view products"
    ON products FOR SELECT
    TO PUBLIC
    USING (true);
```

2. **Для admin операций убедитесь что используете service role key:**

```javascript
// ❌ Неправильно - используется anon key
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(url, ANON_KEY);

// ✅ Правильно - используется service role key
import { supabaseAdmin } from '@/lib/supabase/admin';
const { data } = await supabaseAdmin.from('products').insert(...);
```

---

### Ошибка: "Failed to fetch products from database"

**Симптомы:**
- Товары не загружаются
- Пустой экран на главной странице

**Решение:**

```javascript
// 1. Проверьте консоль браузера на ошибки
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

// 2. Проверьте что таблица products существует
// В Supabase SQL Editor:
SELECT * FROM products LIMIT 1;

// 3. Проверьте transformation функцию
// lib/supabase/helpers.ts должна корректно преобразовывать поля

// 4. Добавьте подробное логирование
console.log('Raw data from DB:', data);
console.log('Transformed products:', transformedProducts);
```

---

### Проблема: "Slow database queries"

**Решение:**

```sql
-- 1. Проверьте индексы
SELECT
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE tablename IN ('products', 'orders', 'order_items');

-- 2. Создайте недостающие индексы
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- 3. Анализируйте медленные запросы
EXPLAIN ANALYZE
SELECT * FROM products WHERE category = 'skincare';
```

---

## 🔐 Проблемы с аутентификацией

### Ошибка: "User not authenticated"

**Симптомы:**
```
Error: User not authenticated
Redirecting to login page
```

**Решение:**

```javascript
// 1. Проверьте что session сохраняется
const { data: { session } } = await supabase.auth.getSession();
console.log('Current session:', session);

// 2. Проверьте cookies в браузере
// DevTools → Application → Cookies
// Должны быть supabase-auth-token-*

// 3. Проверьте middleware.ts
export const config = {
  matcher: [
    '/profile/:path*',
    '/admin/:path*',
    // ... остальные защищенные пути
  ],
};
```

---

### Проблема: "Email confirmation not working"

**Решение:**

1. **Проверьте Email Templates в Supabase:**
   - Dashboard → Authentication → Email Templates
   - Убедитесь что Confirm signup template включен

2. **Для разработки отключите email confirmation:**
```sql
-- В Supabase SQL Editor
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'test@example.com';
```

3. **Проверьте Redirect URLs:**
   - Dashboard → Authentication → URL Configuration
   - Добавьте: `http://localhost:3000/**` и `https://yourdomain.com/**`

---

### Проблема: "Admin role not working"

**Симптомы:**
- Пользователь не может зайти в /admin
- 403 Forbidden на admin API

**Решение:**

```sql
-- 1. Проверьте роль пользователя
SELECT id, email, role FROM profiles WHERE email = 'your@email.com';

-- 2. Установите роль admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'your@email.com';

-- 3. Проверьте middleware защиту
-- middleware.ts должен проверять role из profiles таблицы
```

---

## 💳 Проблемы с платежами

### PayPal: "Failed to create order"

**Симптомы:**
```
Error: Failed to create PayPal order
Status: 401 Unauthorized
```

**Решение:**

```bash
# 1. Проверьте credentials
echo "Client ID: $NEXT_PUBLIC_PAYPAL_CLIENT_ID"
echo "Secret: $PAYPAL_CLIENT_SECRET"
echo "Mode: $PAYPAL_MODE"

# 2. Убедитесь что используете правильный mode
# sandbox для тестирования
# live для продакшена

# 3. Проверьте что не перепутали test/live ключи
# В PayPal Dashboard проверьте какой mode активен

# 4. Проверьте логи
# app/api/paypal/create-order/route.ts
console.log('PayPal Configuration:', {
  mode: PAYPAL_MODE,
  hasClientId: !!clientId,
  hasClientSecret: !!clientSecret
});
```

---

### PayPal: "Amount mismatch"

**Симптомы:**
```
Error: Amount in order doesn't match
PayPal shows different amount than expected
```

**Решение:**

```javascript
// ❌ ПРОБЛЕМА: Клиент отправляет сумму (небезопасно!)
fetch('/api/paypal/create-order', {
  body: JSON.stringify({ amount: 99.99 }) // Можно манипулировать!
});

// ✅ РЕШЕНИЕ: Сервер получает сумму из БД
fetch('/api/paypal/create-order', {
  body: JSON.stringify({ supabaseOrderId: 'uuid' })
});

// На сервере:
const { data: order } = await supabaseAdmin
  .from('orders')
  .select('total')
  .eq('id', supabaseOrderId)
  .single();

const paypalOrder = {
  amount: {
    value: order.total.toFixed(2) // Из БД!
  }
};
```

---

### Stripe: "Webhook signature verification failed"

**Симптомы:**
```
Error: No signatures found matching the expected signature
Webhook error: Invalid signature
```

**Решение:**

```javascript
// 1. Проверьте webhook secret
console.log('Webhook secret:', process.env.STRIPE_WEBHOOK_SECRET);

// 2. Для локального тестирования используйте Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

// 3. Убедитесь что используете raw body
// Next.js 13+ App Router:
export const config = {
  api: {
    bodyParser: false, // Важно для Stripe webhooks!
  },
};

// 4. Проверьте что secret соответствует endpoint
// Stripe Dashboard → Webhooks → Ваш endpoint → Signing secret
```

---

### Stripe: "Payment Intent already succeeded"

**Симптомы:**
```
Error: This PaymentIntent's amount could not be updated because it has a status of succeeded
```

**Решение:**

```javascript
// Не пытайтесь повторно захватить успешный платеж
const { data: order } = await supabase
  .from('orders')
  .select('payment_status')
  .eq('id', orderId)
  .single();

if (order.payment_status === 'paid') {
  return { message: 'Order already paid' };
}

// Создавайте новый payment intent для нового платежа
```

---

## 🌐 Проблемы с API

### Ошибка: "CORS policy"

**Симптомы:**
```
Access to fetch at 'X' from origin 'Y' has been blocked by CORS policy
```

**Решение:**

```javascript
// app/api/route.ts
export async function GET(request: Request) {
  const response = NextResponse.json(data);
  
  // Добавьте CORS headers если нужно
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  
  return response;
}
```

---

### Ошибка: "API route not found"

**Симптомы:**
```
404 Not Found
/api/products does not exist
```

**Решение:**

```bash
# 1. Проверьте структуру файлов
ls app/api/products/

# Должно быть:
# app/api/products/route.ts (для /api/products)
# app/api/products/[slug]/route.ts (для /api/products/:slug)

# 2. Убедитесь что экспортируете правильные методы
export async function GET(request: Request) { ... }
export async function POST(request: Request) { ... }

# 3. Перезапустите dev server
npm run dev
```

---

### Проблема: "Stale data / caching issues"

**Симптомы:**
- Старые данные после обновления
- Изменения не отображаются сразу

**Решение:**

```javascript
// Добавьте dynamic configuration
// app/api/products/route.ts
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Или используйте cache: 'no-store' в fetch
const response = await fetch('/api/products', {
  cache: 'no-store'
});
```

---

## ⚡ Проблемы с производительностью

### Проблема: "Slow page load"

**Диагностика:**
```bash
# 1. Проверьте bundle size
npm run build
npm run analyze # если настроен @next/bundle-analyzer

# 2. Используйте Lighthouse
# Chrome DevTools → Lighthouse → Generate report
```

**Решение:**

```javascript
// 1. Используйте dynamic imports
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
  ssr: false // Если не нужен SSR
});

// 2. Оптимизируйте изображения
import Image from 'next/image';

<Image
  src="/product.jpg"
  width={500}
  height={500}
  alt="Product"
  loading="lazy"
  placeholder="blur"
/>

// 3. Используйте suspense
import { Suspense } from 'react';

<Suspense fallback={<Skeleton />}>
  <ProductList />
</Suspense>
```

---

### Проблема: "Memory leak"

**Симптомы:**
- Приложение тормозит со временем
- Увеличение потребления RAM

**Решение:**

```javascript
// 1. Очищайте subscriptions
useEffect(() => {
  const subscription = supabase
    .channel('products')
    .on('*', handleChange)
    .subscribe();

  return () => {
    subscription.unsubscribe(); // ✅ Важно!
  };
}, []);

// 2. Используйте AbortController для fetch
useEffect(() => {
  const controller = new AbortController();
  
  fetch('/api/products', { signal: controller.signal })
    .then(handleData);
  
  return () => controller.abort(); // ✅ Отменяет запрос
}, []);

// 3. Проверьте Zustand store на утечки
// Избегайте хранения больших объектов
```

---

## 🚀 Проблемы с деплоем

### Ошибка: "Build failed on Vercel"

**Симптомы:**
```
Error: Command "npm run build" exited with 1
Type error: Cannot find module
```

**Решение:**

```bash
# 1. Проверьте локальный build
npm run build

# 2. Проверьте все environment variables в Vercel
# Settings → Environment Variables

# 3. Проверьте что все зависимости в package.json
npm install --save missing-package

# 4. Проверьте TypeScript errors
npm run type-check

# 5. Проверьте Node.js версию
# package.json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

### Проблема: "Environment variables not working in production"

**Решение:**

```bash
# 1. Убедитесь что переменные добавлены в Vercel
# для Production environment

# 2. Redeploy после добавления переменных
vercel --prod

# 3. Проверьте naming
# Клиентские переменные ДОЛЖНЫ начинаться с NEXT_PUBLIC_
NEXT_PUBLIC_SUPABASE_URL=... # ✅ Работает в браузере
SUPABASE_SERVICE_ROLE_KEY=... # ❌ Только на сервере

# 4. Проверьте в runtime
// На сервере
console.log('Server env:', process.env.SUPABASE_SERVICE_ROLE_KEY);

// В браузере (только NEXT_PUBLIC_*)
console.log('Client env:', process.env.NEXT_PUBLIC_SUPABASE_URL);
```

---

### Проблема: "Webhooks not triggering"

**Решение:**

```bash
# 1. Проверьте что URL доступен
curl https://yourdomain.com/api/webhooks/paypal

# 2. Проверьте логи в провайдере
# PayPal: Dashboard → Webhooks → Recent Deliveries
# Stripe: Dashboard → Webhooks → Events

# 3. Проверьте webhook ID/secret в env
echo $PAYPAL_WEBHOOK_ID
echo $STRIPE_WEBHOOK_SECRET

# 4. Включите detailed logging
// app/api/webhooks/paypal/route.ts
console.log('Webhook received:', JSON.stringify(body, null, 2));
console.log('Headers:', JSON.stringify(headers, null, 2));

# 5. Для локального тестирования используйте ngrok
ngrok http 3000
# Используйте HTTPS URL в webhook settings
```

---

## 🔍 Общие советы по отладке

### Включите подробное логирование

```javascript
// lib/debug.ts
export const DEBUG = process.env.NODE_ENV === 'development';

export function debugLog(label: string, data: any) {
  if (DEBUG) {
    console.log(`[DEBUG] ${label}:`, JSON.stringify(data, null, 2));
  }
}

// Использование
debugLog('Order data', orderData);
```

### Проверьте Network tab

1. Откройте DevTools → Network
2. Воспроизведите проблему
3. Проверьте:
   - Status codes
   - Response времена
   - Request/Response headers
   - Payload

### Используйте React DevTools

```bash
# Установите расширение
# Chrome: https://chrome.google.com/webstore → React Developer Tools

# Проверьте:
# - Components tree
# - Props
# - State
# - Hooks
```

---

## 📞 Когда обращаться за помощью

Если проблема не решается:

1. **Соберите информацию:**
   - Полный текст ошибки
   - Шаги для воспроизведения
   - Версии зависимостей
   - Логи консоли и сервера

2. **Проверьте документацию:**
   - [Next.js Docs](https://nextjs.org/docs)
   - [Supabase Docs](https://supabase.com/docs)
   - [PayPal Developer](https://developer.paypal.com)
   - [Stripe Docs](https://stripe.com/docs)

3. **Создайте issue на GitHub** (если репозиторий публичный)

4. **Обратитесь в поддержку:**
   - Supabase Support
   - PayPal Developer Support
   - Stripe Support

---

## 🔗 Связанные документы

- [Database Schema](./DATABASE.md)
- [API Documentation](./API.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Security Guide](./SECURITY.md)