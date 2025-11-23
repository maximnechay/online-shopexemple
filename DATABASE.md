# 🗄️ Database Documentation

## Обзор

Проект использует **Supabase** (PostgreSQL) в качестве основной базы данных. База данных включает систему аутентификации, управление товарами, заказами и настройками магазина.

---

## 📊 Схема базы данных

### 1. Таблица `profiles`

Профили пользователей, автоматически создаются после регистрации.

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
```

**Поля:**
- `id` - UUID пользователя (связь с auth.users)
- `email` - Email пользователя
- `full_name` - Полное имя
- `role` - Роль (`user` или `admin`)
- `created_at` - Дата создания
- `updated_at` - Дата обновления

---

### 2. Таблица `products`

Каталог товаров магазина.

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

-- Индексы
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_in_stock ON products(in_stock);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_products_name_search ON products USING gin(to_tsvector('english', name));
```

**Поля:**
- `id` - Уникальный идентификатор
- `name` - Название товара
- `slug` - URL-friendly название
- `description` - Описание товара
- `price` - Цена
- `compare_at_price` - Старая цена (для скидок)
- `images` - Массив URL изображений
- `category` - Категория товара
- `brand` - Бренд
- `in_stock` - В наличии (boolean)
- `stock_quantity` - Количество на складе
- `tags` - Теги товара
- `rating` - Средний рейтинг (0-5)
- `review_count` - Количество отзывов
- `attributes` - Дополнительные атрибуты (JSON)
- `size` - Размер товара
- `featured` - Рекомендуемый товар
- `created_at` - Дата создания
- `updated_at` - Дата обновления

---

### 3. Таблица `orders`

Заказы клиентов.

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

-- Индексы
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_email ON orders(email);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_method ON orders(payment_method);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

**Поля:**
- `id` - Уникальный идентификатор
- `order_number` - Номер заказа (например, ORD-2024-001)
- `user_id` - ID пользователя (nullable для гостевых заказов)
- `email` - Email клиента
- `phone` - Телефон
- `first_name`, `last_name` - Имя и фамилия
- `street`, `house_number`, `postal_code`, `city` - Адрес доставки
- `subtotal` - Сумма товаров
- `shipping` - Стоимость доставки
- `total` - Итоговая сумма
- `delivery_method` - Способ доставки
- `payment_method` - Способ оплаты (paypal/stripe/cash)
- `payment_status` - Статус оплаты
- `status` - Статус заказа
- `notes` - Примечания
- `paypal_order_id` - ID заказа в PayPal
- `stripe_payment_intent_id` - ID платежа в Stripe
- `created_at`, `updated_at` - Даты

---

### 4. Таблица `order_items`

Товары в заказах.

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

-- Индексы
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

**Поля:**
- `id` - Уникальный идентификатор
- `order_id` - ID заказа
- `product_id` - ID товара (nullable, если товар удален)
- `product_name` - Название товара (сохраняется на момент заказа)
- `product_price` - Цена товара на момент заказа
- `quantity` - Количество
- `total` - Итоговая стоимость (price × quantity)
- `created_at` - Дата создания

---

### 5. Таблица `shop_settings`

Глобальные настройки магазина.

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

-- Вставка дефолтных настроек
INSERT INTO shop_settings (id) VALUES ('default') ON CONFLICT DO NOTHING;
```

**Поля:**
- `id` - Всегда 'default' (одна запись настроек)
- `shop_name` - Название магазина
- `shop_subtitle` - Подзаголовок
- `support_email` - Email поддержки
- `support_phone` - Телефон поддержки
- `address_line`, `postal_code`, `city`, `country` - Адрес магазина
- `default_currency` - Валюта по умолчанию
- `free_shipping_from` - Бесплатная доставка от суммы
- `tax_rate` - Ставка налога (%)
- `homepage_hero_text` - Текст на главной странице
- `created_at`, `updated_at` - Даты

---

## 🔐 Row Level Security (RLS) Policies

### Политики для `profiles`

```sql
-- Включаем RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Пользователи могут видеть только свой профиль
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Пользователи могут обновлять только свой профиль
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Админы видят все профили
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

### Политики для `products`

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Все могут читать товары
CREATE POLICY "Anyone can view products"
    ON products FOR SELECT
    TO PUBLIC
    USING (true);

-- Только админы могут создавать/обновлять/удалять товары
CREATE POLICY "Admins can manage products"
    ON products FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

### Политики для `orders`

```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Пользователи видят только свои заказы
CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT
    USING (
        auth.uid() = user_id
        OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Админы видят все заказы
CREATE POLICY "Admins can view all orders"
    ON orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Только админы могут обновлять заказы
CREATE POLICY "Admins can update orders"
    ON orders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

### Политики для `order_items`

```sql
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Пользователи видят items своих заказов
CREATE POLICY "Users can view own order items"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND (orders.user_id = auth.uid() OR orders.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
        )
    );

-- Админы видят все items
CREATE POLICY "Admins can view all order items"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

### Политики для `shop_settings`

```sql
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

-- Все могут читать настройки
CREATE POLICY "Anyone can view settings"
    ON shop_settings FOR SELECT
    TO PUBLIC
    USING (true);

-- Только админы могут обновлять
CREATE POLICY "Admins can update settings"
    ON shop_settings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

---

## ⚡ Database Triggers

### Автоматическое создание профиля при регистрации

```sql
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
```

### Автоматическое обновление updated_at

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Применяем к таблицам
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shop_settings_updated_at
    BEFORE UPDATE ON shop_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## 🔄 Миграции

### Полная инициализация БД

Выполните следующий SQL скрипт в Supabase SQL Editor:

```sql
-- 1. Создание таблиц
-- (Весь SQL код выше)

-- 2. Включение RLS
-- (Все политики выше)

-- 3. Создание triggers
-- (Все триггеры выше)

-- 4. Создание первого админа (замените email)
INSERT INTO auth.users (email, encrypted_password)
VALUES ('admin@example.com', crypt('your_password', gen_salt('bf')));

UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@example.com';
```

---

## 📈 Индексы для производительности

Все необходимые индексы уже включены в SQL выше. Основные индексы:

- **profiles**: email, role
- **products**: category, slug, in_stock, featured, full-text search
- **orders**: user_id, email, order_number, статусы, created_at
- **order_items**: order_id, product_id

---

## 🛠️ Полезные SQL запросы

### Статистика магазина

```sql
-- Общая статистика заказов
SELECT
    COUNT(*) as total_orders,
    SUM(total) as total_revenue,
    AVG(total) as average_order_value,
    COUNT(DISTINCT user_id) as unique_customers
FROM orders
WHERE payment_status = 'paid';

-- Популярные товары
SELECT
    p.name,
    COUNT(oi.id) as times_ordered,
    SUM(oi.quantity) as total_quantity_sold,
    SUM(oi.total) as total_revenue
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.payment_status = 'paid'
GROUP BY p.id, p.name
ORDER BY times_ordered DESC
LIMIT 10;

-- Статус заказов
SELECT
    status,
    COUNT(*) as count,
    SUM(total) as total_amount
FROM orders
GROUP BY status
ORDER BY count DESC;
```

### Резервное копирование

```sql
-- Экспорт всех данных (выполняется через CLI)
pg_dump -h db.your-project.supabase.co -U postgres -d postgres > backup.sql

-- Восстановление
psql -h db.your-project.supabase.co -U postgres -d postgres < backup.sql
```

---

## 🔗 Связанные документы

- [API Documentation](./API.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Security Guide](./SECURITY.md)