# Admin Stock Management - Контролируемое изменение склада

## Принцип

**Никогда не делайте прямой `UPDATE products SET stock_quantity = X`!**

Все изменения склада должны идти через контролируемные функции:
1. ✅ **Покупка** - через `decrease_stock_atomic()` при оплате
2. ✅ **Возврат** - через `increaseStock()` при refund
3. ✅ **Ручная корректировка** - через `adjust_stock_manual()` для админа

## Почему это важно

### ❌ Плохо (прямой UPDATE):
```sql
-- Админ делает прямой UPDATE
UPDATE products SET stock_quantity = 50 WHERE id = 'product-123';
```

**Проблемы:**
- 🚫 Нет лога кто и зачем изменил
- 🚫 Нет проверки на отрицательные значения
- 🚫 Race condition с покупками
- 🚫 Невозможно отследить историю изменений

### ✅ Хорошо (через функцию):
```sql
-- Админ использует контролируемую функцию
SELECT adjust_stock_manual(
    'product-123',           -- product_id
    +50,                     -- относительное изменение
    'Поступление со склада', -- причина
    'admin-user-id'         -- кто изменил
);
```

**Преимущества:**
- ✅ FOR UPDATE блокировка (нет race condition)
- ✅ Проверка на отрицательные значения
- ✅ Автоматический лог в stock_logs с причиной и админом
- ✅ Полная история всех изменений
- ✅ Аудит действий администратора

## Подход: Относительные изменения (+N / -N)

Админ НЕ устанавливает абсолютное значение, а указывает **на сколько** изменить:

```typescript
// ✅ Правильно - относительные изменения
await adjustStock(productId, +10, "Поступление со склада", adminId);
await adjustStock(productId, -3, "Брак при проверке", adminId);
await adjustStock(productId, +50, "Инвентаризация: добавлено", adminId);

// ❌ Неправильно - абсолютные значения (deprecated)
await setStockAbsolute(productId, 100, "Установил на 100");
```

**Почему относительные изменения лучше:**
- Видно ЧТО изменилось, не только финальное значение
- Легче отследить историю ("+10", "-3", "+50")
- Меньше вероятность ошибки (не перепутаешь с текущим значением)
- Логичная семантика для audit trail

## PostgreSQL функция

```sql
CREATE FUNCTION public.adjust_stock_manual(
    p_product_id uuid,
    p_quantity_change int,  -- +10 или -5
    p_reason text,
    p_admin_user_id uuid
) RETURNS jsonb AS $$
DECLARE
    product_record record;
    stock_before int;
    stock_after int;
BEGIN
    -- 🔒 Блокируем строку товара
    SELECT id, name, stock_quantity INTO product_record
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product % not found', p_product_id;
    END IF;
    
    stock_before := product_record.stock_quantity;
    stock_after := stock_before + p_quantity_change;
    
    -- ✅ Проверяем что склад не уйдёт в минус
    IF stock_after < 0 THEN
        RAISE EXCEPTION 'Cannot adjust stock: result would be negative (% + % = %)',
            stock_before, p_quantity_change, stock_after;
    END IF;
    
    -- ⚡ Обновляем склад
    UPDATE public.products
    SET stock_quantity = stock_after
    WHERE id = p_product_id;
    
    -- 📝 Логируем изменение
    INSERT INTO public.stock_logs (
        product_id,
        order_id,
        event_type,
        quantity_change,
        stock_before,
        stock_after,
        payment_id,
        notes
    ) VALUES (
        p_product_id,
        '00000000-0000-0000-0000-000000000000',
        'manual_adjust',
        p_quantity_change,
        stock_before,
        stock_after,
        NULL,
        format('Admin adjustment by user %s: %s', p_admin_user_id, p_reason)
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'product_id', p_product_id,
        'product_name', product_record.name,
        'stock_before', stock_before,
        'stock_after', stock_after,
        'quantity_change', p_quantity_change
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
```

