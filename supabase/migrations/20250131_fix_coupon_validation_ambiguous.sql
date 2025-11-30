-- Fix ambiguous column reference in validate_coupon function
-- Explicitly qualify table columns to avoid conflicts with record fields

CREATE OR REPLACE FUNCTION validate_coupon(
    p_code VARCHAR(50),
    p_user_id UUID DEFAULT NULL,
    p_order_amount DECIMAL(10, 2) DEFAULT 0.00
)
RETURNS TABLE (
    is_valid BOOLEAN,
    error_message TEXT,
    coupon_id UUID,
    discount_amount DECIMAL(10, 2),
    coupon_type VARCHAR(20)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_coupon RECORD;
    v_user_uses INTEGER;
    v_calculated_discount DECIMAL(10, 2);
BEGIN
    -- Получаем купон
    SELECT * INTO v_coupon
    FROM coupons
    WHERE code = UPPER(p_code)
    LIMIT 1;

    -- Проверка 1: Купон существует
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Купон не найден'::TEXT, NULL::UUID, 0.00::DECIMAL, NULL::VARCHAR;
        RETURN;
    END IF;

    -- Проверка 2: Купон активен
    IF NOT v_coupon.is_active THEN
        RETURN QUERY SELECT FALSE, 'Купон неактивен'::TEXT, NULL::UUID, 0.00::DECIMAL, NULL::VARCHAR;
        RETURN;
    END IF;

    -- Проверка 3: Дата начала действия
    IF v_coupon.valid_from > NOW() THEN
        RETURN QUERY SELECT FALSE, 'Купон еще не активирован'::TEXT, NULL::UUID, 0.00::DECIMAL, NULL::VARCHAR;
        RETURN;
    END IF;

    -- Проверка 4: Дата окончания
    IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < NOW() THEN
        RETURN QUERY SELECT FALSE, 'Срок действия купона истек'::TEXT, NULL::UUID, 0.00::DECIMAL, NULL::VARCHAR;
        RETURN;
    END IF;

    -- Проверка 5: Общий лимит использований
    IF v_coupon.max_uses IS NOT NULL AND v_coupon.uses_count >= v_coupon.max_uses THEN
        RETURN QUERY SELECT FALSE, 'Купон исчерпан'::TEXT, NULL::UUID, 0.00::DECIMAL, NULL::VARCHAR;
        RETURN;
    END IF;

    -- Проверка 6: Лимит на пользователя
    -- FIX: Explicitly qualify coupon_id with table name to avoid ambiguity
    IF p_user_id IS NOT NULL AND v_coupon.per_user_limit IS NOT NULL THEN
        SELECT COUNT(*) INTO v_user_uses
        FROM coupon_usages cu
        WHERE cu.coupon_id = v_coupon.id
          AND cu.user_id = p_user_id;

        IF v_user_uses >= v_coupon.per_user_limit THEN
            RETURN QUERY SELECT FALSE, 'Вы уже использовали этот купон максимальное количество раз'::TEXT, NULL::UUID, 0.00::DECIMAL, NULL::VARCHAR;
            RETURN;
        END IF;
    END IF;

    -- Проверка 7: Минимальная сумма заказа
    IF p_order_amount < v_coupon.min_order_amount THEN
        RETURN QUERY SELECT 
            FALSE, 
            'Минимальная сумма заказа для этого купона: €' || v_coupon.min_order_amount::TEXT,
            NULL::UUID, 
            0.00::DECIMAL, 
            NULL::VARCHAR;
        RETURN;
    END IF;

    -- Расчет скидки
    IF v_coupon.type = 'fixed' THEN
        v_calculated_discount := v_coupon.amount;
    ELSIF v_coupon.type = 'percentage' THEN
        v_calculated_discount := p_order_amount * (v_coupon.amount / 100);
        -- Применяем максимальную скидку если указана
        IF v_coupon.max_discount_amount IS NOT NULL AND v_calculated_discount > v_coupon.max_discount_amount THEN
            v_calculated_discount := v_coupon.max_discount_amount;
        END IF;
    ELSIF v_coupon.type = 'free_shipping' THEN
        v_calculated_discount := 0.00;
    ELSE
        v_calculated_discount := 0.00;
    END IF;

    -- Все проверки пройдены
    RETURN QUERY SELECT 
        TRUE,
        NULL::TEXT,
        v_coupon.id,
        v_calculated_discount,
        v_coupon.type::VARCHAR;
END;
$$;
