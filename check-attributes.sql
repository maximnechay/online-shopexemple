-- Проверка существования таблиц атрибутов
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('attributes', 'attribute_values', 'product_attributes');

-- Если таблицы существуют, показать их структуру
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name IN ('attributes', 'attribute_values', 'product_attributes')
ORDER BY table_name, ordinal_position;
