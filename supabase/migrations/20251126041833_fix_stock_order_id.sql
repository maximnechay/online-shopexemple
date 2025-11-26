-- Обновляем функцию adjust_stock_manual
-- order_id теперь NULL для ручных корректировок админа

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
