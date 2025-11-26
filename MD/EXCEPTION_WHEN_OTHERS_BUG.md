# ⚠️ КРИТИЧЕСКАЯ ОШИБКА: EXCEPTION WHEN OTHERS ломает ROLLBACK

## Проблема

В первой версии функции `decrease_stock_atomic()` был блок `EXCEPTION WHEN OTHERS`, который **полностью ломал** механизм отката транзакции.

## Неправильная версия (с багом)

```sql
CREATE FUNCTION decrease_stock_atomic(...) RETURNS jsonb AS $$
BEGIN
    -- UPDATE products ...
    -- INSERT INTO stock_logs ...
    
    IF NOT success THEN
        RAISE EXCEPTION 'Insufficient stock';
    END IF;
    
    RETURN jsonb_build_object('success', true);
    
EXCEPTION
    WHEN OTHERS THEN
        -- ❌ ЛОВИМ ошибку - ROLLBACK НЕ происходит!
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
```

### Что реально происходит:

```
1. UPDATE products SET stock = 0 WHERE id = 'product-1'
   ✅ Выполнено

2. INSERT INTO stock_logs (...)
   ✅ Выполнено

3. RAISE EXCEPTION 'Insufficient stock'
   ⚠️ Ошибка возникла

4. EXCEPTION WHEN OTHERS блок ПЕРЕХВАТЫВАЕТ ошибку
   ❌ ROLLBACK НЕ ПРОИСХОДИТ!

5. RETURN jsonb_build_object('success', false, 'error', ...)
   ✅ Функция вернула { success: false }

6. Транзакция завершается БЕЗ отката
   ❌ UPDATE и INSERT ОСТАЛИСЬ в базе!
```

### Результат:

```
Покупатель A                    Покупатель B
BEGIN                           BEGIN
SELECT stock=1 FOR UPDATE       WAIT...
UPDATE stock=0 ✅               
INSERT log ✅                   
RAISE EXCEPTION                 
EXCEPTION catches it            
RETURN {success: false}         
COMMIT ❌ БЕЗ ROLLBACK!         SELECT stock=0 FOR UPDATE
                                RAISE EXCEPTION 'stock=0<1'
                                EXCEPTION catches it
                                RETURN {success: false}
                                COMMIT ❌

Результат: stock=0, но 0 заказов! 
UPDATE выполнился, но заказ не создан.
```

## Правильная версия (исправлено)

```sql
CREATE FUNCTION decrease_stock_atomic(...) RETURNS jsonb AS $$
BEGIN
    -- UPDATE products ...
    -- INSERT INTO stock_logs ...
    
    IF NOT success THEN
        RAISE EXCEPTION 'Insufficient stock'; -- Улетает наружу
    END IF;
    
    RETURN jsonb_build_object('success', true);
END;  -- ❌ НЕТ блока EXCEPTION WHEN OTHERS
$$;
```

### Что происходит теперь:

```
1. UPDATE products SET stock = 0 WHERE id = 'product-1'
   ✅ Выполнено

2. INSERT INTO stock_logs (...)
   ✅ Выполнено

3. RAISE EXCEPTION 'Insufficient stock'
   ⚠️ Ошибка возникла

4. НЕТ блока EXCEPTION - ошибка улетает наружу
   ✅ PostgreSQL делает АВТОМАТИЧЕСКИЙ ROLLBACK

5. Все UPDATE и INSERT отменяются
   ✅ База возвращается к состоянию до BEGIN

6. TypeScript получает error в supabase.rpc()
   ✅ { data: null, error: { message: 'Insufficient stock' } }
```

### Результат:

```
Покупатель A                    Покупатель B
BEGIN                           BEGIN
SELECT stock=1 FOR UPDATE       WAIT...
UPDATE stock=0 ✅               
INSERT log ✅                   
RAISE EXCEPTION                 
ROLLBACK автоматически ✅       SELECT stock=1 FOR UPDATE ✅
База откатилась:                UPDATE stock=0 ✅
  stock=1 (восстановлено)       INSERT log ✅
  log удален                    COMMIT ✅

Результат: stock=0, 1 заказ ✅
Покупатель B успешно купил товар.
```

## Почему EXCEPTION WHEN OTHERS не делает ROLLBACK

### PostgreSQL транзакции и подтранзакции

```sql
BEGIN;  -- Главная транзакция

    -- Код функции создаёт ПОДТРАНЗАКЦИЮ (savepoint)
    BEGIN
        UPDATE ...;
        INSERT ...;
        RAISE EXCEPTION 'Error';
    EXCEPTION
        WHEN OTHERS THEN
            -- Откатывается только ПОДТРАНЗАКЦИЯ
            -- Главная транзакция продолжается!
            RETURN jsonb_build_object('success', false);
    END;

COMMIT;  -- Коммитим главную транзакцию
         -- UPDATE и INSERT ДО блока EXCEPTION остались!
```

### Визуализация:

