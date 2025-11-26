-- Migration: Add atomic stock decrease function with transaction
-- This prevents race condition when two customers buy the last item

-- Create PostgreSQL function for atomic stock decrease
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
        -- 🔒 Get current stock and lock the row FOR UPDATE
        -- This prevents concurrent updates to the same product
        SELECT id, name, stock_quantity INTO product_record
        FROM public.products
        WHERE id = (item->>'productId')::uuid
        FOR UPDATE;
        
        IF NOT FOUND THEN
            failed_items := array_append(failed_items, 
                format('Product %s not found', item->>'productId'));
            success := false;
            CONTINUE;
        END IF;
        
        stock_before := product_record.stock_quantity;
        
        -- ✅ Check if enough stock available
        IF stock_before < (item->>'quantity')::int THEN
            failed_items := array_append(failed_items,
                format('%s: need %s, have %s', 
                    product_record.name, 
                    item->>'quantity',
                    stock_before));
            success := false;
            CONTINUE;
        END IF;
        
        -- ⚡ Update stock atomically
        UPDATE public.products
        SET stock_quantity = stock_quantity - (item->>'quantity')::int
        WHERE id = product_record.id;
        
        -- 📝 Log stock change
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
            product_record.id,
            p_order_id,
            'purchase',
            -(item->>'quantity')::int,
            stock_before,
            stock_before - (item->>'quantity')::int,
            p_payment_id,
            item->>'notes'
        );
    END LOOP;
    
    -- ❌ Если хоть один товар недоступен - RAISE EXCEPTION
    -- Это откатит ВСЮ транзакцию (все UPDATE и INSERT выше)
    -- НЕТ блока EXCEPTION WHEN OTHERS - ошибка улетает наружу
    IF NOT success THEN
        RAISE EXCEPTION 'Insufficient stock: %', array_to_string(failed_items, '; ');
    END IF;
    
    -- ✅ Все товары доступны - возвращаем success
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION decrease_stock_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION decrease_stock_atomic TO service_role;

COMMENT ON FUNCTION decrease_stock_atomic IS 
'Atomically decrease stock for multiple items in a transaction. 
Uses row-level locking (FOR UPDATE) to prevent race conditions.
If any item has insufficient stock, entire transaction rolls back.';

-- ========================================
-- Admin manual stock adjustment function
-- ========================================

CREATE OR REPLACE FUNCTION public.adjust_stock_manual(
    p_product_id uuid,
    p_quantity_change int,  -- Может быть положительным (+10) или отрицательным (-5)
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
    
    -- 📝 Логируем изменение (order_id = NULL для ручных корректировок)
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
        NULL,  -- NULL для ручных изменений админом (нет связанного заказа)
        'manual_adjust',
        p_quantity_change,
        stock_before,
        stock_after,
        NULL,
        format('Admin adjustment by user %s: %s', p_admin_user_id, p_reason)
    );
    
    -- ✅ Возвращаем результат
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION adjust_stock_manual TO authenticated;
GRANT EXECUTE ON FUNCTION adjust_stock_manual TO service_role;

COMMENT ON FUNCTION adjust_stock_manual IS 
'Admin function to manually adjust stock levels.
Uses relative changes (+N or -N) instead of absolute values.
Prevents negative stock and logs all changes with admin user ID and reason.
Example: adjust_stock_manual(product_id, +10, ''Поступление со склада'', admin_id)';
