-- ========================================
-- ТЕСТИРОВАНИЕ ABANDONED CART EMAIL SYSTEM
-- ========================================

-- 1. ТЕКУЩЕЕ СОСТОЯНИЕ: Посмотреть все активные корзины
SELECT 
    id,
    email,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 as age_hours,
    email_1h_sent,
    email_1h_sent_at,
    email_24h_sent,
    email_24h_sent_at,
    recovered_at,
    cart_total
FROM abandoned_carts
WHERE recovered_at IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- 2. СОЗДАТЬ ТЕСТОВУЮ КОРЗИНУ (1.5 часа назад для теста 1h email)
INSERT INTO abandoned_carts (
    email, 
    cart_items, 
    cart_total, 
    recovery_token, 
    created_at, 
    updated_at
) VALUES (
    'test-1h@example.com',
    '[{"name": "Test Product", "slug": "test", "price": 50, "quantity": 1, "product_id": "5b602d30-ac78-4fd5-892a-2ece588e23e2"}]'::jsonb,
    50.00,
    'test-token-' || substr(md5(random()::text), 1, 10),
    NOW() - INTERVAL '1 hour 30 minutes',
    NOW() - INTERVAL '1 hour 30 minutes'
) RETURNING 
    id, 
    email, 
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 as age_hours;

-- 3. ПРОВЕРИТЬ: Какие корзины попадают в 1h окно (1-2 часа)
SELECT * FROM get_carts_for_email_trigger('1h');

-- 4. ПРОВЕРИТЬ: Какие корзины попадают в 24h окно
SELECT * FROM get_carts_for_email_trigger('24h');

-- 5. ПРОВЕРИТЬ: Какие корзины попадают в 3d окно
SELECT * FROM get_carts_for_email_trigger('3d');

-- 6. ОЧИСТИТЬ тестовые данные (если нужно)
-- DELETE FROM abandoned_carts WHERE email LIKE 'test-%@example.com';

-- 7. СТАТИСТИКА: Сколько корзин в каждом временном окне (ОБНОВЛЕНО для daily cron)
SELECT 
    'ready_for_1h' as status,
    COUNT(*) as count
FROM abandoned_carts
WHERE recovered_at IS NULL
    AND email_1h_sent = false
    AND created_at <= NOW() - INTERVAL '1 hour'
    AND created_at >= NOW() - INTERVAL '23 hours'

UNION ALL

SELECT 
    'ready_for_24h' as status,
    COUNT(*) as count
FROM abandoned_carts
WHERE recovered_at IS NULL
    AND email_1h_sent = true
    AND email_24h_sent = false
    AND created_at <= NOW() - INTERVAL '24 hours'
    AND created_at >= NOW() - INTERVAL '47 hours'

UNION ALL

SELECT 
    'ready_for_3d' as status,
    COUNT(*) as count
FROM abandoned_carts
WHERE recovered_at IS NULL
    AND email_24h_sent = true
    AND email_3d_sent = false
    AND created_at <= NOW() - INTERVAL '3 days'
    AND created_at >= NOW() - INTERVAL '4 days';

-- 8. СОЗДАТЬ ТЕСТОВЫЕ КОРЗИНЫ ДЛЯ ВСЕХ ОКОН
-- Для 1h (1.5 часа назад)
INSERT INTO abandoned_carts (email, cart_items, cart_total, recovery_token, created_at, updated_at)
VALUES (
    'test-1h-' || substr(md5(random()::text), 1, 6) || '@example.com',
    '[{"name": "Test Product 1h", "slug": "test", "price": 50, "quantity": 1, "product_id": "5b602d30-ac78-4fd5-892a-2ece588e23e2"}]'::jsonb,
    50.00,
    'token-1h-' || substr(md5(random()::text), 1, 10),
    NOW() - INTERVAL '1 hour 30 minutes',
    NOW() - INTERVAL '1 hour 30 minutes'
);

-- Для 24h (24.5 часа назад)
INSERT INTO abandoned_carts (email, cart_items, cart_total, recovery_token, created_at, updated_at)
VALUES (
    'test-24h-' || substr(md5(random()::text), 1, 6) || '@example.com',
    '[{"name": "Test Product 24h", "slug": "test", "price": 100, "quantity": 1, "product_id": "5b602d30-ac78-4fd5-892a-2ece588e23e2"}]'::jsonb,
    100.00,
    'token-24h-' || substr(md5(random()::text), 1, 10),
    NOW() - INTERVAL '24 hours 30 minutes',
    NOW() - INTERVAL '24 hours 30 minutes'
);

-- Для 3d (72.5 часа назад)
INSERT INTO abandoned_carts (email, cart_items, cart_total, recovery_token, created_at, updated_at)
VALUES (
    'test-3d-' || substr(md5(random()::text), 1, 6) || '@example.com',
    '[{"name": "Test Product 3d", "slug": "test", "price": 150, "quantity": 1, "product_id": "5b602d30-ac78-4fd5-892a-2ece588e23e2"}]'::jsonb,
    150.00,
    'token-3d-' || substr(md5(random()::text), 1, 10),
    NOW() - INTERVAL '3 days 30 minutes',
    NOW() - INTERVAL '3 days 30 minutes'
);
