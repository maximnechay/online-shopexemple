# Race Condition Protection - Атомарное управление складом

## Проблема

Когда два покупателя одновременно пытаются купить последний товар:

### ❌ БЕЗ защиты:
```
Товар на складе: 1 шт

Покупатель A                    Покупатель B
--------------                  --------------
SELECT stock = 1                SELECT stock = 1
Проверка: 1 >= 1 ✓             Проверка: 1 >= 1 ✓
UPDATE stock = 0                UPDATE stock = 0
Заказ подтвержден ✓            Заказ подтвержден ✓

Результат: 2 заказа, но товар только 1!
```

## Решение: PostgreSQL транзакция с блокировкой строк

### ✅ С защитой:
```sql
BEGIN TRANSACTION;

-- Блокируем строку товара (FOR UPDATE)
SELECT stock FROM products WHERE id = ? FOR UPDATE;

-- Проверяем наличие
IF stock >= quantity THEN
    UPDATE products SET stock = stock - quantity WHERE id = ?;
    INSERT INTO stock_logs ...;
    COMMIT;
ELSE
    ROLLBACK;
END IF;
```

### Как это работает:

```
Товар на складе: 1 шт

Покупатель A                           Покупатель B
--------------                         --------------
BEGIN TRANSACTION
SELECT ... FOR UPDATE                  BEGIN TRANSACTION
🔒 БЛОКИРУЕТ строку                     SELECT ... FOR UPDATE
stock = 1                               ⏳ ЖДЁТ разблокировки
Проверка: 1 >= 1 ✓
UPDATE stock = 0
INSERT log
COMMIT ✓
🔓 РАЗБЛОКИРУЕТ                         🔒 ПОЛУЧАЕТ блокировку
                                        stock = 0
                                        Проверка: 0 >= 1 ❌
                                        ROLLBACK
                                        Ошибка: "Insufficient stock"

Результат: 1 заказ подтвержден, 1 отклонен ✅
```

## Реализация

### 1. PostgreSQL функция (supabase/migrations/add_atomic_stock_decrease.sql)

```sql
CREATE OR REPLACE FUNCTION public.decrease_stock_atomic(
    items jsonb,
    p_order_id uuid,
    p_payment_id text
) RETURNS jsonb AS $$
DECLARE
    item jsonb;
    product_record record;
    stock_before int;
    failed_items text[] := ARRAY[]::text[];
    success boolean := true;
BEGIN
    -- Loop through each item
    FOR item IN SELECT * FROM jsonb_array_elements(items)
    LOOP
        -- 🔒 Блокируем строку товара
        SELECT id, name, stock_quantity INTO product_record
        FROM public.products
        WHERE id = (item->>'productId')::uuid
        FOR UPDATE;
        
        stock_before := product_record.stock_quantity;
        
        -- ✅ Проверяем наличие
        IF stock_before < (item->>'quantity')::int THEN
            failed_items := array_append(failed_items,
                format('%s: need %s, have %s', 
                    product_record.name, 
                    item->>'quantity',
                    stock_before));
            success := false;
            CONTINUE;
        END IF;
        
        -- ⚡ Уменьшаем склад
        UPDATE public.products
        SET stock_quantity = stock_quantity - (item->>'quantity')::int
        WHERE id = product_record.id;
        
        -- 📝 Логируем изменение
        INSERT INTO public.stock_logs (
            product_id, order_id, event_type,
            quantity_change, stock_before, stock_after,
            payment_id, notes
        ) VALUES (
            product_record.id, p_order_id, 'purchase',
            -(item->>'quantity')::int, stock_before,
            stock_before - (item->>'quantity')::int,
            p_payment_id, item->>'notes'
        );
    END LOOP;
    
    -- ❌ Если хоть один товар недоступен - RAISE EXCEPTION
    -- ВАЖНО: НЕТ блока EXCEPTION WHEN OTHERS
    -- Ошибка улетает наружу → PostgreSQL делает ROLLBACK всей транзакции
    IF NOT success THEN
        RAISE EXCEPTION 'Insufficient stock: %', 
            array_to_string(failed_items, '; ');
    END IF;
    
    -- ✅ Все товары доступны - возвращаем success
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
```

**КРИТИЧНО:** Нет блока `EXCEPTION WHEN OTHERS`!
- Если `RAISE EXCEPTION` - PostgreSQL откатывает ВСЮ транзакцию автоматически
- Все `UPDATE` и `INSERT` выше отменяются
- Ошибка прилетает в TypeScript через `error` объект

### 2. TypeScript обёртка (lib/inventory/stock-manager.ts)

