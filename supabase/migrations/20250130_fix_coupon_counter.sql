-- Fix: Trigger to increment coupon uses_count when coupon_usage is created
-- This trigger fires on INSERT into coupon_usages table

-- Create function to increment uses_count
CREATE OR REPLACE FUNCTION increment_coupon_uses_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Increment the uses_count for the coupon
    UPDATE coupons
    SET uses_count = uses_count + 1,
        updated_at = NOW()
    WHERE id = NEW.coupon_id;

    RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_increment_coupon_uses ON coupon_usages;

-- Create trigger on coupon_usages INSERT
CREATE TRIGGER trigger_increment_coupon_uses
    AFTER INSERT ON coupon_usages
    FOR EACH ROW
    EXECUTE FUNCTION increment_coupon_uses_count();

-- Also create decrement function for when usage is deleted (e.g., order cancelled)
CREATE OR REPLACE FUNCTION decrement_coupon_uses_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Decrement the uses_count for the coupon
    UPDATE coupons
    SET uses_count = GREATEST(0, uses_count - 1),  -- Don't go below 0
        updated_at = NOW()
    WHERE id = OLD.coupon_id;

    RETURN OLD;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_decrement_coupon_uses ON coupon_usages;

-- Create trigger on coupon_usages DELETE
CREATE TRIGGER trigger_decrement_coupon_uses
    AFTER DELETE ON coupon_usages
    FOR EACH ROW
    EXECUTE FUNCTION decrement_coupon_uses_count();

-- Manual fix: Update current uses_count based on actual usage records
UPDATE coupons
SET uses_count = (
    SELECT COUNT(*)
    FROM coupon_usages
    WHERE coupon_usages.coupon_id = coupons.id
),
updated_at = NOW();

-- Verification query (uncomment to run)
-- SELECT 
--     c.code,
--     c.uses_count as current_count,
--     COUNT(cu.id) as actual_usage_count
-- FROM coupons c
-- LEFT JOIN coupon_usages cu ON cu.coupon_id = c.id
-- GROUP BY c.id, c.code, c.uses_count;
