# 🚀 Deployment Guide

Полное руководство по развертыванию проекта в production.

---

## 📋 Содержание

- [Подготовка к деплою](#подготовка-к-деплою)
- [Настройка Supabase](#настройка-supabase)
- [Развертывание на Vercel](#развертывание-на-vercel)
- [Настройка PayPal](#настройка-paypal)
- [Настройка Stripe](#настройка-stripe)
- [Настройка Webhooks](#настройка-webhooks)
- [Post-Deployment Checklist](#post-deployment-checklist)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Подготовка к деплою

### 1. Локальная проверка

Перед деплоем убедитесь, что проект работает локально:

```bash
# Установка зависимостей
npm install

# Проверка типов
npm run type-check

# Линтинг
npm run lint

# Сборка проекта
npm run build

# Запуск production build локально
npm start
```

### 2. Проверка environment variables

Убедитесь, что у вас есть все необходимые переменные окружения:

```bash
# Проверьте .env файл
cat .env

# Или используйте этот скрипт
node -e "
const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_PAYPAL_CLIENT_ID',
  'PAYPAL_CLIENT_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY'
];
required.forEach(v => {
  if (!process.env[v]) console.error('Missing:', v);
});
"
```

---

## 🗄️ Настройка Supabase

### 1. Создание проекта

1. Перейдите на [app.supabase.com](https://app.supabase.com)
2. Нажмите "New Project"
3. Заполните данные:
   - **Name**: beauty-salon-shop
   - **Database Password**: Сохраните надежный пароль
   - **Region**: Выберите ближайший к вашим пользователям
   - **Pricing Plan**: Free или Pro

### 2. Настройка базы данных

Перейдите в SQL Editor и выполните:

```sql
-- 1. Создайте все таблицы из DATABASE.md
-- Скопируйте и выполните весь SQL код

-- 2. Включите Row Level Security
-- Выполните все RLS политики

-- 3. Создайте триггеры
-- Выполните код триггеров

-- 4. Вставьте начальные данные (опционально)
INSERT INTO shop_settings (id) VALUES ('default');
```

### 3. Получение API ключей

1. Перейдите в **Settings** → **API**
2. Скопируйте:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (секретный!) → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Настройка аутентификации

1. Перейдите в **Authentication** → **Providers**
2. Включите Email provider
3. Настройте Email Templates (опционально)
4. В **URL Configuration** установите:
   - **Site URL**: `https://yourdomain.com`
   - **Redirect URLs**: 
     ```
     https://yourdomain.com/**
     http://localhost:3000/**
     ```

### 5. Создание первого админа

```sql
-- Вариант 1: Через SQL Editor
INSERT INTO auth.users (
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data
)
VALUES (
  'admin@yourdomain.com',
  crypt('your_secure_password', gen_salt('bf')),
  NOW(),
  '{"full_name": "Admin User"}'::jsonb
);

-- Установите роль admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@yourdomain.com';

-- Вариант 2: Через Sign Up и ручное обновление
-- 1. Зарегистрируйтесь через UI
-- 2. Выполните в SQL Editor:
UPDATE profiles
SET role = 'admin'
WHERE email = 'your@email.com';
```

---

## ☁️ Развертывание на Vercel

### 1. Подготовка репозитория

```bash
# Создайте Git репозиторий (если еще не создан)
git init
git add .
git commit -m "Initial commit"

# Создайте репозиторий на GitHub/GitLab
# Запушьте код
git remote add origin https://github.com/username/beauty-salon-shop.git
git push -u origin main
```

### 2. Импорт проекта в Vercel

1. Перейдите на [vercel.com](https://vercel.com)
2. Нажмите "Add New" → "Project"
3. Импортируйте ваш Git репозиторий
4. Настройте проект:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3. Настройка Environment Variables

В Vercel Dashboard → Settings → Environment Variables добавьте:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# PayPal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
PAYPAL_MODE=live  # или sandbox для тестирования
PAYPAL_WEBHOOK_ID=your_webhook_id

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

**Важно**: Отметьте каждую переменную для правильных окружений:
- Production ✅
- Preview ✅ (опционально)
- Development ✅ (опционально)

### 4. Деплой

```bash
# Через Git
git push origin main
# Vercel автоматически задеплоит

# Или через Vercel CLI
npm i -g vercel
vercel --prod
```

### 5. Настройка домена

1. В Vercel Dashboard → Settings → Domains
2. Добавьте свой домен
3. Настройте DNS записи у вашего регистратора:

```
Type  Name  Value
A     @     76.76.21.21
CNAME www   cname.vercel-dns.com
```

4. Дождитесь проверки DNS (может занять до 48 часов)
5. Включите SSL (автоматически через Let's Encrypt)

---

## 💳 Настройка PayPal

### 1. Создание приложения

**Для Sandbox (тестирование):**
1. Перейдите на [developer.paypal.com](https://developer.paypal.com)
2. Войдите в Dashboard
3. Apps & Credentials → Create App
4. Выберите "Merchant" и нажмите "Create App"

**Для Production:**
1. Переключитесь на Live в Dashboard
2. Создайте новое приложение
3. Пройдите процесс верификации бизнеса

### 2. Получение ключей

В App Details скопируйте:
- **Client ID** → `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- **Secret** → `PAYPAL_CLIENT_SECRET`

### 3. Настройка Return URLs

В App Settings → App settings добавьте:
```
https://yourdomain.com/checkout
https://yourdomain.com/order-confirmation
```

### 4. Настройка Webhooks

1. В App Details → Webhooks → Add Webhook
2. **Webhook URL**: `https://yourdomain.com/api/webhooks/paypal`
3. Выберите события:
   - ✅ `CHECKOUT.ORDER.APPROVED`
   - ✅ `PAYMENT.CAPTURE.COMPLETED`
   - ✅ `PAYMENT.CAPTURE.DENIED`
4. Сохраните и скопируйте **Webhook ID** → `PAYPAL_WEBHOOK_ID`

### 5. Переключение на Live

После тестирования:

```bash
# Обновите в Vercel
PAYPAL_MODE=live
NEXT_PUBLIC_PAYPAL_CLIENT_ID=live_client_id
PAYPAL_CLIENT_SECRET=live_secret
```

---

## 💰 Настройка Stripe

### 1. Создание аккаунта

1. Перейдите на [dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Создайте аккаунт
3. Заполните информацию о бизнесе

### 2. Получение API ключей

1. Dashboard → Developers → API keys
2. Скопируйте:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`

**Test mode**: Используйте тестовые ключи `pk_test_*` и `sk_test_*`  
**Live mode**: Переключитесь и используйте `pk_live_*` и `sk_live_*`

### 3. Настройка Webhooks

1. Developers → Webhooks → Add endpoint
2. **Endpoint URL**: `https://yourdomain.com/api/webhooks/stripe`
3. Выберите события:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
4. Добавьте endpoint
5. Скопируйте **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### 4. Тестирование

Используйте тестовые карты Stripe:

```
Успешная оплата:
4242 4242 4242 4242
Любая дата в будущем
Любой CVC

Отклоненная карта:
4000 0000 0000 0002

3D Secure:
4000 0027 6000 3184
```

### 5. Переключение на Live

1. Активируйте аккаунт (заполните все формы)
2. Получите одобрение от Stripe
3. Переключитесь на Live mode
4. Обновите все ключи в Vercel на live версии

---

## 🔔 Настройка Webhooks

### Тестирование Webhooks локально

#### PayPal

```bash
# Используйте ngrok для локального тестирования
npm install -g ngrok
ngrok http 3000

# Используйте HTTPS URL в PayPal Webhook settings
https://xxx.ngrok.io/api/webhooks/paypal
```

#### Stripe CLI

```bash
# Установите Stripe CLI
brew install stripe/stripe-cli/stripe
# или
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe

# Логин
stripe login

# Форвардинг webhook events
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Получите webhook secret и добавьте в .env
```

### Верификация Webhooks в Production

**Проверка PayPal:**
```bash
curl -X POST https://yourdomain.com/api/webhooks/paypal \
  -H "Content-Type: application/json" \
  -H "paypal-transmission-id: test" \
  -d '{"event_type":"CHECKOUT.ORDER.APPROVED"}'
```

**Проверка Stripe:**
```bash
stripe trigger payment_intent.succeeded
```

---

## ✅ Post-Deployment Checklist

### Безопасность

- [ ] Все секретные ключи в переменных окружения (не в коде)
- [ ] HTTPS включен на домене
- [ ] CORS настроен правильно
- [ ] RLS политики включены в Supabase
- [ ] Webhook верификация работает
- [ ] Rate limiting настроен (опционально)

### Функциональность

- [ ] Регистрация и логин работают
- [ ] Товары загружаются с Supabase
- [ ] Корзина сохраняется
- [ ] Checkout процесс работает
- [ ] PayPal оплата работает
- [ ] Stripe оплата работает
- [ ] Webhooks обрабатываются
- [ ] Админ панель доступна
- [ ] Email уведомления работают (если настроены)

### Производительность

- [ ] Изображения оптимизированы
- [ ] Lazy loading включен
- [ ] Кэширование API настроено
- [ ] CDN для статики (через Vercel автоматически)
- [ ] Database индексы созданы

### Мониторинг

- [ ] Error tracking настроен (Sentry рекомендуется)
- [ ] Analytics настроена (Google Analytics, Vercel Analytics)
- [ ] Uptime monitoring (опционально)
- [ ] Database backups настроены в Supabase

### SEO

- [ ] Meta tags настроены
- [ ] Sitemap.xml создан
- [ ] Robots.txt настроен
- [ ] Open Graph теги добавлены
- [ ] Google Search Console настроена

---

## 🐛 Troubleshooting

### Проблема: "Supabase RLS blocking requests"

**Решение:**
```sql
-- Проверьте политики
SELECT * FROM pg_policies WHERE tablename = 'products';

-- Убедитесь что policies включены правильно
-- Для products должна быть policy для анонимного чтения
```

### Проблема: "PayPal webhook не работает"

**Решение:**
1. Проверьте Webhook ID в переменных
2. Убедитесь что URL доступен (не localhost)
3. Проверьте логи в PayPal Dashboard
4. Проверьте signature verification в коде

### Проблема: "Stripe webhook fails verification"

**Решение:**
```javascript
// Убедитесь что используете правильный secret
const secret = process.env.STRIPE_WEBHOOK_SECRET;

// Для локального тестирования используйте CLI secret
stripe listen --print-secret
```

### Проблема: "Environment variables не загружаются"

**Решение:**
1. Проверьте что переменные добавлены в Vercel
2. Redeploy проект после добавления переменных
3. Проверьте naming (NEXT_PUBLIC_ для клиента)
4. Проверьте что переменные добавлены для Production environment

### Проблема: "Database connection errors"

**Решение:**
```javascript
// Проверьте URL и ключи
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

// Проверьте что используете правильный клиент
// Server side - используйте service role key
// Client side - используйте anon key
```

---

## 📊 Мониторинг Production

### Рекомендуемые сервисы

**Error Tracking:**
- [Sentry](https://sentry.io) - лучший выбор для Next.js
- [LogRocket](https://logrocket.com) - с session replay

**Uptime Monitoring:**
- [UptimeRobot](https://uptimerobot.com) - бесплатно до 50 мониторов
- [Pingdom](https://www.pingdom.com)

**Analytics:**
- Vercel Analytics (встроено)
- Google Analytics 4
- Plausible (privacy-friendly)

### Настройка Sentry

```bash
npm install @sentry/nextjs

# Инициализация
npx @sentry/wizard@latest -i nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

---

## 🔗 Полезные ссылки

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [PayPal Developer Docs](https://developer.paypal.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## 🔄 Регулярное обслуживание

### Еженедельно
- Проверка логов ошибок
- Мониторинг производительности
- Проверка failed webhooks

### Ежемесячно
- Обновление зависимостей: `npm update`
- Проверка security уязвимостей: `npm audit`
- Резервное копирование БД
- Обзор аналитики

### По мере необходимости
- Масштабирование Supabase плана
- Оптимизация медленных запросов
- Обновление контента
- A/B тестирование

---

## 🔗 Связанные документы

- [Database Schema](./DATABASE.md)
- [API Documentation](./API.md)
- [Security Guide](./SECURITY.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)