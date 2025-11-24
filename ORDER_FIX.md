# Исправление создания заказов при отмене оплаты

## Проблема
Заказы создавались в базе данных ДО оплаты, что приводило к созданию заказов даже при отмене платежа пользователем.

## Решение
Изменена логика создания заказов - теперь заказ создаётся ТОЛЬКО после успешной оплаты через Stripe webhook.

## Изменённые файлы

### 1. `/app/api/checkout/route.ts`
**До:**
- Создавал заказ в БД
- Создавал order_items
- Создавал Stripe сессию с orderId в metadata
- При отмене заказ оставался в БД со статусом pending

**После:**
- Создаёт только Stripe сессию
- Все данные заказа передаются в metadata (items, customer, delivery)
- Заказ НЕ создаётся до подтверждения оплаты
- success_url теперь: `/order-success?session_id={CHECKOUT_SESSION_ID}`

### 2. `/app/api/webhooks/stripe/route.ts`
**До:**
- При `checkout.session.completed`: обновлял существующий заказ
- При `checkout.session.expired`: помечал заказ как cancelled
- При `payment_intent.payment_failed`: помечал заказ как failed

**После:**
- При `checkout.session.completed`: **создаёт новый заказ** из metadata
- Проверяет дублирование (защита от повторной обработки)
- Создаёт order_items
- Отправляет email подтверждения
- При expired/failed: ничего не делает (заказ не был создан)

### 3. `/app/order-success/page.tsx` (НОВЫЙ)
Новая страница успеха без динамического orderId:
- Получает `session_id` из query параметров
- Делает polling запросы к API для поиска заказа (макс 10 сек)
- Показывает loading состояние
- Обрабатывает случай, когда webhook ещё не обработан
- Wrapped в Suspense для SSR

### 4. `/app/api/orders/route.ts`
Добавлен GET метод:
```typescript
GET /api/orders?session_id={session_id}
```
- Находит заказ по stripe_session_id
- Возвращает данные заказа
- Используется страницей order-success для polling

## Поток работы (новый)

1. **Пользователь оформляет заказ:**
   - POST `/api/checkout`
   - Данные сохраняются в Stripe metadata
   - Возвращается URL для оплаты

2. **Пользователь оплачивает:**
   - Stripe перенаправляет на `/order-success?session_id=xxx`
   - Stripe вызывает webhook

3. **Webhook обрабатывает платёж:**
   - POST `/api/webhooks/stripe`
   - Event: `checkout.session.completed`
   - **Создаёт заказ в БД** из metadata
   - Создаёт order_items
   - Отправляет email

4. **Страница успеха:**
   - Делает polling GET `/api/orders?session_id=xxx`
   - Находит созданный заказ
   - Показывает детали

5. **Если пользователь отменяет:**
   - Stripe перенаправляет на `/checkout?canceled=1`
   - Webhook НЕ вызывается
   - Заказ НЕ создаётся ✅

## Преимущества

✅ Заказы создаются только при успешной оплате  
✅ Нет "мусорных" pending заказов  
✅ Защита от дублирования через session_id  
✅ Graceful handling задержек webhook (polling)  
✅ Лучший UX с loading состоянием  

## Тестирование

### 1. Успешная оплата
- Оформить заказ
- Оплатить тестовой картой: `4242 4242 4242 4242`
- Проверить, что заказ создан в БД
- Проверить email подтверждения

### 2. Отмена оплаты
- Оформить заказ
- Нажать "Назад" или "Отмена" в Stripe Checkout
- Проверить, что заказ НЕ создан в БД ✅

### 3. Webhook задержка
- Оформить заказ
- Оплатить
- Страница должна показать loading и дождаться создания заказа

## Миграция данных

Старые заказы с pending статусом и без payment_status можно пометить как cancelled:

```sql
UPDATE orders 
SET status = 'cancelled', 
    notes = 'Cancelled: payment not completed'
WHERE status = 'pending' 
  AND payment_status IS NULL
  AND created_at < NOW() - INTERVAL '1 day';
```

## Environment переменные

Убедитесь, что настроены:
- `STRIPE_SECRET_KEY` - для создания сессий
- `STRIPE_WEBHOOK_SECRET` - для верификации webhook
- `NEXT_PUBLIC_SITE_URL` - для redirect URLs

## Vercel настройки

Webhook URL в Stripe Dashboard:
```
https://your-domain.vercel.app/api/webhooks/stripe
```

События для подписки:
- `checkout.session.completed` ✅
- `charge.refunded` (опционально)
