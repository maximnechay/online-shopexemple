-- Migration: Update orders table structure
-- Обновление структуры таблицы orders для новых полей

-- Удаляем старые колонки если они существуют
ALTER TABLE orders DROP COLUMN IF EXISTS customer_name;
ALTER TABLE orders DROP COLUMN IF EXISTS customer_email;
ALTER TABLE orders DROP COLUMN IF EXISTS customer_phone;
ALTER TABLE orders DROP COLUMN IF EXISTS delivery_address;
ALTER TABLE orders DROP COLUMN IF EXISTS delivery_city;
ALTER TABLE orders DROP COLUMN IF EXISTS delivery_postal_code;
ALTER TABLE orders DROP COLUMN IF EXISTS total_amount;

-- Добавляем новые колонки
ALTER TABLE orders ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS house_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT;

-- Добавляем колонку paypal_order_id если её нет
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paypal_order_id TEXT;

-- Добавляем колонку stripe_session_id если её нет
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

-- Устанавливаем NOT NULL для критичных полей (только для новых записей)
-- Для существующих записей устанавливаем дефолтные значения
UPDATE orders SET first_name = COALESCE(first_name, '') WHERE first_name IS NULL;
UPDATE orders SET last_name = COALESCE(last_name, '') WHERE last_name IS NULL;
UPDATE orders SET email = COALESCE(email, '') WHERE email IS NULL;
UPDATE orders SET phone = COALESCE(phone, '') WHERE phone IS NULL;
UPDATE orders SET street = COALESCE(street, '') WHERE street IS NULL;
UPDATE orders SET house_number = COALESCE(house_number, '') WHERE house_number IS NULL;
UPDATE orders SET city = COALESCE(city, '') WHERE city IS NULL;
UPDATE orders SET postal_code = COALESCE(postal_code, '') WHERE postal_code IS NULL;
UPDATE orders SET subtotal = COALESCE(subtotal, 0) WHERE subtotal IS NULL;
UPDATE orders SET shipping = COALESCE(shipping, 0) WHERE shipping IS NULL;
UPDATE orders SET total = COALESCE(total, 0) WHERE total IS NULL;
UPDATE orders SET order_number = COALESCE(order_number, 'ORD-' || id::text) WHERE order_number IS NULL;

-- Теперь устанавливаем NOT NULL
ALTER TABLE orders ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE orders ALTER COLUMN last_name SET NOT NULL;
ALTER TABLE orders ALTER COLUMN email SET NOT NULL;
ALTER TABLE orders ALTER COLUMN phone SET NOT NULL;
ALTER TABLE orders ALTER COLUMN street SET NOT NULL;
ALTER TABLE orders ALTER COLUMN house_number SET NOT NULL;
ALTER TABLE orders ALTER COLUMN city SET NOT NULL;
ALTER TABLE orders ALTER COLUMN postal_code SET NOT NULL;
ALTER TABLE orders ALTER COLUMN subtotal SET NOT NULL;
ALTER TABLE orders ALTER COLUMN shipping SET NOT NULL;
ALTER TABLE orders ALTER COLUMN total SET NOT NULL;
ALTER TABLE orders ALTER COLUMN order_number SET NOT NULL;

-- Добавляем проверки (constraints)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_subtotal_check;
ALTER TABLE orders ADD CONSTRAINT orders_subtotal_check CHECK (subtotal >= 0);

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_shipping_check;
ALTER TABLE orders ADD CONSTRAINT orders_shipping_check CHECK (shipping >= 0);

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_total_check;
ALTER TABLE orders ADD CONSTRAINT orders_total_check CHECK (total >= 0);

-- Создаем уникальный индекс для order_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number_unique ON orders(order_number);

-- Добавляем индексы для новых полей
CREATE INDEX IF NOT EXISTS idx_orders_first_name ON orders(first_name);
CREATE INDEX IF NOT EXISTS idx_orders_last_name ON orders(last_name);
CREATE INDEX IF NOT EXISTS idx_orders_city ON orders(city);

-- Комментарии
COMMENT ON COLUMN orders.first_name IS 'Имя клиента';
COMMENT ON COLUMN orders.last_name IS 'Фамилия клиента';
COMMENT ON COLUMN orders.email IS 'Email клиента';
COMMENT ON COLUMN orders.phone IS 'Телефон клиента';
COMMENT ON COLUMN orders.street IS 'Улица доставки';
COMMENT ON COLUMN orders.house_number IS 'Номер дома';
COMMENT ON COLUMN orders.city IS 'Город доставки';
COMMENT ON COLUMN orders.postal_code IS 'Почтовый индекс';
COMMENT ON COLUMN orders.subtotal IS 'Сумма товаров без доставки';
COMMENT ON COLUMN orders.shipping IS 'Стоимость доставки';
COMMENT ON COLUMN orders.total IS 'Общая сумма заказа';
COMMENT ON COLUMN orders.order_number IS 'Уникальный номер заказа';

-- ===== UPDATE ORDER_ITEMS TABLE =====

-- Добавляем колонку total в order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS total DECIMAL(10, 2);

-- Устанавливаем значения для существующих записей
UPDATE order_items 
SET total = product_price * quantity 
WHERE total IS NULL;

-- Устанавливаем NOT NULL и проверку
ALTER TABLE order_items ALTER COLUMN total SET NOT NULL;
ALTER TABLE order_items ADD CONSTRAINT order_items_total_check CHECK (total >= 0);

-- Комментарий
COMMENT ON COLUMN order_items.total IS 'Общая стоимость позиции (цена × количество)';
