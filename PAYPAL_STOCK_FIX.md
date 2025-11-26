# PayPal Stock Management Fix

## Проблема
PayPal платежи не уменьшали количество товара на складе, в то время как наличные платежи (через админку) работали корректно.

## Причина
Endpoint `/api/paypal/capture-order` напрямую обновлял статус заказа на `completed` без интеграции с системой управления складом. Только webhook обработчик имел интеграцию со складом, но он может приходить с задержкой.

## Решение
Обновлен `/app/api/paypal/capture-order/route.ts` с полной интеграцией управления складом:

### Изменения:
1. **Добавлены импорты:**
   ```typescript
   import { decreaseStock } from '@/lib/inventory/stock-manager';
   import { createAuditLog } from '@/lib/security/audit-log';
   ```

2. **Получение заказа с items:**
   ```typescript
   const { data: existingOrder } = await supabaseAdmin
       .from('orders')
       .select('*, order_items(product_id, quantity)')
       .eq('id', supabaseOrderId)
       .single();
   ```

3. **Проверка идемпотентности:**
   ```typescript
   if (existingOrder.payment_status === 'paid' || existingOrder.payment_status === 'completed') {
       console.log('⚠️ Order already paid, skipping stock decrease');
       return NextResponse.json({ status: 'already_processed' });
   }
   ```

4. **Уменьшение склада:**
   ```typescript
   const stockItems = existingOrder.order_items.map(item => ({
       productId: item.product_id,
       quantity: item.quantity,
       notes: `PayPal payment captured for order ${existingOrder.order_number}`,
   }));

   const stockResult = await decreaseStock(
       stockItems,
       existingOrder.id,
       paymentId
   );
   ```

5. **Обработка недостатка товара:**
   ```typescript
   if (!stockResult.success) {
       // Платёж прошёл, но товара нет - требует ручной обработки
       await supabaseAdmin
           .from('orders')
           .update({
               status: 'pending', // Для ручной обработки
               notes: `ВНИМАНИЕ: Недостаточно товара! ${stockResult.error}`,
           })
           .eq('id', existingOrder.id);
       
       return NextResponse.json(
           { error: 'Insufficient stock', requiresManualReview: true },
           { status: 400 }
       );
   }
   ```

6. **Обновление статуса:**
   ```typescript
   await supabaseAdmin
       .from('orders')
       .update({
           payment_status: 'paid',    // Было 'completed'
           payment_id: paymentId,     // Добавлено для идемпотентности
           status: 'processing',
       })
       .eq('id', supabaseOrderId);
   ```

7. **Audit логирование:**
   ```typescript
   await createAuditLog({
       action: 'payment.completed',
       resourceType: 'order',
       resourceId: order.id,
       metadata: {
           provider: 'paypal',
           paymentId,
           amount: captureData.purchase_units[0]?.amount?.value,
           stockDecreased: true,
       },
   });
   ```

## Архитектура PayPal платежей

### Два пути обработки:
1. **Прямой захват (Frontend → capture-order API):**
   - Пользователь завершает оплату в PayPal
   - Frontend вызывает `/api/paypal/capture-order`
   - ✅ Теперь уменьшает склад
   - Обновляет заказ на `paid`

2. **Webhook (PayPal → webhook API):**
   - PayPal отправляет webhook `PAYMENT.CAPTURE.COMPLETED`
   - `/api/webhooks/paypal` обрабатывает событие
   - ✅ Также уменьшает склад (с защитой от дублирования через payment_id)

### Защита от дублирования:
- `payment_id` в базе данных - UNIQUE constraint
- Проверка `payment_status` перед уменьшением склада
- Идемпотентные операции в `decreaseStock()`
- Если заказ уже оплачен - пропускаем обработку

## Результат
Теперь все три метода оплаты работают одинаково:

| Метод оплаты | Точка уменьшения склада | Статус |
|--------------|------------------------|--------|
| **Наличные** | Admin confirms payment | ✅ Работает |
| **Stripe** | checkout.session.completed webhook | ✅ Работает |
| **PayPal** | capture-order API + webhook backup | ✅ ИСПРАВЛЕНО |

## Тестирование
```sql
-- 1. Проверить текущий склад
SELECT id, name, stock_quantity FROM products WHERE id = '<product_id>';

-- 2. Сделать покупку через PayPal

-- 3. Проверить, что склад уменьшился
SELECT id, name, stock_quantity FROM products WHERE id = '<product_id>';

-- 4. Проверить stock_logs
SELECT * FROM stock_logs 
WHERE order_id = '<order_id>' 
ORDER BY created_at DESC;

-- 5. Проверить audit_logs
SELECT * FROM audit_logs 
WHERE resource_type = 'order' 
AND resource_id = '<order_id>'
ORDER BY created_at DESC;
```

## Следующие шаги
- ✅ PayPal stock management - **ГОТОВО**
- ⏳ Frontend validation (показывать "Нет в наличии")
- ⏳ Checkout final stock check
- ⏳ Product page stock status display
