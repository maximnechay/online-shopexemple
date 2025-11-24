# Использование Payment Settings в коде

## Общая концепция

**Ключи API** хранятся в `.env` файле (не в базе данных!).  
**Настройки поведения** (mode, currency, enabled/disabled) хранятся в БД и управляются через админку.

## Environment Variables

Добавьте в `.env.local`:

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

## Использование в коде

### 1. Получить настройки платежей

```typescript
import { getPaymentSettings } from '@/lib/paymentSettings';

const settings = await getPaymentSettings();

console.log(settings.mode);             // 'test' или 'live'
console.log(settings.currency);         // 'EUR'
console.log(settings.vat_rate);         // 19
console.log(settings.stripe_enabled);   // true/false
console.log(settings.paypal_enabled);   // true/false
```

### 2. Создание Stripe Payment Intent

```typescript
import Stripe from 'stripe';
import { getPaymentSettings, getStripeSecretKey } from '@/lib/paymentSettings';

export async function createStripePaymentIntent(amount: number) {
    // Получаем настройки из БД
    const settings = await getPaymentSettings();
    
    // Получаем правильный секретный ключ (test или live)
    const secretKey = await getStripeSecretKey();
    
    // Инициализируем Stripe с правильным ключом
    const stripe = new Stripe(secretKey, {
        apiVersion: '2024-06-20',
    });
    
    // Создаем платеж с валютой из настроек
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // конвертируем в центы
        currency: settings.currency.toLowerCase(), // 'eur'
        metadata: {
            mode: settings.mode, // для логирования
        },
    });
    
    return paymentIntent;
}
```

### 3. Использование на фронтенде (Stripe Elements)

```typescript
'use client';

import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';

export default function CheckoutPage() {
    const [stripePromise, setStripePromise] = useState(null);
    
    useEffect(() => {
        // Получаем публичный ключ от сервера
        fetch('/api/payment/stripe-key')
            .then(res => res.json())
            .then(data => {
                // Сервер вернет правильный ключ на основе mode
                setStripePromise(loadStripe(data.publishableKey));
            });
    }, []);
    
    // ... остальной код Stripe Elements
}
```

### 4. API endpoint для получения публичного ключа

```typescript
// app/api/payment/stripe-key/route.ts
import { NextResponse } from 'next/server';
import { getStripePublishableKey } from '@/lib/paymentSettings';

export async function GET() {
    try {
        const publishableKey = await getStripePublishableKey();
        
        return NextResponse.json({
            publishableKey,
        });
    } catch (error) {
        console.error('Error getting Stripe key:', error);
        return NextResponse.json(
            { error: 'Failed to get Stripe configuration' },
            { status: 500 }
        );
    }
}
```

### 5. Проверка доступности платежных методов

```typescript
import { isStripeEnabled, isPayPalEnabled } from '@/lib/paymentSettings';

export async function getAvailablePaymentMethods() {
    const methods = [];
    
    if (await isStripeEnabled()) {
        methods.push({
            id: 'stripe',
            name: 'Kreditkarte',
            icon: 'CreditCard',
        });
    }
    
    if (await isPayPalEnabled()) {
        methods.push({
            id: 'paypal',
            name: 'PayPal',
            icon: 'PayPal',
        });
    }
    
    return methods;
}
```

### 6. Расчет налогов с использованием VAT rate

```typescript
import { getPaymentSettings } from '@/lib/paymentSettings';

export async function calculateOrderTotal(subtotal: number, shipping: number) {
    const settings = await getPaymentSettings();
    
    // Рассчитываем НДС
    const vatMultiplier = 1 + (settings.vat_rate / 100);
    const totalWithVat = (subtotal + shipping) * vatMultiplier;
    
    return {
        subtotal,
        shipping,
        vat: totalWithVat - (subtotal + shipping),
        vatRate: settings.vat_rate,
        total: totalWithVat,
        currency: settings.currency,
    };
}
```

## PayPal Integration

### Установка PayPal SDK

```bash
npm install @paypal/react-paypal-js
```

### 1. Создание PayPal Order (Server-side)

