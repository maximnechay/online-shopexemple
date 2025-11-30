-- Rollback: Referral and Bonus System
-- Откат миграции реферальной системы и бонусной программы
-- Created: 2025-01-30

-- ============================================
-- ВНИМАНИЕ! Этот скрипт удалит ВСЕ данные:
-- - Бонусы пользователей
-- - Историю транзакций
-- - Реферальные связи
-- - Реферальные коды
-- - Настройки программы
-- ============================================

-- 1. Удаляем триггеры
DROP TRIGGER IF EXISTS trigger_create_referral_code ON auth.users;
DROP TRIGGER IF EXISTS trigger_process_referral_on_order ON orders;
DROP TRIGGER IF EXISTS trigger_earn_order_bonus ON orders;

-- 2. Удаляем функции
DROP FUNCTION IF EXISTS generate_referral_code(UUID);
DROP FUNCTION IF EXISTS create_user_referral_code();
DROP FUNCTION IF EXISTS add_bonus_transaction(UUID, DECIMAL, VARCHAR, VARCHAR, TEXT, UUID, UUID, INTEGER);
DROP FUNCTION IF EXISTS process_referral_on_order();
DROP FUNCTION IF EXISTS earn_order_bonus();
DROP FUNCTION IF EXISTS get_referral_stats(UUID);

-- 3. Удаляем столбцы из orders
ALTER TABLE orders DROP COLUMN IF EXISTS bonus_used;
ALTER TABLE orders DROP COLUMN IF EXISTS bonus_earned;
ALTER TABLE orders DROP COLUMN IF EXISTS referral_code;

-- 4. Удаляем индексы
DROP INDEX IF EXISTS idx_orders_referral_code;

-- 5. Удаляем таблицы (каскадно удалит все связанные данные)
DROP TABLE IF EXISTS coupon_usages CASCADE;
DROP TABLE IF EXISTS bonus_transactions CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS referral_codes CASCADE;
DROP TABLE IF EXISTS referral_settings CASCADE;
DROP TABLE IF EXISTS user_bonuses CASCADE;

-- ============================================
-- ГОТОВО! Миграция отменена
-- ============================================

-- Проверить, что таблицы удалены:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND (table_name LIKE '%referral%' OR table_name LIKE '%bonus%');

COMMENT ON DATABASE postgres IS 'Referral and bonus system rolled back successfully';
