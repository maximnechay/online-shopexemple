-- =====================================================
-- ABANDONED CART RECOVERY SYSTEM
-- =====================================================
-- Таблица для отслеживания брошенных корзин
-- и автоматической отправки recovery emails

-- Создание таблицы abandoned_carts
CREATE TABLE IF NOT EXISTS abandoned_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Идентификация пользователя
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    
    -- Содержимое корзины
    cart_items JSONB NOT NULL,
    cart_total DECIMAL(10, 2) NOT NULL,
    
    -- Статусы и токены
    recovery_token TEXT UNIQUE NOT NULL,
    recovered_at TIMESTAMP WITH TIME ZONE,
    
    -- Email триггеры
    email_1h_sent BOOLEAN DEFAULT false,
    email_1h_sent_at TIMESTAMP WITH TIME ZONE,
    
    email_24h_sent BOOLEAN DEFAULT false,
    email_24h_sent_at TIMESTAMP WITH TIME ZONE,
    coupon_code TEXT, -- Купон 10% для второго email
    
    email_3d_sent BOOLEAN DEFAULT false,
    email_3d_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Метаданные
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Источник трафика (для аналитики)
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    
    -- IP и User Agent
    ip_address TEXT,
    user_agent TEXT
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email ON abandoned_carts(email);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_user_id ON abandoned_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_recovery_token ON abandoned_carts(recovery_token);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_created_at ON abandoned_carts(created_at);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_recovered_at ON abandoned_carts(recovered_at);

-- Индекс для поиска корзин, готовых к отправке email
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email_pending 
ON abandoned_carts(created_at, email_1h_sent, email_24h_sent, email_3d_sent)
WHERE recovered_at IS NULL;

-- Функция автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_abandoned_carts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS trigger_update_abandoned_carts_updated_at ON abandoned_carts;
CREATE TRIGGER trigger_update_abandoned_carts_updated_at
    BEFORE UPDATE ON abandoned_carts
    FOR EACH ROW
    EXECUTE FUNCTION update_abandoned_carts_updated_at();

-- =====================================================
-- ТАБЛИЦА ДЛЯ СТАТИСТИКИ ВОССТАНОВЛЕНИЯ КОРЗИН
-- =====================================================