```typescript
// app/api/payment/paypal/create-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
    getPaymentSettings, 
    getPayPalClientId, 
    getPayPalClientSecret,
    getPayPalApiUrl 
} from '@/lib/paymentSettings';

export async function POST(request: NextRequest) {
    try {
        const { amount, orderId } = await request.json();
        
        // Получаем настройки
        const settings = await getPaymentSettings();
        
        // Проверяем что PayPal включен
        if (!settings.paypal_enabled) {
            return NextResponse.json(
                { error: 'PayPal is not enabled' },
                { status: 400 }
            );
        }
        
        // Получаем ключи
        const clientId = await getPayPalClientId();
        const clientSecret = await getPayPalClientSecret();
        const apiUrl = await getPayPalApiUrl();
        
        // Получаем access token
        const authResponse = await fetch(`${apiUrl}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            },
            body: 'grant_type=client_credentials',
        });
        
        const { access_token } = await authResponse.json();
        
        // Создаем PayPal Order
        const orderResponse = await fetch(`${apiUrl}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`,
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: settings.currency,
                        value: amount.toFixed(2),
                    },
                    reference_id: orderId,
                }],
            }),
        });
        
        const order = await orderResponse.json();
        
        console.log(`[${settings.mode.toUpperCase()}] PayPal Order created:`, order.id);
        
        return NextResponse.json({
            orderId: order.id,
            mode: settings.mode,
        });
        
    } catch (error) {
        console.error('Error creating PayPal order:', error);
        return NextResponse.json(
            { error: 'Failed to create PayPal order' },
            { status: 500 }
        );
    }
}
```

### 2. Использование PayPal на фронтенде

```typescript
'use client';

import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useEffect, useState } from 'react';

export default function PayPalCheckout({ amount, orderId }: { amount: number; orderId: string }) {
    const [clientId, setClientId] = useState('');
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        // Получаем PayPal Client ID от сервера
        fetch('/api/payment/paypal-key')
            .then(res => res.json())
            .then(data => {
                setClientId(data.clientId);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading PayPal:', error);
                setLoading(false);
            });
    }, []);
    
    if (loading) return <div>Загрузка PayPal...</div>;
    if (!clientId) return <div>PayPal не настроен</div>;
    
    return (
        <PayPalScriptProvider options={{ 
            clientId,
            currency: 'EUR',
        }}>
            <PayPalButtons
                createOrder={async () => {
                    // Создаем заказ на сервере
                    const res = await fetch('/api/payment/paypal/create-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ amount, orderId }),
                    });
                    const data = await res.json();
                    return data.orderId;
                }}
                onApprove={async (data) => {
                    // Подтверждаем платеж на сервере
                    const res = await fetch('/api/payment/paypal/capture-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            paypalOrderId: data.orderID,
                            orderId,
                        }),
                    });
                    
                    if (res.ok) {
                        window.location.href = '/order-success';
                    }
                }}
                onError={(err) => {
                    console.error('PayPal error:', err);
                    alert('Fehler bei der PayPal-Zahlung');
                }}
            />
        </PayPalScriptProvider>
    );
}
```

### 3. Подтверждение PayPal платежа (Capture)

```typescript
// app/api/payment/paypal/capture-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
    getPayPalClientId, 
    getPayPalClientSecret,
    getPayPalApiUrl 
} from '@/lib/paymentSettings';

export async function POST(request: NextRequest) {
    try {
        const { paypalOrderId, orderId } = await request.json();
        
        // Получаем ключи
        const clientId = await getPayPalClientId();
        const clientSecret = await getPayPalClientSecret();
        const apiUrl = await getPayPalApiUrl();
        
        // Получаем access token
        const authResponse = await fetch(`${apiUrl}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            },
            body: 'grant_type=client_credentials',
        });
        
        const { access_token } = await authResponse.json();
        
        // Подтверждаем платеж
        const captureResponse = await fetch(
            `${apiUrl}/v2/checkout/orders/${paypalOrderId}/capture`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`,
                },
            }
        );
        
        const captureData = await captureResponse.json();
        
        if (captureData.status === 'COMPLETED') {
            // Обновляем заказ в базе данных
            // ... ваш код для обновления статуса заказа
            
            return NextResponse.json({
                success: true,
                transactionId: captureData.id,
            });
        } else {
            throw new Error('PayPal capture failed');
        }
        
    } catch (error) {
        console.error('Error capturing PayPal order:', error);
        return NextResponse.json(
            { error: 'Failed to capture PayPal payment' },
            { status: 500 }
        );
    }
}
```

### 4. Проверка доступности платежных методов

```typescript
import { isStripeEnabled, isPayPalEnabled } from '@/lib/paymentSettings';