## TypeScript API

### Функция в stock-manager.ts

```typescript
/**
 * Manual stock adjustment (for admin use)
 * 
 * @param productId - Product UUID
 * @param quantityChange - Positive for increase (+10), negative for decrease (-5)
 * @param reason - Human-readable reason (required)
 * @param adminUserId - Admin user ID
 */
export async function adjustStock(
    productId: string,
    quantityChange: number,
    reason: string,
    adminUserId: string
): Promise<{ success: boolean; error?: string; result?: any }> {
    const { data, error } = await supabase.rpc('adjust_stock_manual', {
        p_product_id: productId,
        p_quantity_change: quantityChange,
        p_reason: reason,
        p_admin_user_id: adminUserId,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, result: data };
}
```

### REST API Endpoint

```
POST /api/admin/products/[productId]/adjust-stock
Authorization: Bearer <admin_token>

{
  "quantityChange": +10,  // или -5
  "reason": "Поступление со склада"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "product_id": "uuid",
    "product_name": "Product Name",
    "stock_before": 5,
    "stock_after": 15,
    "quantity_change": 10
  }
}
```

## Примеры использования

### Пример 1: Поступление товара

```typescript
// Пришла новая партия товара
const result = await adjustStock(
    productId,
    +50,  // Добавили 50 единиц
    "Поступление со склада: партия #12345",
    adminUserId
);

// Результат в stock_logs:
// event_type: 'manual_adjust'
// quantity_change: +50
// stock_before: 10
// stock_after: 60
// notes: "Admin adjustment by user xxx: Поступление со склада..."
```

### Пример 2: Списание брака

```typescript
// Обнаружили брак при проверке
const result = await adjustStock(
    productId,
    -3,  // Списали 3 единицы
    "Брак при проверке качества",
    adminUserId
);

// Результат в stock_logs:
// event_type: 'manual_adjust'
// quantity_change: -3
// stock_before: 60
// stock_after: 57
```

### Пример 3: Инвентаризация

```typescript
// После инвентаризации обнаружили несоответствие
const currentStock = 57;  // В системе
const actualStock = 55;   // По факту

const difference = actualStock - currentStock;  // -2

const result = await adjustStock(
    productId,
    difference,  // -2
    "Инвентаризация: недостача 2 единицы",
    adminUserId
);
```

### Пример 4: Попытка уйти в минус (ошибка)

```typescript
// Текущий stock = 5, пытаемся списать 10
const result = await adjustStock(
    productId,
    -10,
    "Попытка списания",
    adminUserId
);

// result.success = false
// result.error = "Cannot adjust stock: result would be negative (5 + -10 = -5)"
```

## Проверка прав доступа

Endpoint автоматически проверяет:

1. ✅ Пользователь авторизован
2. ✅ У пользователя роль `admin`
3. ✅ `quantityChange` - число
4. ✅ `reason` - не пустая строка (обязательно!)
5. ✅ `reason` - не длиннее 500 символов

```typescript
// В API endpoint
const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

if (profile?.role !== 'admin') {
    return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
    );
}
```

## Audit Trail

Каждое изменение логируется в **две** таблицы:

### 1. stock_logs (специфично для склада)
```sql
SELECT 
    sl.*,
    p.name as product_name
FROM stock_logs sl
JOIN products p ON p.id = sl.product_id
WHERE sl.event_type = 'manual_adjust'
ORDER BY sl.created_at DESC;
```

### 2. audit_logs (общий аудит действий админа)
```sql
SELECT 
    al.*,
    u.email as admin_email
FROM audit_logs al
JOIN auth.users u ON u.id = al.user_id
WHERE al.action = 'product.update'
AND al.metadata->>'operation' = 'stock_adjusted'
ORDER BY al.created_at DESC;
```

## Frontend компонент (пример)