CREATE TABLE IF NOT EXISTS abandoned_cart_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    
    -- Общая статистика
    total_abandoned INTEGER DEFAULT 0,
    total_recovered INTEGER DEFAULT 0,
    recovery_rate DECIMAL(5, 2) DEFAULT 0,
    
    -- По email этапам
    email_1h_sent INTEGER DEFAULT 0,
    email_24h_sent INTEGER DEFAULT 0,
    email_3d_sent INTEGER DEFAULT 0,
    
    -- Эффективность каждого email
    recovered_from_1h INTEGER DEFAULT 0,
    recovered_from_24h INTEGER DEFAULT 0,
    recovered_from_3d INTEGER DEFAULT 0,
    
    -- Финансовые метрики
    total_abandoned_value DECIMAL(12, 2) DEFAULT 0,
    total_recovered_value DECIMAL(12, 2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abandoned_cart_stats_date ON abandoned_cart_stats(date DESC);

-- =====================================================
-- RLS (Row Level Security) ПОЛИТИКИ
-- =====================================================

-- Включаем RLS
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_cart_stats ENABLE ROW LEVEL SECURITY;

-- Service role может делать всё (для API и cron jobs)
CREATE POLICY "Service role full access to abandoned carts"
ON abandoned_carts
TO service_role
USING (true)
WITH CHECK (true);

-- Анонимные пользователи могут создавать корзины (для гостей)
CREATE POLICY "Anyone can insert abandoned carts"
ON abandoned_carts FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Пользователи могут видеть только свои корзины
CREATE POLICY "Users can view own abandoned carts"
ON abandoned_carts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Service role полный доступ к статистике
CREATE POLICY "Service role full access to stats"
ON abandoned_cart_stats
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- ФУНКЦИЯ ДЛЯ ГЕНЕРАЦИИ RECOVERY TOKEN
-- =====================================================

CREATE OR REPLACE FUNCTION generate_recovery_token()
RETURNS TEXT AS $$
DECLARE
    token TEXT;
BEGIN
    token := encode(gen_random_bytes(32), 'base64');
    token := replace(token, '/', '_');
    token := replace(token, '+', '-');
    token := replace(token, '=', '');
    RETURN token;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ФУНКЦИЯ ДЛЯ ПОМЕТКИ КОРЗИНЫ КАК ВОССТАНОВЛЕННОЙ
-- =====================================================

CREATE OR REPLACE FUNCTION mark_cart_as_recovered(token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE abandoned_carts
    SET recovered_at = NOW()
    WHERE recovery_token = token
    AND recovered_at IS NULL;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ КОРЗИН, ГОТОВЫХ К EMAIL
-- =====================================================

CREATE OR REPLACE FUNCTION get_carts_for_email_trigger(
    email_type TEXT -- '1h', '24h', '3d'
)
RETURNS TABLE (
    id UUID,
    email TEXT,
    cart_items JSONB,
    cart_total DECIMAL,
    recovery_token TEXT,
    coupon_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    IF email_type = '1h' THEN
        RETURN QUERY
        SELECT 
            ac.id, ac.email, ac.cart_items, ac.cart_total,
            ac.recovery_token, ac.coupon_code, ac.created_at
        FROM abandoned_carts ac
        WHERE ac.recovered_at IS NULL
        AND ac.email_1h_sent = false
        AND ac.created_at <= NOW() - INTERVAL '1 hour'
        AND ac.created_at >= NOW() - INTERVAL '2 hours'
        LIMIT 100;
        
    ELSIF email_type = '24h' THEN
        RETURN QUERY
        SELECT 
            ac.id, ac.email, ac.cart_items, ac.cart_total,
            ac.recovery_token, ac.coupon_code, ac.created_at
        FROM abandoned_carts ac
        WHERE ac.recovered_at IS NULL
        AND ac.email_24h_sent = false
        AND ac.created_at <= NOW() - INTERVAL '24 hours'
        AND ac.created_at >= NOW() - INTERVAL '25 hours'
        LIMIT 100;
        
    ELSIF email_type = '3d' THEN
        RETURN QUERY
        SELECT 
            ac.id, ac.email, ac.cart_items, ac.cart_total,
            ac.recovery_token, ac.coupon_code, ac.created_at
        FROM abandoned_carts ac
        WHERE ac.recovered_at IS NULL
        AND ac.email_3d_sent = false
        AND ac.created_at <= NOW() - INTERVAL '3 days'
        AND ac.created_at >= NOW() - INTERVAL '3 days 1 hour'
        LIMIT 100;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ФУНКЦИЯ ДЛЯ ОБНОВЛЕНИЯ СТАТИСТИКИ
-- =====================================================

CREATE OR REPLACE FUNCTION update_daily_cart_stats()
RETURNS VOID AS $$
DECLARE
    today DATE := CURRENT_DATE;
BEGIN
    INSERT INTO abandoned_cart_stats (
        date,
        total_abandoned,
        total_recovered,
        recovery_rate,
        email_1h_sent,
        email_24h_sent,
        email_3d_sent,
        recovered_from_1h,
        recovered_from_24h,
        recovered_from_3d,
        total_abandoned_value,
        total_recovered_value
    )
    SELECT
        today,
        COUNT(*) as total_abandoned,
        COUNT(*) FILTER (WHERE recovered_at IS NOT NULL) as total_recovered,
        ROUND(
            (COUNT(*) FILTER (WHERE recovered_at IS NOT NULL)::DECIMAL / 
            NULLIF(COUNT(*), 0) * 100), 
            2
        ) as recovery_rate,
        COUNT(*) FILTER (WHERE email_1h_sent = true) as email_1h_sent,
        COUNT(*) FILTER (WHERE email_24h_sent = true) as email_24h_sent,
        COUNT(*) FILTER (WHERE email_3d_sent = true) as email_3d_sent,
        COUNT(*) FILTER (WHERE recovered_at IS NOT NULL AND email_1h_sent = true AND email_24h_sent = false) as recovered_from_1h,
        COUNT(*) FILTER (WHERE recovered_at IS NOT NULL AND email_24h_sent = true AND email_3d_sent = false) as recovered_from_24h,
        COUNT(*) FILTER (WHERE recovered_at IS NOT NULL AND email_3d_sent = true) as recovered_from_3d,
        COALESCE(SUM(cart_total), 0) as total_abandoned_value,
        COALESCE(SUM(cart_total) FILTER (WHERE recovered_at IS NOT NULL), 0) as total_recovered_value
    FROM abandoned_carts
    WHERE DATE(created_at) = today
    ON CONFLICT (date) DO UPDATE SET
        total_abandoned = EXCLUDED.total_abandoned,
        total_recovered = EXCLUDED.total_recovered,
        recovery_rate = EXCLUDED.recovery_rate,
        email_1h_sent = EXCLUDED.email_1h_sent,
        email_24h_sent = EXCLUDED.email_24h_sent,
        email_3d_sent = EXCLUDED.email_3d_sent,
        recovered_from_1h = EXCLUDED.recovered_from_1h,
        recovered_from_24h = EXCLUDED.recovered_from_24h,
        recovered_from_3d = EXCLUDED.recovered_from_3d,
        total_abandoned_value = EXCLUDED.total_abandoned_value,
        total_recovered_value = EXCLUDED.total_recovered_value,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- КОММЕНТАРИИ К ТАБЛИЦАМ
-- =====================================================

COMMENT ON TABLE abandoned_carts IS 'Брошенные корзины для системы восстановления';
COMMENT ON COLUMN abandoned_carts.cart_items IS 'JSON массив товаров: [{product_id, name, price, quantity, image}]';
COMMENT ON COLUMN abandoned_carts.recovery_token IS 'Уникальный токен для восстановления корзины';
COMMENT ON COLUMN abandoned_carts.coupon_code IS 'Персональный купон на 10% (генерируется для 24h email)';

COMMENT ON TABLE abandoned_cart_stats IS 'Ежедневная статистика восстановления брошенных корзин';

-- =====================================================
-- ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ
-- =====================================================

/*
-- Создать новую брошенную корзину:
INSERT INTO abandoned_carts (email, cart_items, cart_total, recovery_token)
VALUES (
    'user@example.com',
    '[{"product_id": "123", "name": "Product", "price": 29.99, "quantity": 1}]'::jsonb,
    29.99,
    generate_recovery_token()
);

-- Получить корзины для отправки 1-часового email:
SELECT * FROM get_carts_for_email_trigger('1h');

-- Пометить корзину как восстановленную:
SELECT mark_cart_as_recovered('token_here');

-- Обновить дневную статистику:
SELECT update_daily_cart_stats();

-- Получить статистику за последние 30 дней:
SELECT * FROM abandoned_cart_stats
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;
*/