```typescript
export async function decreaseStock(
    items: StockChange[],
    orderId: string,
    paymentId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = supabaseAdmin;

    const itemsJson = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        notes: item.notes || `Purchase for order`,
    }));

    // Вызываем PostgreSQL функцию - АТОМАРНАЯ ТРАНЗАКЦИЯ
    // Если RAISE EXCEPTION внутри - прилетает в error
    const { data, error } = await supabase.rpc('decrease_stock_atomic', {
        items: itemsJson,
        p_order_id: orderId,
        p_payment_id: paymentId,
    });

    // Ошибка от RAISE EXCEPTION прилетает сюда
    if (error) {
        return {
            success: false,
            error: error.message || 'Failed to decrease stock',
        };
    }

    return { success: true };
}
```

**Изменение логики:**
- Старая версия: проверяла `data.success` (неправильно из-за `EXCEPTION WHEN OTHERS`)
- Новая версия: проверяет только `error` (правильно - ошибка улетает наружу)

## Тестирование race condition

### Тест 1: Симуляция одновременных покупок

```typescript
// test-race-condition.ts
import { decreaseStock } from '@/lib/inventory/stock-manager';

async function testRaceCondition() {
    const productId = 'test-product-id';
    const orderId1 = 'order-1';
    const orderId2 = 'order-2';

    // Устанавливаем stock = 1
    await supabase
        .from('products')
        .update({ stock_quantity: 1 })
        .eq('id', productId);

    // Два покупателя одновременно пытаются купить
    const [result1, result2] = await Promise.all([
        decreaseStock(
            [{ productId, quantity: 1 }],
            orderId1,
            'payment-1'
        ),
        decreaseStock(
            [{ productId, quantity: 1 }],
            orderId2,
            'payment-2'
        ),
    ]);

    console.log('Result 1:', result1); // { success: true }
    console.log('Result 2:', result2); // { success: false, error: "Insufficient stock" }

    // Проверяем финальный stock
    const { data } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .single();

    console.log('Final stock:', data.stock_quantity); // 0 (не -1!)
}
```

### Тест 2: Проверка логов

```sql
-- Смотрим что произошло
SELECT 
    sl.*,
    p.name as product_name
FROM stock_logs sl
JOIN products p ON p.id = sl.product_id
ORDER BY sl.created_at DESC
LIMIT 10;

-- Должна быть только ОДНА запись 'purchase'
-- Вторая транзакция откатилась и ничего не залогировала
```

### Тест 3: Нагрузочное тестирование

```bash
# Apache Bench - 100 одновременных запросов на последний товар
ab -n 100 -c 10 -p order.json -T application/json \
   https://yoursite.com/api/checkout
```

Ожидаемый результат:
- 1 заказ успешно оплачен (stock = 0)
- 99 заказов получили ошибку "Insufficient stock"
- Никаких отрицательных значений stock

## Преимущества

### ✅ Полная атомарность
- Все товары в заказе обрабатываются в одной транзакции
- Если недоступен хотя бы один товар - откатывается весь заказ

### ✅ FOR UPDATE блокировка
- Второй запрос ЖДЁТ, пока первый не закончит транзакцию
- Невозможно прочитать "устаревший" stock

### ✅ Автоматический ROLLBACK
- При любой ошибке транзакция откатывается
- База остаётся в консистентном состоянии

### ✅ Логирование внутри транзакции
- stock_logs создаются только при успешном UPDATE
- Полный audit trail без "мусорных" записей

## Сравнение подходов

| Подход | Race Condition | Атомарность | Rollback | Производительность |
|--------|---------------|-------------|----------|-------------------|
| **Без защиты** | ❌ Возможен | ❌ Нет | ❌ Нет | ⚡⚡⚡ Быстро |
| **Optimistic locking** | ⚠️ Частично | ⚠️ Retry нужен | ⚠️ Ручной | ⚡⚡ Средне |
| **Application-level transaction** | ⚠️ Частично | ⚠️ Сложно | ⚠️ Ручной | ⚡ Медленно |
| **PostgreSQL FOR UPDATE** | ✅ Защищено | ✅ Полная | ✅ Авто | ⚡⚡ Хорошо |
| **FOR UPDATE + EXCEPTION WHEN OTHERS** | ⚠️ Ломает ROLLBACK! | ❌ НЕТ! | ❌ НЕТ! | ⚡⚡ Но бесполезно |

## ⚠️ КРИТИЧНО: Почему EXCEPTION WHEN OTHERS ломает всё

### Проблема с EXCEPTION WHEN OTHERS

```sql
-- ❌ НЕПРАВИЛЬНО - ROLLBACK не работает!
CREATE FUNCTION bad_function() RETURNS jsonb AS $$
BEGIN
    UPDATE products SET stock = stock - 1;
    INSERT INTO logs ...;
    
    IF problem THEN
        RAISE EXCEPTION 'Error!';
    END IF;
    
    RETURN jsonb_build_object('success', true);
EXCEPTION
    WHEN OTHERS THEN
        -- Ловим ошибку → ROLLBACK НЕ происходит!
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;
```

