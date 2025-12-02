# 🎯 БЫСТРЫЕ КОМАНДЫ

## Security Fixes

### Применить защиту ко всем admin endpoints
```bash
node apply-admin-security.js
npm run type-check
```

### Сгенерировать CSRF secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Проверка безопасности
```bash
# Type check
npm run type-check

# Lint check
npm run lint

# Build check
npm run build
```

## Тестирование

### Запустить dev сервер
```bash
npm run dev
```

### Тест Admin Auth
```bash
# Без авторизации - должно вернуть 401
curl http://localhost:3000/api/admin/products

# Создать админа в Supabase:
# 1. Зарегистрировать пользователя
# 2. В profiles таблице установить role='admin'
```

### Тест CSRF (после добавления в middleware)
```bash
# Без токена - должно вернуть 403
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Тест XSS Protection
```bash
# Попытка XSS в отзыве
curl -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "product_id": "UUID",
    "rating": 5,
    "title": "Test <script>alert(1)</script>",
    "comment": "<img src=x onerror=alert(1)>"
  }'

# Проверить в базе - script теги должны быть удалены
```

### Тест Test Email Protection
```bash
# В production должно вернуть 404
curl http://your-domain.com/api/test-email
```

## Checklist перед commit

- [ ] `npm run type-check` - без ошибок
- [ ] `npm run lint` - без ошибок
- [ ] `npm run build` - успешно
- [ ] Все admin endpoints защищены
- [ ] CSRF добавлен в middleware
- [ ] Test email защищен
- [ ] .env.local настроен (CSRF_SECRET)

## Deploy

### Vercel
```bash
# Push to main
git add .
git commit -m "Security fixes: Admin auth, CSRF, XSS protection"
git push origin main

# Vercel автоматически задеплоит
```

### Environment Variables в Vercel
Добавить через Dashboard:
```
CSRF_SECRET=your-generated-secret-here
```

## Monitoring

### Проверить логи
```bash
# Vercel logs
vercel logs

# Local
npm run dev
# Смотреть console.log
```

### Sentry
- Уже настроен ✅
- Проверить errors в dashboard

## Rollback (если что-то пошло не так)

```bash
# Откатить последний commit
git revert HEAD
git push origin main

# Или откатить к конкретному коммиту
git reset --hard COMMIT_HASH
git push origin main --force
```

---

**Важно:** Перед deploy в production обязательно протестировать все в staging!
