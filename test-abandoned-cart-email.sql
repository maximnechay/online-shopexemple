-- Создание тестовой корзины для проверки 1h email
INSERT INTO abandoned_carts (
    email, 
    cart_items, 
    cart_total, 
    recovery_token, 
    created_at, 
    updated_at
) VALUES (
    'test-1h-email@example.com',
    '[{"name": "Test Product", "slug": "test", "price": 50, "quantity": 1, "product_id": "5b602d30-ac78-4fd5-892a-2ece588e23e2"}]'::jsonb,
    50.00,
    'test-token-' || floor(random() * 1000000)::text,
    NOW() - INTERVAL '1 hour 30 minutes',
    NOW() - INTERVAL '1 hour 30 minutes'
) RETURNING id, email, created_at, (NOW() - created_at) as age;
