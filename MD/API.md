# 🔌 API Documentation

Полная документация всех API endpoints проекта.

---

## 📋 Содержание

- [Товары (Products)](#товары-products)
- [Заказы (Orders)](#заказы-orders)
- [Оплата PayPal](#оплата-paypal)
- [Оплата Stripe](#оплата-stripe)
- [Webhooks](#webhooks)
- [Админ панель](#админ-панель)
- [Настройки магазина](#настройки-магазина)

---

## 🛍️ Товары (Products)

### GET `/api/products`

Получение списка товаров с фильтрацией.

**Query Parameters:**
- `category` (optional) - Фильтр по категории
- `search` (optional) - Поиск по названию

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Product Name",
    "slug": "product-name",
    "description": "Product description",
    "price": 29.99,
    "compareAtPrice": 39.99,
    "images": ["url1", "url2"],
    "category": "category-name",
    "brand": "Brand Name",
    "inStock": true,
    "stockQuantity": 10,
    "tags": ["tag1", "tag2"],
    "rating": 4.5,
    "reviewCount": 25,
    "size": "50ml",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

**Example:**
```javascript
// Все товары
fetch('/api/products')

// Фильтр по категории
fetch('/api/products?category=skincare')

// Поиск
fetch('/api/products?search=cream')
```

---

### GET `/api/products/[slug]`

Получение одного товара по slug.

**Response:**
```json
{
  "id": "uuid",
  "name": "Product Name",
  "slug": "product-name",
  "description": "Detailed description...",
  "price": 29.99,
  "compareAtPrice": 39.99,
  "images": ["url1", "url2", "url3"],
  "category": "skincare",
  "brand": "Luxury Brand",
  "inStock": true,
  "stockQuantity": 15,
  "tags": ["hydrating", "anti-age"],
  "rating": 4.8,
  "reviewCount": 42,
  "attributes": {
    "volume": "50ml",
    "ingredients": ["water", "glycerin"]
  },
  "size": "50ml"
}
```

**Error Responses:**
- `404` - Товар не найден

---

## 📦 Заказы (Orders)

### POST `/api/checkout`

Создание нового заказа.

**Request Body:**
```json
{
  "items": [
    {
      "id": "product-uuid",
      "name": "Product Name",
      "price": 29.99,
      "quantity": 2,
      "image": "image-url"
    }
  ],
  "customerInfo": {
    "email": "customer@example.com",
    "phone": "+49123456789",
    "firstName": "John",
    "lastName": "Doe"
  },
  "shippingAddress": {
    "street": "Main Street",
    "houseNumber": "123",
    "postalCode": "12345",
    "city": "Berlin"
  },
  "deliveryMethod": "standard",
  "paymentMethod": "paypal",
  "notes": "Optional delivery notes"
}
```

**Response:**
```json
{
  "orderId": "uuid",
  "orderNumber": "ORD-2024-001",
  "total": 69.97,
  "subtotal": 59.98,
  "shipping": 9.99,
  "status": "pending",
  "paymentStatus": "pending",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**
- `400` - Неверные данные
- `500` - Ошибка сервера

---

### GET `/api/orders`

Получение заказов текущего пользователя (требуется аутентификация).

**Headers:**
```
Authorization: Bearer {supabase-jwt-token}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "orderNumber": "ORD-2024-001",
    "total": 69.97,
    "status": "processing",
    "paymentStatus": "paid",
    "paymentMethod": "paypal",
    "createdAt": "2024-01-01T00:00:00Z",
    "items": [
      {
        "productName": "Product Name",
        "productPrice": 29.99,
        "quantity": 2,
        "total": 59.98
      }
    ]
  }
]
```

---

## 💳 Оплата PayPal

### POST `/api/paypal/create-order`

Создание PayPal заказа.

**Request Body:**
```json
{
  "supabaseOrderId": "uuid"
}
```

**Response:**
```json
{
  "id": "paypal-order-id"
}
```

**Процесс:**
1. Система получает данные заказа из БД (безопасно)
2. Создает PayPal заказ с корректной суммой
3. Связывает PayPal order ID с заказом в БД
4. Возвращает PayPal ID для фронтенда

---

### POST `/api/paypal/capture-order`

Подтверждение PayPal платежа.

**Request Body:**
```json
{
  "orderID": "paypal-order-id",
  "supabaseOrderId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "uuid",
  "paypalOrderId": "paypal-order-id",
  "status": "COMPLETED"
}
```

**Действия:**
1. Захватывает платеж в PayPal
2. Обновляет статус заказа в БД
3. Помечает payment_status как 'paid'

**Error Responses:**
- `400` - Отсутствуют обязательные поля
- `500` - Ошибка PayPal API

---

## 💰 Оплата Stripe

### POST `/api/stripe/create-payment-intent`

Создание Stripe Payment Intent.

**Request Body:**
```json
{
  "supabaseOrderId": "uuid"
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

**Использование:**
```javascript
const { clientSecret } = await fetch('/api/stripe/create-payment-intent', {
  method: 'POST',
  body: JSON.stringify({ supabaseOrderId })
}).then(r => r.json());

// Используется на фронтенде с Stripe Elements
const { error } = await stripe.confirmPayment({
  elements,
  clientSecret,
  confirmParams: {
    return_url: 'https://yoursite.com/order-confirmation'
  }
});
```

---

## 🔔 Webhooks

### POST `/api/webhooks/paypal`

Обработка PayPal webhooks.

**Headers:**
```
paypal-transmission-id: xxx
paypal-transmission-time: xxx
paypal-cert-url: xxx
paypal-auth-algo: xxx
paypal-transmission-sig: xxx
```

**События:**
- `CHECKOUT.ORDER.APPROVED` - Заказ одобрен
- `PAYMENT.CAPTURE.COMPLETED` - Платеж завершен
- `PAYMENT.CAPTURE.DENIED` - Платеж отклонен

**Действия:**
- Верифицирует подпись PayPal
- Обновляет статус заказа
- Логирует события

---

### POST `/api/webhooks/stripe`

Обработка Stripe webhooks.

**Headers:**
```
stripe-signature: xxx
```

**События:**
- `payment_intent.succeeded` - Платеж успешен
- `payment_intent.payment_failed` - Платеж не удался

**Действия:**
- Верифицирует подпись Stripe
- Обновляет payment_status заказа
- Обрабатывает edge cases

---

## 🔐 Админ панель

Все admin endpoints требуют роль `admin` в профиле.

### GET `/api/admin/products`

Получение всех товаров (для админ панели).

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Product Name",
    "price": 29.99,
    "category": "skincare",
    "inStock": true,
    "stockQuantity": 10,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

---

### POST `/api/admin/products`

Создание нового товара.

**Request Body:**
```json
{
  "name": "New Product",
  "slug": "new-product",
  "description": "Description",
  "price": 29.99,
  "compareAtPrice": 39.99,
  "category": "skincare",
  "brand": "Brand Name",
  "images": ["url1", "url2"],
  "inStock": true,
  "stockQuantity": 10,
  "tags": ["new", "popular"],
  "size": "50ml"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "New Product",
  "slug": "new-product",
  ...
}
```

---

### PATCH `/api/admin/products/[id]`

Обновление товара.

**Request Body:** (частичное обновление)
```json
{
  "price": 24.99,
  "inStock": false
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Product Name",
  "price": 24.99,
  "inStock": false,
  ...
}
```

---

### DELETE `/api/admin/products/[id]`

Удаление товара.

**Response:**
```json
{
  "message": "Product deleted successfully"
}
```

---

### GET `/api/admin/orders`

Получение всех заказов.

**Query Parameters:**
- `status` (optional) - Фильтр по статусу
- `payment_status` (optional) - Фильтр по статусу оплаты
- `limit` (optional) - Количество результатов (default: 50)
- `offset` (optional) - Смещение для пагинации

**Response:**
```json
{
  "orders": [
    {
      "id": "uuid",
      "orderNumber": "ORD-2024-001",
      "email": "customer@example.com",
      "total": 69.97,
      "status": "processing",
      "paymentStatus": "paid",
      "paymentMethod": "paypal",
      "createdAt": "2024-01-01T00:00:00Z",
      "items": [...]
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

---

### PATCH `/api/admin/orders/[id]`

Обновление статуса заказа.

**Request Body:**
```json
{
  "status": "shipped",
  "notes": "Tracking number: 123456"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "shipped",
  "updatedAt": "2024-01-01T12:00:00Z"
}
```

---

### GET `/api/admin/stats`

Статистика магазина.

**Response:**
```json
{
  "totalOrders": 150,
  "totalRevenue": 15432.50,
  "pendingOrders": 5,
  "completedOrders": 140,
  "averageOrderValue": 102.88,
  "topProducts": [
    {
      "name": "Product Name",
      "timesSold": 45,
      "revenue": 1347.55
    }
  ],
  "recentOrders": [...],
  "salesByMonth": {
    "2024-01": 5234.20,
    "2024-02": 6890.45
  }
}
```

---

## ⚙️ Настройки магазина

### GET `/api/admin/settings`

Получение настроек магазина.

**Response:**
```json
{
  "shopName": "Beauty Salon Shop",
  "shopSubtitle": "Premium Beauty Products",
  "supportEmail": "support@example.com",
  "supportPhone": "+49 123 456789",
  "addressLine": "Main Street 123",
  "postalCode": "12345",
  "city": "Berlin",
  "country": "Deutschland",
  "defaultCurrency": "EUR",
  "freeShippingFrom": 50.00,
  "taxRate": 19.00,
  "homepageHeroText": "Discover luxury beauty products"
}
```

---

### PATCH `/api/admin/settings`

Обновление настроек магазина.

**Request Body:** (частичное обновление)
```json
{
  "shopName": "New Shop Name",
  "freeShippingFrom": 60.00,
  "taxRate": 16.00
}
```

**Response:**
```json
{
  "shopName": "New Shop Name",
  "freeShippingFrom": 60.00,
  "taxRate": 16.00,
  ...
}
```

---

## 🔒 Аутентификация

### Middleware защита

Следующие routes защищены middleware:

**Требуют аутентификации:**
- `/profile/*` - Профиль пользователя
- `/auth/login` (редирект если залогинен)
- `/auth/register` (редирект если залогинен)

**Требуют admin роль:**
- `/admin/*` - Админ панель
- `/api/admin/*` - Admin API endpoints

### Headers для аутентифицированных запросов

```javascript
const supabase = createClient();
const { data: { session } } = await supabase.auth.getSession();

fetch('/api/orders', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
});
```

---

## 🚨 Коды ошибок

| Код | Описание |
|-----|----------|
| `400` | Неверный запрос (Bad Request) |
| `401` | Не авторизован (Unauthorized) |
| `403` | Доступ запрещен (Forbidden) |
| `404` | Не найдено (Not Found) |
| `500` | Внутренняя ошибка сервера |

**Формат ошибки:**
```json
{
  "error": "Error message",
  "details": "Additional details (опционально)"
}
```

---

## 📝 Rate Limiting

В production рекомендуется добавить rate limiting:

```javascript
// Пример с upstash/ratelimit
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

// В API route
const { success } = await ratelimit.limit(ip);
if (!success) {
  return new Response('Too many requests', { status: 429 });
}
```

---

## 🔗 Связанные документы

- [Database Schema](./DATABASE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Security Guide](./SECURITY.md)