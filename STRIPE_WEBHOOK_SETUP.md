# 🔧 Настройка Stripe Webhook для локальной разработки

## Проблема

При локальной разработке Stripe webhook не работает автоматически, потому что Stripe не может достучаться до `localhost`. Поэтому email не отправляются после оплаты через Stripe.

## Решение 1: Stripe CLI (Рекомендуется для разработки)

### Установка Stripe CLI

**Windows:**
```powershell
scoop install stripe
# или скачайте с https://github.com/stripe/stripe-cli/releases
```

**Mac:**
```bash
brew install stripe/stripe-cli/stripe
```

### Использование

1. **Авторизация:**
```bash
stripe login
```

2. **Проксирование webhooks:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Команда выдаст webhook signing secret:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

3. **Обновите `.env.local`:**
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

4. **Перезапустите сервер:**
```bash
npm run dev
```

Теперь при оплате через Stripe вы увидите в консоли:
```
📩 Stripe webhook received: checkout.session.completed
💰 Processing successful payment for order: xxx
✅ Order updated successfully
📧 Order emails sent successfully
```

## Решение 2: Отправка email на странице успеха

Email автоматически отправляются при загрузке страницы `/order-success/[orderId]` если:
- `payment_status === 'completed'`  
- `status === 'processing'`

Это работает для всех способов оплаты после того, как webhook обновит статус.

## Решение 3: Production (автоматически)

В production Stripe webhooks работают автоматически:

1. Зайдите в [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Добавьте endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Выберите события:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Скопируйте webhook signing secret
5. Добавьте в production environment variables

## Тестирование

### Проверка webhook:
```bash
# В одном терминале
npm run dev

# В другом терминале (если установлен Stripe CLI)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# В третьем терминале (тестирование)
stripe trigger checkout.session.completed
```

### Ручная проверка email:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/test-email" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"orderId":"your-order-id"}'
```

## Статусы заказов

| Метод оплаты | payment_status | status | Email отправляются? |
|---|---|---|---|
| **Stripe** (success) | completed | processing | ✅ Через webhook |
| **PayPal** (success) | completed | processing | ✅ Сразу после capture |
| **Cash** (создан) | pending | pending | ❌ Ждет подтверждения админа |
| **Cash** (подтвержден) | completed | processing | ✅ После обновления админом |

## Для оплаты наличными (Cash)

Email отправляются когда админ в админ-панели:
1. Открывает заказ
2. Подтверждает оплату (меняет `payment_status` на `completed`)
3. Меняет `status` на `processing`

Это можно сделать в админ-панели: `/admin/orders`

---

**Резюме:**
- ✅ **PayPal** - работает из коробки
- ⚠️ **Stripe** - требует Stripe CLI для локальной разработки
- ⏳ **Cash** - требует ручного подтверждения админом
