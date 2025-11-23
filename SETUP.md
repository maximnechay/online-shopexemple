# 🛠️ Детальная настройка проекта

Пошаговое руководство по настройке проекта Beauty Salon E-commerce с нуля.

---

## 📋 Содержание

- [Подготовка окружения](#подготовка-окружения)
- [Установка проекта](#установка-проекта)
- [Настройка Supabase](#настройка-supabase)
- [Настройка PayPal](#настройка-paypal)
- [Настройка Stripe](#настройка-stripe)
- [Локальный запуск](#локальный-запуск)
- [Заполнение тестовыми данными](#заполнение-тестовыми-данными)

---

## 🔧 Подготовка окружения

### 1. Установка Node.js

**macOS (через Homebrew):**
```bash
brew install node@20
```

**Windows (через installer):**
1. Скачайте installer с [nodejs.org](https://nodejs.org/)
2. Запустите и следуйте инструкциям
3. Перезапустите терминал

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Проверка установки:**
```bash
node --version  # Должно быть >= 20.0.0
npm --version   # Должно быть >= 10.0.0
```

### 2. Установка Git

**macOS:**
```bash
brew install git
```

**Windows:**
Скачайте с [git-scm.com](https://git-scm.com/download/win)

**Linux:**
```bash
sudo apt-get install git
```

**Проверка:**
```bash
git --version
```

### 3. Выбор IDE/Редактора

Рекомендуем **VS Code** с расширениями:

1. Скачайте [VS Code](https://code.visualstudio.com/)
2. Установите расширения:
   - **ESLint** - Линтинг
   - **Prettier** - Форматирование
   - **Tailwind CSS IntelliSense** - Autocomplete для Tailwind
   - **TypeScript and JavaScript Language Features** - TypeScript поддержка

---

## 📦 Установка проекта

### 1. Клонирование репозитория

```bash
# HTTPS
git clone https://github.com/your-username/beauty-salon-shop.git

# или SSH
git clone git@github.com:your-username/beauty-salon-shop.git

# Переход в директорию
cd beauty-salon-shop
```

### 2. Установка зависимостей

```bash
# Установка всех npm пакетов
npm install

# Если возникают ошибки peer dependencies:
npm install --legacy-peer-deps
```

**Время установки:** ~2-5 минут в зависимости от интернета

### 3. Проверка установки

```bash
# Должны появиться:
ls node_modules/  # Папка с зависимостями
ls package-lock.json  # Lockfile
```

---

## 🗄️ Настройка Supabase

### 1. Создание проекта

1. Перейдите на [app.supabase.com](https://app.supabase.com)
2. Нажмите "New Project"
3. Заполните форму:
   - **Organization**: Выберите или создайте
   - **Name**: `beauty-salon-shop`
   - **Database Password**: Создайте надежный пароль (сохраните!)
   - **Region**: Выберите ближайший к вашим пользователям
   - **Pricing Plan**: Free (для начала)
4. Нажмите "Create new project"

**Время создания:** ~2 минуты

### 2. Получение API ключей

1. В проекте перейдите: **Settings** → **API**
2. Скопируйте:
   ```
   Project URL → NEXT_PUBLIC_SUPABASE_URL
   anon public → NEXT_PUBLIC_SUPABASE_ANON_KEY
   service_role → SUPABASE_SERVICE_ROLE_KEY
   ```

⚠️ **service_role** - секретный ключ! Никогда не делитесь им.

### 3. Настройка базы данных

#### Шаг 1: Создание таблиц

1. Перейдите в **SQL Editor**
2. Создайте новый query
3. Скопируйте и выполните SQL для каждой таблицы:

**profiles:**
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
```

**products:**
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    compare_at_price DECIMAL(10, 2) CHECK (compare_at_price >= 0),
    images TEXT[] DEFAULT '{}',
    category TEXT NOT NULL,
    brand TEXT,
    in_stock BOOLEAN DEFAULT TRUE,
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    tags TEXT[] DEFAULT '{}',
    rating DECIMAL(3, 2) CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
    attributes JSONB DEFAULT '{}',
    size TEXT,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_in_stock ON products(in_stock);
CREATE INDEX idx_products_featured ON products(featured);
```

**orders:**
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    street TEXT NOT NULL,
    house_number TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    city TEXT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    shipping DECIMAL(10, 2) NOT NULL CHECK (shipping >= 0),
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    delivery_method TEXT NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('paypal', 'stripe', 'cash')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    notes TEXT,
    paypal_order_id TEXT,
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_email ON orders(email);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

**order_items:**
```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_price DECIMAL(10, 2) NOT NULL CHECK (product_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

**shop_settings:**
```sql
CREATE TABLE shop_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    shop_name TEXT DEFAULT 'Beauty Salon Shop',
    shop_subtitle TEXT,
    support_email TEXT,
    support_phone TEXT,
    address_line TEXT,
    postal_code TEXT,
    city TEXT,
    country TEXT DEFAULT 'Deutschland',
    default_currency TEXT DEFAULT 'EUR',
    free_shipping_from DECIMAL(10, 2),
    tax_rate DECIMAL(5, 2) DEFAULT 19.00,
    homepage_hero_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO shop_settings (id) VALUES ('default') ON CONFLICT DO NOTHING;
```

#### Шаг 2: Включение RLS

Выполните в SQL Editor:

```sql
-- Включаем RLS для всех таблиц
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

-- Политики для products
CREATE POLICY "Anyone can view products"
    ON products FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "Admins can manage products"
    ON products FOR ALL
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Политики для orders
CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT
    USING (
        auth.uid() = user_id
        OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Admins can view all orders"
    ON orders FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can update orders"
    ON orders FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Политики для order_items
CREATE POLICY "Users can view own order items"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND (orders.user_id = auth.uid() OR orders.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
        )
    );

CREATE POLICY "Admins can view all order items"
    ON order_items FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Политики для settings
CREATE POLICY "Anyone can view settings"
    ON shop_settings FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "Admins can update settings"
    ON shop_settings FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
```

#### Шаг 3: Создание триггеров

```sql
-- Автоматическое создание профиля
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Автоматическое обновление updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shop_settings_updated_at
    BEFORE UPDATE ON shop_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4. Настройка аутентификации

1. Перейдите: **Authentication** → **Providers**
2. Включите **Email** provider
3. В **URL Configuration** добавьте:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: `http://localhost:3000/**`

### 5. Создание первого админа

**Вариант 1: Через SQL (рекомендуется)**
```sql
-- Создайте пользователя
INSERT INTO auth.users (
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data
)
VALUES (
  'admin@example.com',
  crypt('YourSecurePassword123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Admin User"}'::jsonb
);

-- Установите роль admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@example.com';
```

**Вариант 2: Через UI**
1. Запустите проект локально (см. ниже)
2. Зарегистрируйтесь через `/auth/register`
3. В Supabase SQL Editor выполните:
```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'ваш@email.com';
```

---

## 💳 Настройка PayPal

### 1. Создание Developer аккаунта

1. Перейдите на [developer.paypal.com](https://developer.paypal.com)
2. Войдите или создайте аккаунт
3. Перейдите в Dashboard

### 2. Создание приложения

1. Dashboard → **Apps & Credentials**
2. Переключитесь на **Sandbox** (для разработки)
3. Нажмите **Create App**
4. Заполните:
   - **App Name**: `Beauty Salon Shop`
   - **App Type**: Merchant
5. Нажмите **Create App**

### 3. Получение ключей

В разделе App Details скопируйте:
- **Client ID** → `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- **Secret** → `PAYPAL_CLIENT_SECRET`

### 4. Настройка Webhooks

1. В App Details → **Webhooks** → **Add Webhook**
2. **Webhook URL**: `http://localhost:3000/api/webhooks/paypal` (для разработки)
3. Выберите события:
   - ✅ `CHECKOUT.ORDER.APPROVED`
   - ✅ `PAYMENT.CAPTURE.COMPLETED`
   - ✅ `PAYMENT.CAPTURE.DENIED`
4. Сохраните и скопируйте **Webhook ID** → `PAYPAL_WEBHOOK_ID`

**Для продакшена** замените URL на `https://yourdomain.com/api/webhooks/paypal`

---

## 💰 Настройка Stripe

### 1. Создание аккаунта

1. Перейдите на [dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Создайте аккаунт
3. Заполните информацию о бизнесе

### 2. Получение API ключей

1. Dashboard → **Developers** → **API keys**
2. Убедитесь что **Test mode** включен
3. Скопируйте:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`

### 3. Настройка Webhooks

1. Developers → **Webhooks** → **Add endpoint**
2. **Endpoint URL**: `http://localhost:3000/api/webhooks/stripe`
3. Выберите события:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
4. Добавьте endpoint
5. Скопируйте **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### 4. Установка Stripe CLI (для локальной разработки)

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Windows:**
Скачайте с [github.com/stripe/stripe-cli](https://github.com/stripe/stripe-cli/releases)

**Linux:**
```bash
wget https://github.com/stripe/stripe-cli/releases/download/v1.17.3/stripe_1.17.3_linux_x86_64.tar.gz
tar -xvf stripe_1.17.3_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

**Логин:**
```bash
stripe login
```

---

## 🚀 Локальный запуск

### 1. Создание .env файла

```bash
# Создайте .env из примера
cp .env.example .env
```

### 2. Заполнение переменных

Откройте `.env` и заполните все значения, которые вы получили выше:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# PayPal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=AY...
PAYPAL_CLIENT_SECRET=EL...
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID=WH-...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Запуск проекта

**Терминал 1 - Next.js:**
```bash
npm run dev
```

**Терминал 2 - Stripe CLI (опционально):**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 4. Открытие в браузере

Перейдите на [http://localhost:3000](http://localhost:3000)

✅ Вы должны увидеть главную страницу магазина!

---

## 📊 Заполнение тестовыми данными

### 1. Через SQL Editor

```sql
-- Пример товара
INSERT INTO products (name, slug, description, price, category, images, in_stock, stock_quantity)
VALUES (
  'Hydrating Face Cream',
  'hydrating-face-cream',
  'Luxurious face cream with hyaluronic acid',
  29.99,
  'skincare',
  ARRAY['https://example.com/image1.jpg'],
  true,
  50
);
```

### 2. Через Admin панель

1. Зайдите как admin: [http://localhost:3000/auth/login](http://localhost:3000/auth/login)
2. Перейдите в Admin панель: [http://localhost:3000/admin](http://localhost:3000/admin)
3. Нажмите "Добавить товар"
4. Заполните форму и сохраните

### 3. Массовая загрузка

Создайте скрипт `scripts/seed.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const products = [
  {
    name: 'Product 1',
    slug: 'product-1',
    description: 'Description 1',
    price: 29.99,
    category: 'skincare',
    images: ['url1'],
    in_stock: true,
    stock_quantity: 10,
  },
  // ... больше товаров
];

async function seed() {
  const { error } = await supabase.from('products').insert(products);
  if (error) console.error(error);
  else console.log('✅ Products seeded!');
}

seed();
```

Запустите:
```bash
npx ts-node scripts/seed.ts
```

---

## ✅ Проверка установки

### Checklist

- [ ] Node.js и npm установлены
- [ ] Проект клонирован
- [ ] Зависимости установлены (`npm install`)
- [ ] Supabase проект создан
- [ ] База данных настроена (таблицы, RLS, триггеры)
- [ ] PayPal приложение создано
- [ ] Stripe аккаунт настроен
- [ ] `.env` файл заполнен
- [ ] Проект запускается (`npm run dev`)
- [ ] Главная страница открывается
- [ ] Admin пользователь создан
- [ ] Можно зайти в admin панель

---

## 🎉 Готово!

Теперь у вас полностью настроенный локальный environment для разработки!

### Следующие шаги

1. Добавьте тестовые товары через admin панель
2. Протестируйте checkout процесс
3. Проверьте оплату через PayPal Sandbox
4. Проверьте оплату через Stripe Test Mode
5. Изучите код и начните кастомизацию

### Полезные команды

```bash
# Разработка
npm run dev

# Production build
npm run build

# Запуск production build
npm start

# Проверка типов
npm run type-check

# Линтинг
npm run lint

# Форматирование (если настроен Prettier)
npm run format
```

---

## 🔗 Связанные документы

- [README.md](../README.md) - Обзор проекта
- [DATABASE.md](./DATABASE.md) - Полная схема БД
- [API.md](./API.md) - API документация
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Деплой в продакшен
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Решение проблем