```
┌─────────────────────────────────┐
│  Главная транзакция (BEGIN)     │
│                                  │
│  UPDATE products ... ✅          │
│  INSERT logs ... ✅              │
│                                  │
│  ┌───────────────────────────┐  │
│  │  EXCEPTION блок            │  │
│  │  (создаёт savepoint)       │  │
│  │                            │  │
│  │  RAISE EXCEPTION           │  │
│  │  ↓                         │  │
│  │  ROLLBACK TO savepoint     │  │ ← Откат только savepoint
│  │  (только внутренний блок)  │  │
│  │                            │  │
│  │  RETURN {success: false}   │  │
│  └───────────────────────────┘  │
│                                  │
│  COMMIT (главная транзакция) ✅  │ ← UPDATE и INSERT остались!
└─────────────────────────────────┘
```

## Правильный подход

### Без EXCEPTION блока:

```
┌─────────────────────────────────┐
│  Главная транзакция (BEGIN)     │
│                                  │
│  UPDATE products ... ✅          │
│  INSERT logs ... ✅              │
│                                  │
│  RAISE EXCEPTION                 │
│  ↓                               │
│  ❌ Ошибка улетает наружу        │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│  PostgreSQL автоматически:       │
│  ROLLBACK (вся транзакция) ✅    │
│                                  │
│  UPDATE отменён ✅               │
│  INSERT отменён ✅               │
└─────────────────────────────────┘
```

## Как обрабатывать в коде

### TypeScript обработка

```typescript
// ❌ НЕПРАВИЛЬНО (со старой версией функции)
const { data, error } = await supabase.rpc('decrease_stock_atomic', ...);

// data = { success: false, error: 'Insufficient stock' }
// error = null
// БАГ: UPDATE остался в базе!

if (!data?.success) {
    console.log('Failed:', data.error);
    // Но UPDATE уже выполнился и не откатился
}

// ✅ ПРАВИЛЬНО (с исправленной версией)
const { data, error } = await supabase.rpc('decrease_stock_atomic', ...);

// data = null
// error = { message: 'Insufficient stock', ... }
// ✅ ROLLBACK произошёл автоматически

if (error) {
    console.log('Failed:', error.message);
    // UPDATE откатился, база в консистентном состоянии
}
```

## Когда использовать EXCEPTION WHEN OTHERS

### Используйте ТОЛЬКО если:

1. **Логирование ошибок (без изменения поведения):**
   ```sql
   EXCEPTION
       WHEN OTHERS THEN
           INSERT INTO error_logs (...);
           RAISE; -- Пробрасываем ошибку дальше!
   ```

2. **Преобразование ошибок:**
   ```sql
   EXCEPTION
       WHEN foreign_key_violation THEN
           RAISE EXCEPTION 'Related record not found';
   ```

3. **Cleanup ресурсов:**
   ```sql
   EXCEPTION
       WHEN OTHERS THEN
           PERFORM cleanup_temp_data();
           RAISE; -- Пробрасываем дальше!
   ```

### НЕ используйте если:

- ❌ Хотите просто вернуть `{ success: false }`
- ❌ Нужен автоматический ROLLBACK
- ❌ Не вызываете `RAISE` повторно

## Тестирование

### Проверка что ROLLBACK работает:

```sql
-- Тест 1: Проверить что UPDATE откатывается
BEGIN;
  UPDATE products SET stock_quantity = 999 WHERE id = 'test';
  SELECT decrease_stock_atomic('[{"productId":"test","quantity":1000}]'::jsonb, ...);
  -- Ожидаем ошибку
ROLLBACK;

-- Проверить что stock не изменился
SELECT stock_quantity FROM products WHERE id = 'test';
-- Должен быть оригинальное значение, не 999

-- Тест 2: Проверить что INSERT откатывается
SELECT COUNT(*) FROM stock_logs; -- Запомнить значение

SELECT decrease_stock_atomic('[{"productId":"test","quantity":1000}]'::jsonb, ...);
-- Ожидаем ошибку

SELECT COUNT(*) FROM stock_logs; -- Должно быть такое же значение
-- Если INSERT откатился - count не изменился ✅
```

## Исправления в коде

### 1. Миграция SQL:
```bash
# Файл: supabase/migrations/add_atomic_stock_decrease.sql
# Удалён блок EXCEPTION WHEN OTHERS
```

### 2. TypeScript:
```bash
# Файл: lib/inventory/stock-manager.ts
# Изменена проверка: if (error) вместо if (!data?.success)
```

### 3. Документация:
```bash
# Обновлены файлы:
# - RACE_CONDITION_PROTECTION.md
# - RACE_CONDITION_FIXED.md
# - ATOMIC_STOCK_INSTALLATION.md
```

## Итог

✅ **Правильно:**
```sql
BEGIN
    UPDATE ...;
    IF error THEN RAISE EXCEPTION; END IF;
    RETURN success;
END;  -- БЕЗ EXCEPTION WHEN OTHERS
```

❌ **Неправильно:**
```sql
BEGIN
    UPDATE ...;
    IF error THEN RAISE EXCEPTION; END IF;
    RETURN success;
EXCEPTION
    WHEN OTHERS THEN RETURN error;  -- Ломает ROLLBACK!
END;
```

**Золотое правило:** Если нужен автоматический ROLLBACK - НЕ используйте `EXCEPTION WHEN OTHERS` без повторного `RAISE`.
