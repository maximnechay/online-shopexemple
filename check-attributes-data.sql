-- Проверка данных в таблицах атрибутов

-- 1. Проверить все атрибуты
SELECT id, name, slug, type, filterable, display_order 
FROM public.attributes 
ORDER BY display_order;

-- 2. Проверить значения атрибутов
SELECT 
    a.name as attribute_name,
    a.slug as attribute_slug,
    av.value,
    av.slug as value_slug,
    av.display_order
FROM public.attribute_values av
JOIN public.attributes a ON a.id = av.attribute_id
ORDER BY a.display_order, av.display_order;

-- 3. Проверить политики RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('attributes', 'attribute_values', 'product_attributes')
ORDER BY tablename, policyname;
