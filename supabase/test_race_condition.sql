-- Test script for race condition protection
-- Run this in Supabase SQL Editor to verify atomic stock decrease

-- 1. Setup test product
DO $$
DECLARE
    test_product_id uuid;
BEGIN
    -- Create or update test product with stock = 5
    INSERT INTO products (id, name, price, stock_quantity, description, image_url, category)
    VALUES (
        '00000000-0000-0000-0000-000000000001',
        'Test Product - Race Condition',
        99.99,
        5,
        'Product for testing race condition protection',
        'https://via.placeholder.com/300',
        'test'
    )
    ON CONFLICT (id) DO UPDATE
    SET stock_quantity = 5;
    
    RAISE NOTICE 'Test product created with stock = 5';
END $$;

-- 2. Verify function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'decrease_stock_atomic';

-- 3. Test single purchase
SELECT decrease_stock_atomic(
    '[
        {
            "productId": "00000000-0000-0000-0000-000000000001",
            "quantity": 2,
            "notes": "Test purchase 1"
        }
    ]'::jsonb,
    gen_random_uuid(),
    'test-payment-1'
);

-- Check stock after first purchase (should be 3)
SELECT name, stock_quantity FROM products 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 4. Test purchase with insufficient stock
SELECT decrease_stock_atomic(
    '[
        {
            "productId": "00000000-0000-0000-0000-000000000001",
            "quantity": 10,
            "notes": "Test purchase 2 - should fail"
        }
    ]'::jsonb,
    gen_random_uuid(),
    'test-payment-2'
);

-- Check stock after failed purchase (should still be 3)
SELECT name, stock_quantity FROM products 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 5. Test multiple items in one transaction
SELECT decrease_stock_atomic(
    '[
        {
            "productId": "00000000-0000-0000-0000-000000000001",
            "quantity": 1,
            "notes": "Multi-item test"
        },
        {
            "productId": "00000000-0000-0000-0000-000000000001",
            "quantity": 1,
            "notes": "Multi-item test"
        }
    ]'::jsonb,
    gen_random_uuid(),
    'test-payment-3'
);

-- Check stock after multi-item purchase (should be 1)
SELECT name, stock_quantity FROM products 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 6. View stock logs
SELECT 
    sl.created_at,
    p.name as product_name,
    sl.event_type,
    sl.quantity_change,
    sl.stock_before,
    sl.stock_after,
    sl.payment_id,
    sl.notes
FROM stock_logs sl
JOIN products p ON p.id = sl.product_id
WHERE p.id = '00000000-0000-0000-0000-000000000001'
ORDER BY sl.created_at DESC;

-- 7. Simulate race condition (run in two different sessions simultaneously)
-- SESSION 1:
/*
BEGIN;
SELECT decrease_stock_atomic(
    '[{"productId": "00000000-0000-0000-0000-000000000001", "quantity": 1}]'::jsonb,
    gen_random_uuid(),
    'race-test-1'
);
COMMIT;
*/

-- SESSION 2: (run at the same time)
/*
BEGIN;
SELECT decrease_stock_atomic(
    '[{"productId": "00000000-0000-0000-0000-000000000001", "quantity": 1}]'::jsonb,
    gen_random_uuid(),
    'race-test-2'
);
COMMIT;
*/

-- Expected result: 
-- - One session succeeds, decreases stock from 1 to 0
-- - Other session waits for lock, then fails with "Insufficient stock"
-- - Final stock = 0 (not -1!)

-- 8. Cleanup
/*
DELETE FROM stock_logs WHERE product_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM products WHERE id = '00000000-0000-0000-0000-000000000001';
*/

-- 9. Performance test - measure function execution time
EXPLAIN ANALYZE
SELECT decrease_stock_atomic(
    '[{"productId": "00000000-0000-0000-0000-000000000001", "quantity": 1}]'::jsonb,
    gen_random_uuid(),
    'perf-test'
);
