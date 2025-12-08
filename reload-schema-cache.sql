-- Обновить кэш схемы Supabase
-- Выполните эту команду чтобы Supabase обновил свой кэш таблиц

NOTIFY pgrst, 'reload schema';

-- Или альтернативный способ - пересоздать таблицу с уведомлением
-- (это заставит PostgREST обновить кэш)
SELECT pg_notify('pgrst', 'reload schema');

-- Также можно проверить что PostgREST видит таблицы:
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename IN ('attributes', 'attribute_values', 'product_attributes');
