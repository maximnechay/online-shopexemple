# 🎫 Система купонов и промокодов

Простая и мощная система скидок для вашего магазина.

---

## 🚀 Быстрый старт

### 1. Запустить миграцию

Откройте [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor

Скопируйте и выполните: `supabase/migrations/20250130_coupon_system.sql`

### 2. Проверка установки

```sql
SELECT * FROM coupons;
```

Должны быть 4 тестовых купона:
- `WELCOME10` - €10 скидка
- `SALE15` - 15% скидка
- `FREESHIP` - Бесплатная доставка
- `NEWYEAR2025` - 20% до 01.02.2025

---

## 💼 Использование для админа

### Открыть админ-панель

```
http://localhost:3000/admin/coupons
```

### Создать купон

1. Нажмите **"Создать купон"**
2. Заполните форму:
   - **Код**: `SUMMER2025` (уникальный)
   - **Описание**: "Летняя распродажа"
   - **Тип**: Фиксированная / Процент / Бесплатная доставка
   - **Сумма/Процент**: 20
   - **Минимальная сумма заказа**: 50
   - **Максимум использований**: 100
   - **Лимит на пользователя**: 1
   - **Срок действия**: до 31.08.2025
3. Нажмите **"Создать"**

### Типы купонов

**1. Фиксированная скидка (fixed)**
```
Код: WELCOME10
Сумма: €10
Минимум: €50
→ Скидка €10 при заказе от €50
```

**2. Процентная скидка (percentage)**
```
Код: SALE20
Процент: 20%
Макс. скидка: €50
Минимум: €30
→ Скидка 20% (максимум €50) при заказе от €30
```

**3. Бесплатная доставка (free_shipping)**
```
Код: FREESHIP
Минимум: €25
→ Бесплатная доставка при заказе от €25
```

---

## 🛒 Использование в checkout

### Добавить в форму checkout

```tsx
import CouponInput from '@/components/checkout/CouponInput';

export default function CheckoutPage() {
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState('');

  const handleCouponApplied = (discount: number, code: string, type: string) => {
    setCouponDiscount(discount);
    setCouponCode(code);
    setCouponType(type);
    
    // Если бесплатная доставка
    if (type === 'free_shipping') {
      setShippingCost(0);
    }
  };

  const handleCouponRemoved = () => {
    setCouponDiscount(0);
    setCouponCode('');
    setCouponType('');
  };

  return (
    <div>
      {/* Корзина */}
      <div>Товары: €{subtotal}</div>
      <div>Доставка: €{shippingCost}</div>
      
      {/* Купон */}
      <CouponInput
        orderAmount={subtotal}
        onCouponApplied={handleCouponApplied}
        onCouponRemoved={handleCouponRemoved}
      />
      
      {/* Итого */}
      {couponDiscount > 0 && (
        <div className="text-green-600">
          Скидка: -€{couponDiscount.toFixed(2)}
        </div>
      )}
      
      <div className="text-xl font-bold">
        Итого: €{(subtotal + shippingCost - couponDiscount).toFixed(2)}
      </div>
    </div>
  );
}
```

### При создании заказа

```tsx
const createOrder = async () => {
  const orderData = {
    // ... другие поля
    subtotal: subtotal,
    shipping: shippingCost,
    total: subtotal + shippingCost - couponDiscount,
    coupon_code: couponCode || null,
    coupon_discount: couponDiscount || 0,
  };

  const response = await fetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
};
```

---

## 🎨 Примеры купонов

### Приветственная скидка
```sql
INSERT INTO coupons (code, description, type, amount, min_order_amount, per_user_limit, is_active)
VALUES ('WELCOME10', 'Скидка €10 на первый заказ', 'fixed', 10.00, 50.00, 1, TRUE);
```

### Сезонная распродажа
```sql
INSERT INTO coupons (
    code, description, type, amount, min_order_amount, 
    max_discount_amount, max_uses, valid_until, is_active
)
VALUES (
    'SUMMER30', 
    'Летняя распродажа -30%', 
    'percentage', 
    30.00, 
    40.00,
    100.00,  -- Макс. скидка €100
    500,     -- Всего 500 использований
    '2025-08-31 23:59:59', 
    TRUE
);
```

### День рождения магазина
```sql
INSERT INTO coupons (
    code, description, type, amount, 
    valid_from, valid_until, is_active
)
VALUES (
    'BDAY2025', 
    'День рождения магазина -50%', 
    'percentage', 
    50.00,
    '2025-06-01 00:00:00',
    '2025-06-03 23:59:59',
    TRUE
);
```

### VIP купон
```sql
INSERT INTO coupons (
    code, description, type, amount, min_order_amount,
    max_uses, per_user_limit, is_active
)
VALUES (
    'VIP25', 
    'Эксклюзивная скидка для VIP', 
    'fixed', 
    25.00,
    100.00,  -- Только на заказы от €100
    20,      -- Всего 20 использований
    1,       -- 1 раз на человека
    TRUE
);
```

### Бесплатная доставка
```sql
INSERT INTO coupons (code, description, type, amount, min_order_amount, is_active)
VALUES ('FREESHIP25', 'Бесплатная доставка от €25', 'free_shipping', 0.00, 25.00, TRUE);
```

---

## 📊 API Endpoints

### Проверить купон (для клиента)

```typescript
POST /api/coupons/validate

Body:
{
  code: "SUMMER2025",
  orderAmount: 100.00
}

Response (успех):
{
  valid: true,
  couponId: "uuid",
  discountAmount: 20.00,
  couponType: "percentage"
}

Response (ошибка):
{
  valid: false,
  error: "Купон не найден"
}
```

### Список купонов (админ)

```typescript
GET /api/admin/coupons?page=1&limit=20

Response:
{
  coupons: Coupon[],
  pagination: {
    page: 1,
    limit: 20,
    total: 45,
    pages: 3
  }
}
```

### Создать купон (админ)

```typescript
POST /api/admin/coupons

Body:
{
  code: "SUMMER2025",
  description: "Летняя распродажа",
  type: "percentage",
  amount: 20,
  minOrderAmount: 50,
  maxDiscountAmount: 100,
  maxUses: 500,
  perUserLimit: 1,
  validFrom: "2025-06-01T00:00:00",
  validUntil: "2025-08-31T23:59:59",
  isActive: true
}

Response:
{
  id: "uuid",
  code: "SUMMER2025",
  ...
}
```

### Обновить купон (админ)

```typescript
PATCH /api/admin/coupons/:id

Body:
{
  isActive: false,  // Деактивировать купон
  maxUses: 1000     // Увеличить лимит
}
```

### Удалить купон (админ)

```typescript
DELETE /api/admin/coupons/:id

Response:
{
  success: true
}
```

---

## 🔍 Логика проверки купона

### Проверки при валидации:

1. ✅ Купон существует
2. ✅ Купон активен (`is_active = true`)
3. ✅ Дата начала действия наступила
4. ✅ Срок действия не истек
5. ✅ Не исчерпан общий лимит использований
6. ✅ Пользователь не превысил личный лимит
7. ✅ Сумма заказа >= минимальной

### Расчет скидки:

**Fixed:**
```
discount = amount
```

**Percentage:**
```
discount = orderAmount * (amount / 100)
if (discount > max_discount_amount) {
  discount = max_discount_amount
}
```

**Free Shipping:**
```
shipping_cost = 0
```

---

## 📈 Статистика использования

### SQL запросы

**Топ купонов:**
```sql
SELECT 
    code,
    description,
    uses_count,
    type,
    amount
FROM coupons
ORDER BY uses_count DESC
LIMIT 10;
```

**Общая статистика:**
```sql
SELECT 
    COUNT(*) as total_coupons,
    COUNT(CASE WHEN is_active THEN 1 END) as active_coupons,
    SUM(uses_count) as total_uses,
    SUM(CASE WHEN uses_count >= max_uses THEN 1 END) as exhausted_coupons
FROM coupons;
```

**История использования:**
```sql
SELECT 
    c.code,
    cu.discount_amount,
    cu.created_at,
    o.order_number,
    o.total
FROM coupon_usages cu
JOIN coupons c ON c.id = cu.coupon_id
JOIN orders o ON o.id = cu.order_id
ORDER BY cu.created_at DESC
LIMIT 50;
```

**Сумма скидок по купону:**
```sql
SELECT 
    c.code,
    c.description,
    COUNT(cu.id) as uses,
    SUM(cu.discount_amount) as total_discount
FROM coupons c
LEFT JOIN coupon_usages cu ON cu.coupon_id = c.id
GROUP BY c.id
ORDER BY total_discount DESC;
```

---

## 🎯 Маркетинговые кампании

### 1. Email-рассылка с купоном

```typescript
// Создать персональный купон для email-кампании
const createCampaignCoupon = async () => {
  const response = await fetch('/api/admin/coupons', {
    method: 'POST',
    body: JSON.stringify({
      code: 'EMAIL20',
      description: 'Специальное предложение для подписчиков',
      type: 'percentage',
      amount: 20,
      minOrderAmount: 30,
      maxUses: 1000,
      perUserLimit: 1,
      validUntil: '2025-12-31T23:59:59',
      isActive: true,
    }),
  });
};
```

### 2. Социальные сети

```
🎉 ЭКСКЛЮЗИВНАЯ СКИДКА 25%!

Используй промокод: INSTA25
Действует до 31 декабря

👉 Переходи по ссылке в bio
```

### 3. Брошенные корзины

```typescript
// Создать временный купон для возврата клиента
const code = `COMEBACK${userId.slice(0, 6).toUpperCase()}`;

await fetch('/api/admin/coupons', {
  method: 'POST',
  body: JSON.stringify({
    code,
    description: 'Специальная скидка на возврат',
    type: 'fixed',
    amount: 10,
    perUserLimit: 1,
    maxUses: 1,
    validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 часов
    isActive: true,
  }),
});

// Отправить email с персональным купоном
```

---

## ⚙️ Настройки

### Изменить логику проверки

Откройте `supabase/migrations/20250130_coupon_system.sql` и найдите функцию `validate_coupon`.

### Добавить условия по категориям

```sql
ALTER TABLE coupons ADD COLUMN allowed_categories TEXT[];

-- Проверка в функции
IF v_coupon.allowed_categories IS NOT NULL THEN
    -- Проверить, что в заказе есть товары из разрешенных категорий
END IF;
```

### Добавить минимальное количество товаров

```sql
ALTER TABLE coupons ADD COLUMN min_items_count INTEGER;
```

---

## 🐛 Troubleshooting

### Купон не применяется

1. Проверьте статус купона:
```sql
SELECT * FROM coupons WHERE code = 'YOUR_CODE';
```

2. Проверьте лимиты:
```sql
SELECT * FROM coupon_usages WHERE coupon_id = 'COUPON_ID';
```

3. Проверьте логи:
```sql
SELECT * FROM validate_coupon('YOUR_CODE', 'USER_ID', 100.00);
```

### Счетчик не увеличивается

Проверьте триггер:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_apply_coupon_to_order';
```

---

## ✅ Готово!

Система купонов полностью настроена:

✅ Админ-панель для управления
✅ Компонент для checkout
✅ API для валидации
✅ Автоматическое применение
✅ Статистика использования
✅ 4 тестовых купона

**Используйте тестовые купоны:**
- `WELCOME10` - скидка €10
- `SALE15` - скидка 15%
- `FREESHIP` - бесплатная доставка
- `NEWYEAR2025` - скидка 20%

**Дальше:**
1. Добавьте CouponInput в checkout
2. Создайте свои купоны в админке
3. Запустите маркетинговую кампанию!

Удачи! 🚀
