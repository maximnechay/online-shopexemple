# Шаги для применения изменений

## 1. Применить миграцию в Supabase

Откройте Supabase Dashboard → SQL Editor и выполните содержимое файла:
`supabase/migrations/20241205_fix_cron_windows.sql`

Или выполните через Supabase CLI (если установлен):
```bash
supabase db push
```

## 2. Задеплоить на Vercel

```bash
git add .
git commit -m "Fix: Расширены временные окна для daily cron (Vercel Hobby)"
git push
vercel --prod
```

## Что изменилось?

### Было (для почасового cron):
- **1h email**: корзины от 1 до 2 часов ❌ Узкое окно
- **24h email**: корзины от 24 до 25 часов ❌ Узкое окно
- **3d email**: корзины от 72 до 73 часов ❌ Узкое окно

### Стало (для ежедневного cron):
- **1h email**: корзины от 1 до 23 часов ✅ Широкое окно
- **24h email**: корзины от 24 до 47 часов ✅ Широкое окно
- **3d email**: корзины от 3 до 4 дней ✅ Широкое окно

### Расписание:
- **Vercel Cron**: Каждый день в 10:00 UTC (12:00 по Берлину)
- **Все emails**: отправляются за один запуск

## Тестирование

После применения миграции выполните в Supabase SQL Editor:
```sql
-- Посмотреть, сколько корзин готовы к отправке
SELECT * FROM get_carts_for_email_trigger('1h');
SELECT * FROM get_carts_for_email_trigger('24h');
SELECT * FROM get_carts_for_email_trigger('3d');
```

Затем протестируйте API локально:
```powershell
$headers = @{ "Authorization" = "Bearer my_super_secret_cron_key_2024_beauty_salon" }
Invoke-RestMethod -Uri "http://localhost:3000/api/abandoned-cart/send-emails" -Method POST -Headers $headers
```

## Альтернатива (если нужен почасовой запуск):

Используйте внешний cron сервис:
- **cron-job.org** (бесплатно, до 50 задач)
- **EasyCron** (бесплатно, 1 задача)
- **GitHub Actions** (бесплатно для публичных репозиториев)

Настройте вызов каждый час:
```
GET https://your-site.vercel.app/api/abandoned-cart/send-emails
Header: Authorization: Bearer your_secret_key
```
