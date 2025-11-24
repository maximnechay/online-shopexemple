# 🔧 Исправление: newsletter_enabled column

## Проблема
```
Could not find the 'newsletter_enabled' column of 'profiles' in the schema cache
```

Колонка `newsletter_enabled` отсутствует в таблице `profiles` в базе данных Supabase.

---

## ✅ Решение

### Вариант 1: Через Supabase Dashboard (Быстро - 2 минуты)

1. **Откройте Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/ftnesgtxepluwpicbydh
   ```

2. **Перейдите в SQL Editor:**
   - Левое меню → **SQL Editor**
   - Нажмите **"New query"**

3. **Скопируйте и выполните SQL:**
   ```sql
   -- Add newsletter_enabled column to profiles table
   ALTER TABLE profiles 
   ADD COLUMN IF NOT EXISTS newsletter_enabled BOOLEAN DEFAULT false;

   -- Create index for faster queries
   CREATE INDEX IF NOT EXISTS idx_profiles_newsletter_enabled 
   ON profiles(newsletter_enabled) 
   WHERE newsletter_enabled = true;

   -- Add comment
   COMMENT ON COLUMN profiles.newsletter_enabled IS 'User opt-in for email newsletters';
   ```

4. **Нажмите "Run"** (или Ctrl+Enter)

5. **Проверьте результат:**
   ```sql
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_name = 'profiles' AND column_name = 'newsletter_enabled';
   ```
   
   Должно вернуть:
   ```
   column_name         | data_type | is_nullable | column_default
   newsletter_enabled  | boolean   | YES         | false
   ```

6. **Готово!** ✅ Перезапустите dev server:
   ```bash
   npm run dev
   ```

---

### Вариант 2: Через Supabase CLI (Если установлен)

```bash
# 1. Перейдите в папку проекта
cd e:\work\фриланс\beauty-salon-shop

# 2. Выполните миграцию
supabase db push

# Или примените конкретный файл
supabase db execute --file supabase/migrations/20241124_add_newsletter_enabled.sql
```

---

### Вариант 3: Вручную через Table Editor

1. Откройте **Table Editor** в Supabase Dashboard
2. Выберите таблицу **profiles**
3. Нажмите **"Add Column"**
4. Заполните:
   - Name: `newsletter_enabled`
   - Type: `bool`
   - Default value: `false`
   - Nullable: Yes (или No)
5. Нажмите **"Save"**

---

## 🔍 Проверка после выполнения

### В Supabase Dashboard:

1. **Table Editor** → **profiles**
2. Убедитесь, что колонка `newsletter_enabled` появилась
3. Попробуйте изменить значение для тестового пользователя

### В приложении:

1. Перезапустите сервер:
   ```bash
   npm run dev
   ```

2. Откройте профиль:
   ```
   http://localhost:3000/profile
   ```

3. Должна появиться секция **"Newsletter-Einstellungen"**

4. Проверьте отписку:
   ```
   http://localhost:3000/unsubscribe?email=test@test.com
   ```

---

## 📊 Структура после миграции

```sql
profiles
├── id (uuid)
├── email (varchar)
├── full_name (varchar)
├── phone (varchar)
├── address (varchar)
├── city (varchar)
├── postal_code (varchar)
├── role (varchar)
├── created_at (timestamp)
└── newsletter_enabled (boolean) ← НОВАЯ КОЛОНКА
```

---

## 🚀 Дополнительно: Обновление существующих пользователей (опционально)

Если хотите автоматически подписать существующих пользователей:

```sql
-- Подписать всех существующих пользователей
UPDATE profiles 
SET newsletter_enabled = true 
WHERE created_at < NOW();
```

Или оставить по умолчанию (false) - пользователи сами включат в профиле.

---

## ❗ Важно

После выполнения миграции **обязательно перезапустите dev server**:

```bash
# Остановите (Ctrl+C)
# Запустите заново
npm run dev
```

---

## 📝 Файл миграции

Миграция сохранена в:
```
supabase/migrations/20241124_add_newsletter_enabled.sql
```

Если используете Vercel или production, не забудьте выполнить миграцию и там!

---

## ✅ После выполнения миграции будет работать:

- ✅ Страница профиля с чекбоксом подписки
- ✅ Отписка через `/unsubscribe`
- ✅ Email-рассылки только подписанным пользователям
- ✅ Управление подпиской в профиле

---

**Выполните миграцию и всё заработает! 🎉**
