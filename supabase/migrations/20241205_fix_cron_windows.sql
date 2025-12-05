-- =====================================================
-- FIX: Расширение временных окон для daily cron (бесплатный Vercel)
-- =====================================================
-- Проблема: На Hobby плане Vercel cron запускается только 1 раз в день
-- Решение: Расширить временные окна, чтобы не пропустить корзины

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
        -- Отправляем всем корзинам старше 1 часа, которые еще не получили email
        RETURN QUERY
        SELECT 
            ac.id, ac.email, ac.cart_items, ac.cart_total,
            ac.recovery_token, ac.coupon_code, ac.created_at
        FROM abandoned_carts ac
        WHERE ac.recovered_at IS NULL
        AND ac.email_1h_sent = false
        AND ac.created_at <= NOW() - INTERVAL '1 hour'
        AND ac.created_at >= NOW() - INTERVAL '23 hours' -- Расширено до 23 часов
        LIMIT 100;
        
    ELSIF email_type = '24h' THEN
        -- Отправляем корзинам 24+ часов, которые получили 1h email
        RETURN QUERY
        SELECT 
            ac.id, ac.email, ac.cart_items, ac.cart_total,
            ac.recovery_token, ac.coupon_code, ac.created_at
        FROM abandoned_carts ac
        WHERE ac.recovered_at IS NULL
        AND ac.email_1h_sent = true  -- Должны были получить 1h email
        AND ac.email_24h_sent = false
        AND ac.created_at <= NOW() - INTERVAL '24 hours'
        AND ac.created_at >= NOW() - INTERVAL '47 hours' -- До 47 часов (перед 48ч = 2 дня)
        LIMIT 100;
        
    ELSIF email_type = '3d' THEN
        -- Отправляем корзинам 3+ дней, которые получили 24h email
        RETURN QUERY
        SELECT 
            ac.id, ac.email, ac.cart_items, ac.cart_total,
            ac.recovery_token, ac.coupon_code, ac.created_at
        FROM abandoned_carts ac
        WHERE ac.recovered_at IS NULL
        AND ac.email_24h_sent = true  -- Должны были получить 24h email
        AND ac.email_3d_sent = false
        AND ac.created_at <= NOW() - INTERVAL '3 days'
        AND ac.created_at >= NOW() - INTERVAL '4 days' -- До 4 дней
        LIMIT 100;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Комментарий: Теперь при запуске cron 1 раз в день (например, в 10:00 UTC):
-- - 1h email: получат все корзины от 1 до 23 часов
-- - 24h email: получат все корзины от 24 до 47 часов (которые уже получили 1h)
-- - 3d email: получат все корзины от 3 до 4 дней (которые уже получили 24h)
