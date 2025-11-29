-- Проверка дубликатов отзывов
SELECT id, product_id, user_id, rating, status, created_at, updated_at
FROM reviews
ORDER BY created_at DESC;

-- Подсчет отзывов по статусу
SELECT status, COUNT(*) as count
FROM reviews
GROUP BY status;

-- Проверка на дубликаты по ID
SELECT id, COUNT(*) as count
FROM reviews
GROUP BY id
HAVING COUNT(*) > 1;
