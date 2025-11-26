# Атомарное управление складом - Инструкция по установке

## Что изменилось

### Проблема
Два покупателя могли одновременно купить последний товар → оба получали подтверждение, но товар один.

### Решение
PostgreSQL транзакция с `FOR UPDATE` блокировкой строк:
```sql
BEGIN TRANSACTION;
SELECT ... FOR UPDATE; -- Блокирует строку
IF stock >= quantity THEN
    UPDATE stock = stock - quantity;
    INSERT INTO stock_logs;
    COMMIT;
ELSE
    ROLLBACK;
END IF;
```

## Установка

### Шаг 1: Применить миграцию базы данных

**Через Supabase Dashboard:**
1. Открыть https://app.supabase.com/project/YOUR_PROJECT/sql
2. Скопировать содержимое `supabase/migrations/add_atomic_stock_decrease.sql`
3. Вставить и выполнить SQL
4. Проверить что функция создана:
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name = 'decrease_stock_atomic';
   ```

**Через CLI:**
```bash
# В корне проекта
supabase db push

# Или вручную
psql $DATABASE_URL < supabase/migrations/add_atomic_stock_decrease.sql
```

### Шаг 2: Обновить код (уже готово)

Файл `lib/inventory/stock-manager.ts` уже обновлён для использования новой функции.

Изменения:
```typescript
// Было: checkAvailability + UPDATE с optimistic locking
// Стало: вызов PostgreSQL функции decrease_stock_atomic()

const { data, error } = await supabase.rpc('decrease_stock_atomic', {
    items: itemsJson,
    p_order_id: orderId,
    p_payment_id: paymentId,
});
```

### Шаг 3: Протестировать

**SQL тест:**
```bash
# Открыть Supabase SQL Editor
# Скопировать и выполнить supabase/test_race_condition.sql
```

**TypeScript тест:**
```bash
# Установить ts-node если нет
npm install -D ts-node

# Запустить тесты
npx ts-node test-race-condition.ts
```

Ожидаемый результат:
```
✅ Test 1 passed - Normal purchase
✅ Test 2 passed - Insufficient stock rejected
✅ Test 3 passed - Race condition prevented!
✅ Test 4 passed - Multiple items
✅ Test 5 passed - Stress test (10 buyers, 5 items)
```

### Шаг 4: Проверить в production

1. **Проверить функцию существует:**
   ```sql
   SELECT routine_name, routine_type 
   FROM information_schema.routines 
   WHERE routine_name = 'decrease_stock_atomic';
   ```

2. **Тестовая покупка:**
   - Создать товар с stock = 1
   - Попробовать купить через PayPal/Stripe
   - Проверить что stock = 0
   - Проверить логи в stock_logs

3. **Мониторинг:**
   ```sql
   -- Смотреть все операции со складом за последний час
   SELECT 
       sl.created_at,
       p.name,
       sl.event_type,
       sl.quantity_change,
       sl.stock_before,
       sl.stock_after
   FROM stock_logs sl
   JOIN products p ON p.id = sl.product_id
   WHERE sl.created_at > NOW() - INTERVAL '1 hour'
   ORDER BY sl.created_at DESC;
   ```

## Что делать при ошибках

### "function decrease_stock_atomic does not exist"
```sql
-- Проверить подключение к правильной БД
SELECT current_database();

-- Применить миграцию вручную
\i supabase/migrations/add_atomic_stock_decrease.sql
```

### "permission denied for function decrease_stock_atomic"
```sql
-- Дать права на выполнение функции
GRANT EXECUTE ON FUNCTION decrease_stock_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION decrease_stock_atomic TO service_role;
```

### Тесты падают с timeout
```typescript
// Увеличить timeout в test-race-condition.ts
const { data, error } = await supabase.rpc('decrease_stock_atomic', {
    // ...
}, {
    timeout: 10000, // 10 секунд
});
```

## Rollback (если что-то пошло не так)

### Вернуться к старой версии:

1. **Удалить функцию:**
   ```sql
   DROP FUNCTION IF EXISTS decrease_stock_atomic;
   ```

2. **Откатить код в git:**
   ```bash
   git revert HEAD
   ```

3. **Старая версия будет использовать optimistic locking:**
   ```typescript
   // Старый код - работает, но НЕ защищает от race condition
   await supabase
       .from('products')
       .update({ stock_quantity: stockAfter })
       .eq('id', item.productId)
       .gte('stock_quantity', item.quantity);
   ```

## Production Checklist

- [ ] Миграция применена в production БД
- [ ] Функция `decrease_stock_atomic` существует
- [ ] Права `GRANT EXECUTE` выданы
- [ ] SQL тесты пройдены успешно
- [ ] TypeScript тесты пройдены
- [ ] Тестовая покупка работает
- [ ] Мониторинг настроен (stock_logs, audit_logs)
- [ ] Команда знает как откатить изменения

## Документация

- **Подробное описание:** `RACE_CONDITION_PROTECTION.md`
- **SQL миграция:** `supabase/migrations/add_atomic_stock_decrease.sql`
- **SQL тесты:** `supabase/test_race_condition.sql`
- **TypeScript тесты:** `test-race-condition.ts`
- **Код:** `lib/inventory/stock-manager.ts`

## Поддержка

При возникновении проблем:
1. Проверить логи Supabase Functions
2. Проверить stock_logs таблицу
3. Проверить audit_logs таблицу
4. Проверить PostgreSQL логи
5. Открыть issue в репозитории