export async function getAvailablePaymentMethods() {
    const methods = [];
    
    if (await isStripeEnabled()) {
        methods.push({
            id: 'stripe',
            name: 'Kreditkarte',
            description: 'Visa, Mastercard, Amex',
            icon: 'CreditCard',
        });
    }
    
    if (await isPayPalEnabled()) {
        methods.push({
            id: 'paypal',
            name: 'PayPal',
            description: 'PayPal Account oder Kreditkarte',
            icon: 'PayPal',
        });
    }
    
    if (methods.length === 0) {
        throw new Error('No payment methods are enabled');
    }
    
    return methods;
}
```

## Настройка PayPal

### Получение Test ключей (Sandbox):
1. Зайдите на https://developer.paypal.com
2. Войдите в свой аккаунт
3. Dashboard → My Apps & Credentials
4. Вкладка "Sandbox"
5. Создайте новое приложение или используйте существующее
6. Скопируйте Client ID и Secret

### Получение Live ключей:
1. В том же разделе перейдите на вкладку "Live"
2. Создайте приложение для production
3. Скопируйте Live Client ID и Secret

### Тестовые аккаунты PayPal:
- Создайте Sandbox Buyer и Seller аккаунты
- Используйте их для тестирования платежей
- https://developer.paypal.com/dashboard/accounts

## Расчет налогов с использованием VAT rate

```typescript
import { getPaymentSettings } from '@/lib/paymentSettings';

export async function calculateOrderTotal(subtotal: number, shipping: number) {
    const settings = await getPaymentSettings();
    
    // Рассчитываем НДС
    const vatMultiplier = 1 + (settings.vat_rate / 100);
    const totalWithVat = (subtotal + shipping) * vatMultiplier;
    
    return {
        subtotal,
        shipping,
        vat: totalWithVat - (subtotal + shipping),
        vatRate: settings.vat_rate,
        total: totalWithVat,
        currency: settings.currency,
    };
}
```

## Workflow

1. **Админ меняет настройки** через `/admin/settings/payments`:
   - Переключает mode: `test` → `live`
   - Включает/выключает Stripe или PayPal
   - Меняет валюту или ставку НДС

2. **Изменения сохраняются** в таблицу `payment_settings`

3. **При создании платежа**:
   ```
   User checkout → API создает payment intent
                ↓
   getPaymentSettings() → mode = 'live'
                ↓
   getStripeSecretKey() → возвращает STRIPE_SECRET_KEY_LIVE
                ↓
   Stripe initialized с live ключом
                ↓
   Реальный платеж обрабатывается
   ```

## Преимущества этого подхода

✅ **Безопасность**: API ключи никогда не в БД, только в env  
✅ **Гибкость**: Можно быстро переключаться между test/live  
✅ **Централизация**: Одно место для управления всеми настройками  
✅ **Аудит**: Видно когда и что менялось (updated_at)  
✅ **Масштабируемость**: Легко добавить новые платежные методы

## Пример полного flow для создания заказа

```typescript
// app/api/orders/create-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getPaymentSettings, getStripeSecretKey } from '@/lib/paymentSettings';

export async function POST(request: NextRequest) {
    try {
        const { amount, orderId } = await request.json();
        
        // 1. Получаем настройки
        const settings = await getPaymentSettings();
        
        // 2. Проверяем что Stripe включен
        if (!settings.stripe_enabled) {
            return NextResponse.json(
                { error: 'Stripe is not enabled' },
                { status: 400 }
            );
        }
        
        // 3. Получаем правильный API ключ
        const secretKey = await getStripeSecretKey();
        
        // 4. Создаем Stripe клиент
        const stripe = new Stripe(secretKey, {
            apiVersion: '2024-06-20',
        });
        
        // 5. Создаем payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: settings.currency.toLowerCase(),
            metadata: {
                orderId,
                mode: settings.mode, // для отладки
            },
        });
        
        console.log(`[${settings.mode.toUpperCase()}] Payment Intent created:`, paymentIntent.id);
        
        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            mode: settings.mode, // чтобы фронт знал в каком режиме
        });
        
    } catch (error) {
        console.error('Error creating payment:', error);
        return NextResponse.json(
            { error: 'Failed to create payment' },
            { status: 500 }
        );
    }
}
```

## Тестирование

### Test Mode
```typescript
// В админке mode = 'test'
// Stripe использует sk_test_... ключ
// Используйте тестовые карты:
// 4242 4242 4242 4242 - успешная оплата
// 4000 0000 0000 0002 - отклоненная карта
```

### Live Mode
```typescript
// В админке mode = 'live'
// Stripe использует sk_live_... ключ
// Реальные платежи с настоящих карт
```

## Миграция с test на live

1. Убедитесь что все работает в test mode
2. Проверьте что live ключи в `.env` настроены
3. В админке `/admin/settings/payments`:
   - Измените Mode: `test` → `live`
   - Нажмите "Einstellungen speichern"
4. Все новые платежи будут использовать live ключи
5. Мониторьте логи и Stripe dashboard

## Откат на test mode

Просто измените mode обратно на `test` в админке - мгновенное переключение!
