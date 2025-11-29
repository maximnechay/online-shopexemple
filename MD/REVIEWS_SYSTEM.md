# Система отзывов и рейтингов

Полноценная система для управления отзывами клиентов с модерацией.

## Возможности

### Для клиентов:
- ✅ Оставление отзывов с рейтингом (1-5 звезд)
- ✅ Заголовок и текст отзыва
- ✅ Метка "Verifizierter Kauf" для подтвержденных покупок
- ✅ Просмотр всех одобренных отзывов

### Для администраторов:
- ✅ Модерация отзывов (одобрить/отклонить)
- ✅ Удаление отзывов
- ✅ Фильтрация по статусу
- ✅ Автоматическое обновление рейтинга продукта

## База данных

### Таблица `reviews`
```sql
- id: UUID (primary key)
- product_id: UUID (ссылка на products)
- user_id: UUID (ссылка на auth.users)
- order_id: UUID (ссылка на orders, опционально)
- rating: INTEGER (1-5)
- title: TEXT (опционально)
- comment: TEXT (опционально)
- customer_name: TEXT
- customer_email: TEXT
- verified_purchase: BOOLEAN
- status: TEXT (pending/approved/rejected)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### Добавлено в таблицу `products`
```sql
- rating: NUMERIC(3,2) - средний рейтинг
- reviews_count: INTEGER - количество отзывов
```

## API Endpoints

### Клиентские endpoints

#### GET /api/reviews?product_id={id}
Получить все одобренные отзывы для продукта
```typescript
Response: {
    reviews: Review[]
}
```

#### POST /api/reviews
Создать новый отзыв (требуется авторизация)
```typescript
Request: {
    product_id: string,
    rating: number (1-5),
    title?: string,
    comment?: string,
    order_id?: string  // для verified purchase
}

Response: {
    review: Review,
    message: string
}
```

### Админ endpoints

#### GET /api/admin/reviews?status={all|pending|approved|rejected}
Получить все отзывы для модерации

#### PATCH /api/admin/reviews/[id]
Обновить статус отзыва
```typescript
Request: {
    status: 'approved' | 'rejected'
}
```

#### DELETE /api/admin/reviews/[id]
Удалить отзыв

## Компоненты

### ProductReviews
Отображает отзывы на странице продукта
```tsx
<ProductReviews 
    productId={product.id}
    productName={product.name}
    userHasPurchased={true}  // опционально
    orderId="..."            // опционально
/>
```

### ReviewForm
Форма для создания отзыва
```tsx
<ReviewForm
    productId={productId}
    productName={productName}
    orderId={orderId}
    onSuccess={() => {}}
    onCancel={() => {}}
/>
```

## Workflow

### 1. Клиент оставляет отзыв
1. Пользователь должен быть авторизован
2. Заполняет форму с рейтингом, заголовком и комментарием
3. Отзыв создается со статусом `pending`
4. Если order_id передан и найден - устанавливается `verified_purchase = true`

### 2. Модерация отзыва
1. Администратор видит отзыв на странице `/admin/reviews`
2. Может одобрить (status = 'approved') или отклонить (status = 'rejected')
3. Может удалить отзыв полностью

### 3. Обновление рейтинга продукта
Автоматически через триггер базы данных:
- При одобрении/отклонении/удалении отзыва
- Пересчитывается средний рейтинг
- Обновляется количество отзывов
- Только одобренные отзывы учитываются в рейтинге

## Безопасность (RLS Policies)

### Чтение отзывов
- ✅ Все могут читать одобренные отзывы (status = 'approved')

### Создание отзывов
- ✅ Только авторизованные пользователи
- ✅ user_id должен соответствовать текущему пользователю

### Обновление отзывов
- ✅ Пользователи могут редактировать только свои pending отзывы
- ✅ Админы используют service role для модерации

### Удаление отзывов
- ✅ Пользователи могут удалять свои отзывы
- ✅ Админы используют service role

## Установка

1. Выполните миграцию:
```bash
supabase db push
```
или примените SQL из `supabase/migrations/create_reviews_system.sql`

2. Компоненты уже интегрированы на страницу продукта

3. Доступ к модерации: `/admin/reviews`

## Будущие улучшения

- [ ] Добавить возможность прикреплять фото к отзывам
- [ ] Система голосования "Полезно" для отзывов
- [ ] Email уведомления при одобрении отзыва
- [ ] Возможность ответа администратора на отзыв
- [ ] Фильтрация отзывов по рейтингу на странице продукта
- [ ] Сортировка отзывов (по дате, по полезности)
