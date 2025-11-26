# SMS Система - Настройка

## Обзор

Система SMS-рассылок позволяет отправлять маркетинговые сообщения подписчикам через админ-панель. Текущая реализация включает полный UI и готова к интеграции с SMS-провайдером.

## Доступ

- **URL**: `/admin/sms`
- **Требования**: Авторизованный администратор

## Возможности

1. **Композитор сообщений**: Текстовое поле с лимитом 160 символов
2. **Счетчик символов**: Показывает оставшиеся символы
3. **Предпросмотр**: Показывает, как будет выглядеть SMS
4. **Статистика получателей**: 
   - Общее количество
   - Из профилей пользователей
   - Из подписчиков newsletter
5. **Отправка**: Кнопка с индикатором загрузки

## Получатели SMS

SMS отправляются пользователям из двух источников:

### 1. Профили пользователей
- **Таблица**: `profiles`
- **Условие**: `newsletter_enabled = true AND phone IS NOT NULL`

### 2. Подписчики newsletter (опционально)
- **Таблица**: `newsletter_subscribers`
- **Примечание**: Требует добавления поля `phone`

## Настройка SMS-провайдера

### Рекомендуемые провайдеры для Германии

#### 1. **Twilio** (Рекомендуется)
- **Сайт**: https://www.twilio.com
- **Плюсы**: Надежный, хорошая документация, поддержка 180+ стран
- **Цены**: ~€0.075 за SMS в Германии

#### 2. **SMS77**
- **Сайт**: https://www.sms77.io
- **Плюсы**: Немецкая компания, GDPR-compliant
- **Цены**: от €0.075 за SMS

#### 3. **Vonage (Nexmo)**
- **Сайт**: https://www.vonage.com
- **Плюсы**: Глобальное покрытие, API REST
- **Цены**: ~€0.08 за SMS

#### 4. **Plivo**
- **Сайт**: https://www.plivo.com
- **Плюсы**: Хорошие цены, простой API
- **Цены**: от €0.06 за SMS

---

## Интеграция с Twilio (Пример)

### Шаг 1: Регистрация

1. Зарегистрируйтесь на https://www.twilio.com/try-twilio
2. Получите бесплатный тестовый аккаунт ($15.50 кредит)
3. Купите номер телефона (можно немецкий +49)

### Шаг 2: Получение учетных данных

1. Откройте Console: https://console.twilio.com
2. Найдите:
   - **Account SID**: AC... (например, `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - **Auth Token**: ... (нажмите "Show" чтобы увидеть)
3. Phone Number: +491... (ваш купленный номер)

### Шаг 3: Установка SDK

```bash
npm install twilio
```

### Шаг 4: Переменные окружения

Добавьте в `.env.local`:

```env
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+491234567890
```

### Шаг 5: Обновление API

Откройте `app/api/admin/sms/send/route.ts` и замените секцию:

```typescript
// Раскомментируйте этот блок:
const twilio = require('twilio');
const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const results = await Promise.allSettled(
    recipients.map(async (recipient: Recipient) => {
        return await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: recipient.phone,
        });
    })
);

// Закомментируйте временную имитацию:
// const results = recipients.map((recipient: Recipient) => ({
//     status: 'fulfilled',
//     phone: recipient.phone,
//     name: recipient.name,
// }));
```

### Шаг 6: Тестирование

1. Откройте `/admin/sms`
2. Напишите тестовое сообщение
3. Нажмите "SMS senden"
4. Проверьте консоль на ошибки
5. Проверьте телефон получателя

---

## Интеграция с SMS77 (Альтернатива)

### Установка

```bash
npm install sms77
```

### Конфигурация

```env
SMS77_API_KEY=your_api_key_here
```

### Код

```typescript
import { Sms77Client } from 'sms77';

const client = new Sms77Client(process.env.SMS77_API_KEY!);

const results = await Promise.allSettled(
    recipients.map(async (recipient: Recipient) => {
        return await client.sms({
            to: recipient.phone,
            text: message,
            from: 'BeautySalon', // или ваш номер
        });
    })
);
```

---

## Формат номеров телефонов

### Рекомендуемый формат: E.164

- **Германия**: `+491234567890`
- **Австрия**: `+436641234567`
- **Швейцария**: `+41791234567`

### Валидация (опционально)

Добавьте проверку номеров:

```typescript
function isValidPhone(phone: string): boolean {
    // E.164 format: +[country code][number]
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
}
```

---

## Добавление поля телефона в Newsletter Subscribers (Опционально)

### SQL Migration

Создайте `supabase/migrations/20240125_add_phone_to_newsletter.sql`:

```sql
-- Add phone field to newsletter_subscribers
ALTER TABLE newsletter_subscribers 
ADD COLUMN phone VARCHAR(20);

