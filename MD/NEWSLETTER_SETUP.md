# Newsletter Subscribers Migration Guide

## Автоматическое выполнение миграции

Выполните SQL-скрипт из файла `supabase/migrations/20240124_create_newsletter_subscribers.sql` в вашей Supabase базе данных:

### Через Supabase Dashboard:
1. Откройте https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите в SQL Editor
4. Скопируйте содержимое файла `supabase/migrations/20240124_create_newsletter_subscribers.sql`
5. Вставьте и выполните SQL

### Через Supabase CLI:
```bash
npx supabase db push
```

## Структура таблицы

Таблица `newsletter_subscribers`:
- `id` (UUID) - Уникальный идентификатор
- `email` (VARCHAR) - Email подписчика (уникальный)
- `subscribed_at` (TIMESTAMP) - Дата подписки
- `is_active` (BOOLEAN) - Активна ли подписка
- `unsubscribed_at` (TIMESTAMP) - Дата отписки (если есть)
- `source` (VARCHAR) - Источник подписки (homepage, popup, etc.)
- `created_at` (TIMESTAMP) - Дата создания записи
- `updated_at` (TIMESTAMP) - Дата обновления записи

## Функциональность

### API Endpoint: `/api/newsletter`
- ✅ Проверяет валидность email
- ✅ Проверяет дубликаты в базе
- ✅ Сохраняет новых подписчиков
- ✅ Реактивирует отписавшихся пользователей
- ✅ Отправляет email администратору
- ✅ Отправляет подтверждение клиенту

### Row Level Security (RLS)
- Любой может подписаться (INSERT)
- Только аутентифицированные пользователи (админы) могут просматривать список
- Только аутентифицированные пользователи могут обновлять записи

## Тестирование

После выполнения миграции протестируйте:

1. Подпишитесь через форму на главной странице
2. Проверьте, что email сохранился в базу:
```sql
SELECT * FROM newsletter_subscribers;
```
3. Попробуйте подписаться повторно с тем же email - должна появиться ошибка
4. Проверьте получение писем на admin email и customer email

## Управление подписчиками

Просмотр всех подписчиков:
```sql
SELECT email, subscribed_at, is_active 
FROM newsletter_subscribers 
ORDER BY subscribed_at DESC;
```

Просмотр только активных:
```sql
SELECT email, subscribed_at 
FROM newsletter_subscribers 
WHERE is_active = true 
ORDER BY subscribed_at DESC;
```

Отписать пользователя:
```sql
UPDATE newsletter_subscribers 
SET is_active = false, unsubscribed_at = NOW() 
WHERE email = 'user@example.com';
```