```tsx
// app/admin/products/[productId]/StockAdjustmentForm.tsx
'use client';

import { useState } from 'react';

export function StockAdjustmentForm({ 
    productId, 
    currentStock 
}: { 
    productId: string; 
    currentStock: number;
}) {
    const [quantityChange, setQuantityChange] = useState<number>(0);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(
                `/api/admin/products/${productId}/adjust-stock`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ quantityChange, reason }),
                }
            );

            const data = await response.json();

            if (data.success) {
                alert(`Склад обновлён: ${data.data.stock_before} → ${data.data.stock_after}`);
                setQuantityChange(0);
                setReason('');
            } else {
                alert(`Ошибка: ${data.error}`);
            }
        } catch (error) {
            console.error(error);
            alert('Ошибка при обновлении склада');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label>Текущий запас: {currentStock}</label>
            </div>

            <div>
                <label htmlFor="quantityChange">
                    Изменение количества
                </label>
                <input
                    type="number"
                    id="quantityChange"
                    value={quantityChange}
                    onChange={(e) => setQuantityChange(Number(e.target.value))}
                    placeholder="+10 для добавления, -5 для списания"
                    required
                />
                <p className="text-sm text-gray-500">
                    Новое значение: {currentStock + quantityChange}
                </p>
            </div>

            <div>
                <label htmlFor="reason">
                    Причина (обязательно)
                </label>
                <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Например: Поступление со склада, Брак при проверке"
                    required
                    maxLength={500}
                />
            </div>

            <button 
                type="submit" 
                disabled={loading || !reason.trim()}
            >
                {loading ? 'Обновление...' : 'Обновить склад'}
            </button>
        </form>
    );
}
```

## Мониторинг

### Просмотр всех ручных изменений

```sql
SELECT 
    sl.created_at,
    p.name as product_name,
    sl.quantity_change,
    sl.stock_before,
    sl.stock_after,
    sl.notes
FROM stock_logs sl
JOIN products p ON p.id = sl.product_id
WHERE sl.event_type = 'manual_adjust'
ORDER BY sl.created_at DESC
LIMIT 50;
```

### Статистика изменений по админам

```sql
SELECT 
    SUBSTRING(sl.notes FROM 'user ([a-f0-9-]+)') as admin_id,
    COUNT(*) as adjustments_count,
    SUM(CASE WHEN sl.quantity_change > 0 THEN sl.quantity_change ELSE 0 END) as total_added,
    SUM(CASE WHEN sl.quantity_change < 0 THEN ABS(sl.quantity_change) ELSE 0 END) as total_removed
FROM stock_logs sl
WHERE sl.event_type = 'manual_adjust'
GROUP BY admin_id
ORDER BY adjustments_count DESC;
```

## Миграция существующего кода

Если у вас есть старый код с прямыми UPDATE:

```typescript
// ❌ Старый код (УДАЛИТЬ)
await supabase
    .from('products')
    .update({ stock_quantity: 100 })
    .eq('id', productId);

// ✅ Новый код
const currentStock = ...; // Получить текущий
const newStock = 100;
const change = newStock - currentStock;

await adjustStock(
    productId,
    change,
    "Ручная установка значения",
    adminUserId
);
```

## Чеклист для Production

- [ ] Миграция применена: `adjust_stock_manual` функция создана
- [ ] API endpoint создан: `/api/admin/products/[productId]/adjust-stock`
- [ ] Проверка прав администратора работает
- [ ] Frontend форма для админов создана
- [ ] Все старые прямые UPDATE заменены на `adjustStock()`
- [ ] Мониторинг stock_logs настроен
- [ ] Документация обновлена для команды

## Итог

✅ **Всегда используйте контролируемые функции для изменения склада**
✅ **Относительные изменения (+N / -N) вместо абсолютных значений**
✅ **Обязательная причина для каждого изменения**
✅ **Полный audit trail всех действий админа**
✅ **Защита от отрицательных значений и race condition**