-- Create index for faster queries
CREATE INDEX idx_newsletter_subscribers_phone 
ON newsletter_subscribers(phone) 
WHERE phone IS NOT NULL;
```

### Обновление формы подписки

В `app/page.tsx`, добавьте поле телефона:

```tsx
const [phone, setPhone] = useState('');

// В форме:
<input
    type="tel"
    placeholder="+49..."
    value={phone}
    onChange={(e) => setPhone(e.target.value)}
    className="px-4 py-3 border rounded-lg"
/>
```

### API обновление

В `app/api/newsletter/route.ts`:

```typescript
const { email, phone } = await request.json();

const { error } = await supabase
    .from('newsletter_subscribers')
    .insert([{ email, phone }]);
```

---

## Юридические требования (GDPR)

### Согласие пользователя

Перед отправкой SMS убедитесь:

1. ✅ Пользователь явно согласился на получение SMS
2. ✅ Есть чекбокс "Я согласен получать SMS-уведомления"
3. ✅ Ссылка на политику конфиденциальности
4. ✅ Возможность отписаться в любой момент

### Текст согласия

```tsx
<label className="flex items-center gap-2">
    <input type="checkbox" required />
    <span className="text-sm text-gray-600">
        Ich stimme zu, SMS-Benachrichtigungen zu erhalten.{' '}
        <Link href="/datenschutz" className="underline">
            Datenschutzerklärung
        </Link>
    </span>
</label>
```

### Отписка

Добавьте в каждое SMS:

```
"Reply STOP to unsubscribe"
```

Или добавьте короткую ссылку для отписки.

---

## Мониторинг и логирование

### Логи в консоли

Текущий код логирует:
- ✅ Количество получателей
- ✅ Успешные/неуспешные отправки
- ✅ Детали по каждому получателю

### Расширенное логирование

Сохраняйте историю отправок в БД:

```sql
CREATE TABLE sms_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message TEXT NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    recipient_name VARCHAR(255),
    status VARCHAR(50), -- 'sent', 'failed', 'delivered'
    provider_response JSONB,
    sent_at TIMESTAMP DEFAULT NOW()
);
```

---

## Ограничения и лучшие практики

### Лимиты

- **Длина SMS**: 160 символов (проверяется в UI)
- **Частота**: Не более 1-2 SMS в неделю
- **Время отправки**: 9:00 - 20:00 (избегайте ночи)

### Контент

✅ **Хорошо**:
- "Новая коллекция! Скидка 20% до конца недели. BeautySalon"
- "Ваш заказ #1234 доставлен. Спасибо за покупку!"

❌ **Плохо**:
- Слишком длинные сообщения
- Спам (ежедневные рассылки)
- Агрессивные продажи

### Затраты

Рассчитайте бюджет:
- 100 получателей × €0.075 = €7.50 за рассылку
- 1 рассылка/неделю = €30/месяц
- 1000 получателей × €0.075 = €75 за рассылку

---

## Тестирование

### Тест с реальным номером

1. Добавьте свой номер в профиль
2. Включите `newsletter_enabled`
3. Откройте `/admin/sms`
4. Отправьте тестовое сообщение
5. Проверьте получение

### Проверка ошибок

Проверьте:
- ❌ Пустое сообщение
- ❌ Нет получателей
- ❌ Неверный формат номера
- ❌ Неверные credentials провайдера

---

## Troubleshooting

### Ошибка: "Authentication failed"

**Причина**: Неверные TWILIO_ACCOUNT_SID или TWILIO_AUTH_TOKEN

**Решение**:
1. Проверьте переменные в `.env.local`
2. Перезапустите dev server
3. Проверьте credentials в Twilio Console

### Ошибка: "Invalid phone number"

**Причина**: Неверный формат номера

**Решение**:
1. Используйте формат E.164: `+491234567890`
2. Проверьте country code
3. Удалите пробелы и дефисы

### SMS не доходит

**Причина**: Возможные причины множественны

**Решение**:
1. Проверьте логи в Twilio Console
2. Проверьте баланс аккаунта
3. Проверьте, не заблокирован ли номер
4. Убедитесь, что номер верифицирован (в trial режиме)

---

## Следующие шаги

1. ✅ Выберите SMS-провайдера
2. ✅ Зарегистрируйтесь и получите credentials
3. ✅ Добавьте переменные окружения
4. ✅ Установите SDK (`npm install twilio`)
5. ✅ Обновите `app/api/admin/sms/send/route.ts`
6. ✅ Протестируйте с вашим номером
7. ⚙️ (Опционально) Добавьте phone в newsletter_subscribers
8. ⚙️ Добавьте согласие на SMS в формы подписки
9. ⚙️ Настройте логирование отправок

---

## Полезные ссылки

- Twilio Documentation: https://www.twilio.com/docs/sms
- SMS77 API Docs: https://www.sms77.io/de/docs/gateway/http-api/
- GDPR SMS Guidelines: https://gdpr.eu/sms-marketing/
- E.164 Phone Format: https://en.wikipedia.org/wiki/E.164
