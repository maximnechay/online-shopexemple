# Миграция: Добавление стоимости доставки

## Что изменилось

Добавлено новое поле `shipping_cost` в таблицу `shop_settings` для хранения стоимости доставки.

## Выполнение миграции

### Через Supabase Dashboard

1. Откройте https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите в **SQL Editor**
4. Выполните следующий SQL:

```sql
-- Add shipping_cost column to shop_settings table
ALTER TABLE shop_settings
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10, 2) DEFAULT 4.99;

-- Update existing default record to have shipping cost
UPDATE shop_settings
SET shipping_cost = 4.99
WHERE id = 'default' AND shipping_cost IS NULL;

-- Add comment
COMMENT ON COLUMN shop_settings.shipping_cost IS 'Стоимость доставки (если не бесплатная)';
```

### Проверка

После выполнения миграции проверьте:

```sql
SELECT shipping_cost, free_shipping_from 
FROM shop_settings 
WHERE id = 'default';
```

Результат должен показать:
- `shipping_cost`: 4.99
- `free_shipping_from`: ваше значение (например, 49)

## Использование

Теперь стоимость доставки берется из базы данных:
- **Корзина** (`/cart`): Показывает стоимость доставки из настроек
- **Оформление заказа** (`/checkout`): Использует стоимость из настроек
- **Админ-панель** (будущее): Можно будет изменять стоимость доставки через интерфейс

### Значения по умолчанию:
- Стоимость доставки: **4.99 €**
- Бесплатная доставка от: **49 €**

## Обновленные файлы

- `lib/hooks/useShopSettings.ts` - Добавлено поле `shippingCost`
- `app/api/admin/settings/route.ts` - Добавлена обработка `shipping_cost`
- `app/cart/page.tsx` - Использует `settings?.shippingCost`
- `app/checkout/page.tsx` - Использует `settings?.shippingCost`
