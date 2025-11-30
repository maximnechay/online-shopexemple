-- Debug: Check what triggers exist and test the coupon system

-- 1. Check existing triggers on coupon_usages
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'coupon_usages';

-- 2. Check existing triggers on orders related to coupons
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'orders' 
  AND trigger_name LIKE '%coupon%';

-- 3. Check current coupon usage counts
SELECT 
    c.code,
    c.uses_count as stored_count,
    COUNT(cu.id) as actual_usage_count,
    c.uses_count - COUNT(cu.id) as difference
FROM coupons c
LEFT JOIN coupon_usages cu ON cu.coupon_id = c.id
GROUP BY c.id, c.code, c.uses_count
ORDER BY c.created_at DESC;

-- 4. Check recent coupon usages
SELECT 
    cu.created_at,
    c.code as coupon_code,
    o.order_number,
    cu.discount_amount,
    u.email as user_email
FROM coupon_usages cu
JOIN coupons c ON c.id = cu.coupon_id
LEFT JOIN orders o ON o.id = cu.order_id
LEFT JOIN auth.users u ON u.id = cu.user_id
ORDER BY cu.created_at DESC
LIMIT 10;
