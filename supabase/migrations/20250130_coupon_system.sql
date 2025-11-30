-- Migration: Coupon System
-- Система купонов и промокодов
-- Created: 2025-01-30

-- ============================================
-- 1. ТАБЛИЦА КУПОНОВ
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL,           -- 'fixed', 'percentage', 'free_shipping'
    amount DECIMAL(10, 2) NOT NULL,      -- Сумма скидки или процент
    min_order_amount DECIMAL(10, 2) DEFAULT 0.00,
    max_discount_amount DECIMAL(10, 2),  -- Макс. скидка для процентных купонов
    max_uses INTEGER,                     -- NULL = неограничено
    uses_count INTEGER DEFAULT 0,
    per_user_limit INTEGER,               -- Сколько раз 1 пользователь может использовать
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active);
CREATE INDEX idx_coupons_valid_dates ON coupons(valid_from, valid_until);

-- ============================================
-- 2. ИСТОРИЯ ИСПОЛЬЗОВАНИЯ КУПОНОВ
-- ============================================
CREATE TABLE IF NOT EXISTS coupon_usages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(coupon_id, order_id)  -- Один купон на заказ
);

-- Индексы
CREATE INDEX idx_coupon_usages_coupon_id ON coupon_usages(coupon_id);
CREATE INDEX idx_coupon_usages_order_id ON coupon_usages(order_id);
CREATE INDEX idx_coupon_usages_user_id ON coupon_usages(user_id);
CREATE INDEX idx_coupon_usages_created_at ON coupon_usages(created_at DESC);

-- ============================================
-- 3. ДОБАВЛЯЕМ ПОЛЯ В ORDERS
-- ============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount DECIMAL(10, 2) DEFAULT 0.00;

-- Индекс
CREATE INDEX IF NOT EXISTS idx_orders_coupon_code ON orders(coupon_code);

-- ============================================
-- 4. ФУНКЦИЯ: Проверка валидности купона
-- ============================================
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
    IF p_user_id IS NOT NULL AND v_coupon.per_user_limit IS NOT NULL THEN
        SELECT COUNT(*) INTO v_user_uses
        FROM coupon_usages
        WHERE coupon_id = v_coupon.id
          AND user_id = p_user_id;

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
        v_calculated_discount := 0.00; -- Бесплатная доставка обрабатывается отдельно
    END IF;

    -- Купон валиден
    RETURN QUERY SELECT 
        TRUE, 
        NULL::TEXT,
        v_coupon.id,
        v_calculated_discount,
        v_coupon.type;
END;
$$;

-- ============================================
-- 5. ФУНКЦИЯ: Применение купона к заказу
-- ============================================
CREATE OR REPLACE FUNCTION apply_coupon_to_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_coupon_id UUID;
BEGIN
    -- Проверяем только при оплате заказа
    IF NEW.payment_status != 'paid' OR OLD.payment_status = 'paid' THEN
        RETURN NEW;
    END IF;

    -- Проверяем наличие купона
    IF NEW.coupon_code IS NULL OR NEW.coupon_code = '' THEN
        RETURN NEW;
    END IF;

    -- Получаем ID купона
    SELECT id INTO v_coupon_id
    FROM coupons
    WHERE code = UPPER(NEW.coupon_code)
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Создаем запись использования
    INSERT INTO coupon_usages (coupon_id, order_id, user_id, discount_amount)
    VALUES (v_coupon_id, NEW.id, NEW.user_id, COALESCE(NEW.coupon_discount, 0.00))
    ON CONFLICT (coupon_id, order_id) DO NOTHING;

    -- Увеличиваем счетчик использований
    UPDATE coupons
    SET uses_count = uses_count + 1,
        updated_at = NOW()
    WHERE id = v_coupon_id;

    RETURN NEW;
END;
$$;

-- Триггер на применение купона
DROP TRIGGER IF EXISTS trigger_apply_coupon_to_order ON orders;
CREATE TRIGGER trigger_apply_coupon_to_order
    AFTER UPDATE OF payment_status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION apply_coupon_to_order();

-- ============================================
-- 6. ФУНКЦИЯ: Обновление updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_coupons_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Триггер на обновление
DROP TRIGGER IF EXISTS trigger_update_coupons_updated_at ON coupons;
CREATE TRIGGER trigger_update_coupons_updated_at
    BEFORE UPDATE ON coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_coupons_updated_at();

-- ============================================
-- 7. RLS POLICIES
-- ============================================

-- Coupons (только чтение для всех, управление для админов)
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons"
    ON coupons FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Service role can manage coupons"
    ON coupons FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Coupon Usages (только чтение для пользователей своих записей)
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coupon usages"
    ON coupon_usages FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage coupon usages"
    ON coupon_usages FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- 8. ПРИМЕРЫ КУПОНОВ (для тестирования)
-- ============================================

-- Купон на фиксированную скидку €10
INSERT INTO coupons (code, description, type, amount, min_order_amount, is_active)
VALUES (
    'WELCOME10',
    'Скидка €10 на первый заказ',
    'fixed',
    10.00,
    50.00,
    TRUE
) ON CONFLICT (code) DO NOTHING;

-- Купон на процентную скидку 15%
INSERT INTO coupons (code, description, type, amount, min_order_amount, max_discount_amount, is_active)
VALUES (
    'SALE15',
    'Скидка 15% на все товары',
    'percentage',
    15.00,
    30.00,
    50.00,  -- Максимум €50 скидки
    TRUE
) ON CONFLICT (code) DO NOTHING;

-- Бесплатная доставка
INSERT INTO coupons (code, description, type, amount, min_order_amount, is_active)
VALUES (
    'FREESHIP',
    'Бесплатная доставка',
    'free_shipping',
    0.00,
    25.00,
    TRUE
) ON CONFLICT (code) DO NOTHING;

-- Купон с ограничением использований
INSERT INTO coupons (
    code, 
    description, 
    type, 
    amount, 
    min_order_amount,
    max_uses,
    per_user_limit,
    valid_until,
    is_active
)
VALUES (
    'NEWYEAR2025',
    'Новогодняя распродажа -20%',
    'percentage',
    20.00,
    40.00,
    100,        -- Всего 100 использований
    1,          -- 1 раз на пользователя
    '2025-02-01 23:59:59'::TIMESTAMPTZ,
    TRUE
) ON CONFLICT (code) DO NOTHING;

-- ============================================
-- ЗАВЕРШЕНО
-- ============================================

COMMENT ON TABLE coupons IS 'Купоны и промокоды для скидок';
COMMENT ON TABLE coupon_usages IS 'История использования купонов';
COMMENT ON FUNCTION validate_coupon IS 'Проверка валидности купона и расчет скидки';
COMMENT ON FUNCTION apply_coupon_to_order IS 'Применение купона к заказу после оплаты';
