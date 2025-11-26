# Payment Settings Migration

## Описание

Добавляет таблицу `payment_settings` для управления настройками платежей в административной панели.

## Миграция

Выполните SQL-скрипт в Supabase Dashboard:

```sql
-- Create payment_settings table
CREATE TABLE IF NOT EXISTS payment_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    mode TEXT DEFAULT 'test' CHECK (mode IN ('test', 'live')),
    currency TEXT DEFAULT 'EUR',
    vat_rate NUMERIC DEFAULT 19,
    stripe_enabled BOOLEAN DEFAULT true,
    paypal_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_row_check CHECK (id = 1)
);

-- Insert default settings
INSERT INTO payment_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read for authenticated users
CREATE POLICY "Allow read payment_settings for authenticated users"
    ON payment_settings
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow update for authenticated users (admin only in practice)
CREATE POLICY "Allow update payment_settings for authenticated users"
    ON payment_settings
    FOR UPDATE
    TO authenticated
    USING (true);

-- Add comment
COMMENT ON TABLE payment_settings IS 'Payment system configuration - single row table';
```

## Структура таблицы

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `id` | INTEGER | 1 | Первичный ключ (всегда 1) |
| `mode` | TEXT | 'test' | Режим работы: 'test' или 'live' |
| `currency` | TEXT | 'EUR' | Валюта платежей |
| `vat_rate` | NUMERIC | 19 | Ставка НДС (%) |
| `stripe_enabled` | BOOLEAN | true | Включить Stripe |
| `paypal_enabled` | BOOLEAN | false | Включить PayPal |
| `created_at` | TIMESTAMPTZ | NOW() | Дата создания |
| `updated_at` | TIMESTAMPTZ | NOW() | Дата обновления |

## API Endpoints

### GET /api/admin/settings/payments
Получить текущие настройки платежей.

**Response:**
```json
{
  "success": true,
  "settings": {
    "id": 1,
    "mode": "test",
    "currency": "EUR",
    "vat_rate": 19,
    "stripe_enabled": true,
    "paypal_enabled": false,
    "created_at": "2024-11-24T10:00:00Z",
    "updated_at": "2024-11-24T10:00:00Z"
  }
}
```

### PUT /api/admin/settings/payments
Обновить настройки платежей.

**Request Body:**
```json
{
  "mode": "live",
  "currency": "EUR",
  "vat_rate": 19,
  "stripe_enabled": true,
  "paypal_enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "settings": {
    "id": 1,
    "mode": "live",
    "currency": "EUR",
    "vat_rate": 19,
    "stripe_enabled": true,
    "paypal_enabled": true,
    "created_at": "2024-11-24T10:00:00Z",
    "updated_at": "2024-11-24T11:00:00Z"
  }
}
```

## Админ-панель

Новая страница: `/admin/settings/payments`

### Функции:
- Выбор режима (Test/Live)
- Выбор валюты (EUR, USD, GBP, CHF)
- Настройка ставки НДС
- Включение/выключение Stripe
- Включение/выключение PayPal
- Отображение времени последнего обновления

### Доступ:
Ссылка добавлена на странице `/admin/settings` в разделе "Weitere Einstellungen".

## Безопасность

- **RLS включен**: Только аутентифицированные пользователи могут читать/обновлять
- **Проверка данных**: Валидация mode ('test'/'live') и vat_rate (0-100)
- **Single row**: Таблица содержит только одну запись (id=1)

## Использование в коде

**Важно**: API-ключи хранятся в `.env`, **НЕ** в базе данных!

### Добавьте в .env.local:

```env
# Stripe Test Keys
STRIPE_SECRET_KEY_TEST=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_...

# Stripe Live Keys  
STRIPE_SECRET_KEY_LIVE=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_...

# PayPal Test Keys (Sandbox)
NEXT_PUBLIC_PAYPAL_CLIENT_ID_TEST=...
PAYPAL_CLIENT_SECRET_TEST=...

# PayPal Live Keys (Production)
NEXT_PUBLIC_PAYPAL_CLIENT_ID_LIVE=...
PAYPAL_CLIENT_SECRET_LIVE=...
```

### Пример использования:

```typescript
import Stripe from 'stripe';
import { getPaymentSettings, getStripeSecretKey } from '@/lib/paymentSettings';

export async function createStripePaymentIntent(amount: number) {
  // Получаем настройки из БД
  const settings = await getPaymentSettings();
  
  // Получаем правильный ключ (test или live) из env
  const secretKey = await getStripeSecretKey();
  
  // Инициализируем Stripe
  const stripe = new Stripe(secretKey, {
    apiVersion: '2024-06-20',
  });
  
  // Создаем платеж с валютой из настроек
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: settings.currency.toLowerCase(), // 'eur'
    metadata: {
      mode: settings.mode, // 'test' или 'live'
    },
  });
  
  return paymentIntent;
}
```

### PayPal пример:

```typescript
import { 
    getPaymentSettings, 
    getPayPalClientId, 
    getPayPalClientSecret,
    getPayPalApiUrl 
} from '@/lib/paymentSettings';

export async function createPayPalOrder(amount: number) {
  const settings = await getPaymentSettings();
  const clientId = await getPayPalClientId();
  const clientSecret = await getPayPalClientSecret();
  const apiUrl = await getPayPalApiUrl(); // sandbox или production
  
  // Создание PayPal заказа...
}
```

**Подробные примеры**: См. `PAYMENT_USAGE_GUIDE.md`

## Миграция выполнена

После выполнения SQL-скрипта в Supabase:
1. ✅ Таблица `payment_settings` создана
2. ✅ Запись по умолчанию вставлена
3. ✅ RLS-политики настроены
4. ✅ API endpoints работают
5. ✅ Админ-панель доступна

## Следующие шаги

После выполнения миграции настройки платежей будут доступны в админ-панели по адресу:
`/admin/settings/payments`