**Что происходит:**
1. `UPDATE products` выполнился
2. `INSERT INTO logs` выполнился
3. `RAISE EXCEPTION` возникла
4. `EXCEPTION WHEN OTHERS` **ПЕРЕХВАТИЛ** ошибку
5. Функция вернула `{ success: false }` **БЕЗ ROLLBACK**
6. ❌ UPDATE и INSERT **ОСТАЛИСЬ** в базе!

### Правильный подход - БЕЗ EXCEPTION WHEN OTHERS

```sql
-- ✅ ПРАВИЛЬНО - ROLLBACK работает!
CREATE FUNCTION good_function() RETURNS jsonb AS $$
BEGIN
    UPDATE products SET stock = stock - 1;
    INSERT INTO logs ...;
    
    IF problem THEN
        RAISE EXCEPTION 'Error!'; -- Улетает наружу
    END IF;
    
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
```

**Что происходит:**
1. `UPDATE products` выполнился
2. `INSERT INTO logs` выполнился
3. `RAISE EXCEPTION` возникла
4. **НЕТ** блока EXCEPTION - ошибка улетает наружу
5. PostgreSQL делает **АВТОМАТИЧЕСКИЙ ROLLBACK**
6. ✅ UPDATE и INSERT **ОТМЕНЕНЫ**!
7. TypeScript получает `error` в `supabase.rpc()`

### Как обрабатывать в TypeScript

```typescript
// ❌ СТАРАЯ версия (неправильная)
const { data, error } = await supabase.rpc('decrease_stock_atomic', ...);
if (!data?.success) {  // Проверяем data.success
    return { success: false, error: data?.error };
}

// ✅ НОВАЯ версия (правильная)
const { data, error } = await supabase.rpc('decrease_stock_atomic', ...);
if (error) {  // Проверяем error напрямую
    return { success: false, error: error.message };
}
```

## Миграция

```bash
# 1. Создать PostgreSQL функцию
supabase db push

# 2. Или применить миграцию вручную
psql $DATABASE_URL < supabase/migrations/add_atomic_stock_decrease.sql

# 3. Протестировать функцию
SELECT decrease_stock_atomic(
    '[{"productId": "xxx", "quantity": 1}]'::jsonb,
    'order-id'::uuid,
    'payment-id'
);

# 4. Обновить код - уже готово в stock-manager.ts
```

## Troubleshooting

### Проблема: "function decrease_stock_atomic does not exist"
```sql
-- Проверить существует ли функция
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'decrease_stock_atomic';

-- Создать функцию
\i supabase/migrations/add_atomic_stock_decrease.sql
```

### Проблема: Deadlock detected
```sql
-- Проверить активные блокировки
SELECT * FROM pg_locks WHERE NOT granted;

-- Посмотреть ожидающие транзакции
SELECT * FROM pg_stat_activity WHERE wait_event_type = 'Lock';

-- Решение: PostgreSQL автоматически откатит одну из транзакций
-- Клиент получит ошибку и может повторить запрос
```

### Проблема: Timeout на checkout
```typescript
// Увеличить timeout для Supabase RPC
const { data, error } = await supabase.rpc('decrease_stock_atomic', {
    items: itemsJson,
    p_order_id: orderId,
    p_payment_id: paymentId,
}, {
    head: false,
    count: null,
    timeout: 10000, // 10 секунд
});
```

## Best Practices

1. **Используйте короткие транзакции**
   - Блокировка FOR UPDATE держится до COMMIT
   - Чем короче транзакция, тем меньше блокировок

2. **Проверяйте stock ДО оплаты**
   - Вызывайте `checkAvailability()` перед redirect на оплату
   - Уменьшайте вероятность неудачной оплаты

3. **Обрабатывайте ошибки gracefully**
   - При недостатке stock - показывайте user-friendly сообщение
   - Предлагайте альтернативные товары

4. **Мониторинг**
   ```sql
   -- Смотреть частоту ошибок недостатка stock
   SELECT 
       DATE_TRUNC('hour', created_at) as hour,
       COUNT(*) as failed_orders
   FROM audit_logs
   WHERE action = 'payment.completed'
   AND metadata->>'error' = 'insufficient_stock'
   GROUP BY hour
   ORDER BY hour DESC;
   ```

## Итог

✅ **Полная защита от race condition**
- PostgreSQL транзакция с FOR UPDATE
- Атомарная проверка и обновление
- Автоматический rollback при ошибках

✅ **Production-ready**
- Протестировано на нагрузку
- Полное логирование
- Graceful error handling
