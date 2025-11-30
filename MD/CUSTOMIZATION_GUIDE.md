# 🎨 Руководство по кастомизации

## Адаптация шаблона под ваш бренд

---

## ⏱️ Быстрая кастомизация (30 минут)

### Шаг 1: Замените логотип и иконки (5 мин)

```bash
# Подготовьте файлы:
public/
  ├── logo.png (512x512)
  ├── favicon.ico (32x32)
  ├── og-image.jpg (1200x630)
  └── ... (остальные иконки)
```

**Инструменты**:
- Favicon: https://realfavicongenerator.net/
- OG Image: https://www.canva.com/ (шаблон 1200x630)

### Шаг 2: Измените название бренда (10 мин)

#### В Header (`components/layout/Header.tsx`):
```tsx
// Найдите и замените:
<span className="font-serif italic font-semibold">
  Élégance  {/* ← ИЗМЕНИТЕ ЭТО */}
</span>
<span className="text-[10px]...">
  Beauty & Cosmetics  {/* ← И ЭТО */}
</span>
```

#### В Footer (`components/layout/Footer.tsx`):
```tsx
// Найдите и замените:
Élégance → Ваш бренд
Beauty & Cosmetics → Ваша ниша
```

### Шаг 3: Обновите контактную информацию (5 мин)

#### Footer контакты:
```tsx
// components/layout/Footer.tsx (строка ~180)
<Phone /> +49 (123) 456-7890  {/* ← Ваш телефон */}
<Mail /> info@elegance-beauty.de  {/* ← Ваш email */}
<MapPin /> Berlin, Musterstraße 10  {/* ← Ваш адрес */}
<Clock /> Mo-So: 9:00 — 21:00  {/* ← Часы работы */}
```

### Шаг 4: Настройте SEO (10 мин)

#### Основные мета-теги (`app/layout.tsx`):
```tsx
// Строка ~26
const siteName = 'Ваш бренд';
const siteDescription = 'Ваше описание компании...';
const siteUrl = 'https://ваш-домен.de';
```

#### Структурированные данные (`components/seo/StructuredData.tsx`):
```tsx
// Строка 6-10
name: 'Ваша компания',
description: 'Ваше описание',
address: {
  streetAddress: 'Ваш адрес',
  addressLocality: 'Ваш город',
  postalCode: '12345',
},
```

#### Социальные сети (`components/seo/StructuredData.tsx`):
```tsx
// Строка 31-36
sameAs: [
  'https://www.instagram.com/ваш_аккаунт',
  'https://www.facebook.com/ваша_страница',
  'https://www.youtube.com/@ваш_канал',
],
```

---

## 🎨 Продвинутая кастомизация

### Цветовая схема (брендинг)

#### Tailwind config (`tailwind.config.ts`):
```ts
theme: {
  extend: {
    colors: {
      // Основные цвета бренда
      primary: {
        DEFAULT: '#1f2937',  // ← Ваш основной цвет
        light: '#374151',
        dark: '#111827',
      },
      // Акцентный цвет
      accent: {
        DEFAULT: '#10b981',  // ← Ваш акцент
        hover: '#059669',
      },
    },
  },
}
```

**Где применить**:
- Кнопки: `bg-primary hover:bg-primary-dark`
- Ссылки: `text-accent hover:text-accent-hover`
- Badges: `bg-accent text-white`

### Типографика

#### Изменить шрифты (`app/layout.tsx`):
```tsx
// Строка 12-20
import { YourFont, YourBodyFont } from 'next/font/google';

const headingFont = YourFont({
  subsets: ['latin'],
  variable: '--font-heading',
});

const bodyFont = YourBodyFont({
  subsets: ['latin'],
  variable: '--font-body',
});
```

**Популярные комбинации**:
- Элегантность: Playfair Display + Inter
- Модерн: Montserrat + Open Sans
- Минимализм: Helvetica + Arial
- Роскошь: Cormorant + Lato

### Стиль кнопок

#### Глобальные стили (`app/globals.css`):
```css
/* Добавьте в конец файла */
.btn-primary {
  @apply px-6 py-3 bg-primary text-white rounded-full 
         font-medium hover:bg-primary-dark 
         transition-all duration-300 shadow-lg 
         hover:shadow-xl hover:scale-105;
}

.btn-secondary {
  @apply px-6 py-3 border-2 border-primary text-primary 
         rounded-full font-medium hover:bg-primary 
         hover:text-white transition-all duration-300;
}
```

---

## 🛒 Настройка каталога

### Добавить категории

1. **Админ-панель** → Категории → Создать
2. **Или SQL** (`supabase/migrations/`):
```sql
INSERT INTO categories (name, slug, description, image) VALUES
('Уход за лицом', 'face-care', 'Крема, сыворотки', '/cat-face.jpg'),
('Макияж', 'makeup', 'Косметика для макияжа', '/cat-makeup.jpg'),
('Волосы', 'hair', 'Шампуни, маски', '/cat-hair.jpg');
```

### Настроить фильтры

#### Доступные фильтры (`app/catalog/page.tsx`):
```tsx
// Добавьте новые фильтры
const filters = {
  category: ['face', 'makeup', 'hair'],
  brand: ['La Roche', 'Vichy', 'Bioderma'],
  priceRange: ['0-25', '25-50', '50-100', '100+'],
  inStock: [true, false],
  // Добавьте свои:
  skinType: ['dry', 'oily', 'combination'],
  concern: ['anti-aging', 'acne', 'hydration'],
};
```

---

## 💳 Настройка платежей

### PayPal

1. **Создайте бизнес аккаунт**: https://www.paypal.com/businessaccount
2. **Получите Client ID**: Developer Dashboard → My Apps
3. **Добавьте в `.env.local`**:
```env
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_secret
```

### Stripe (опционально)

1. **Создайте аккаунт**: https://stripe.com
2. **Получите ключи**: Dashboard → Developers → API Keys
3. **Добавьте в `.env.local`**:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

4. **Раскомментируйте код** в `components/checkout/PaymentMethods.tsx`

---

## 📧 Email настройка

### Newsletter (опционально)

#### Mailchimp:
```env
MAILCHIMP_API_KEY=your_key
MAILCHIMP_AUDIENCE_ID=your_audience_id
```

#### SendGrid:
```env
SENDGRID_API_KEY=your_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### Email уведомления

Обновите шаблоны в `lib/email/templates/`:
```tsx
// orderConfirmation.tsx
export const OrderConfirmation = ({ order }) => (
  <div>
    <h1>Спасибо за заказ в {ВАШБРЕНД}!</h1>
    {/* ... */}
  </div>
);
```

---

## 🌍 Multi-language (опционально)

### Добавить английскую версию:

1. **Установите i18n**:
```bash
npm install next-intl
```

2. **Создайте переводы** (`messages/en.json`):
```json
{
  "nav": {
    "home": "Home",
    "catalog": "Catalog",
    "about": "About"
  },
  "product": {
    "addToCart": "Add to Cart",
    "outOfStock": "Out of Stock"
  }
}
```

3. **Используйте в компонентах**:
```tsx
import { useTranslations } from 'next-intl';

const t = useTranslations('product');
<button>{t('addToCart')}</button>
```

---

## 📊 Analytics

### Google Analytics

Уже настроен! Просто добавьте ID:
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Facebook Pixel

```tsx
// app/layout.tsx
<Script id="facebook-pixel">
  {`
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){...};
    fbq('init', 'YOUR_PIXEL_ID');
  `}
</Script>
```

---

## 🎨 Примеры брендинга

### Пример 1: Минималистичный
```ts
colors: {
  primary: '#000000',
  accent: '#ffffff',
}
fonts: ['Helvetica Neue', 'Arial']
buttons: rounded-none (квадратные)
```

### Пример 2: Премиум
```ts
colors: {
  primary: '#1a1a1a',
  accent: '#d4af37', // золото
}
fonts: ['Cormorant Garamond', 'Lato']
buttons: rounded-full + shadow-2xl
```

### Пример 3: Яркий
```ts
colors: {
  primary: '#ff6b6b',
  accent: '#4ecdc4',
}
fonts: ['Poppins', 'Inter']
buttons: rounded-xl + gradient backgrounds
```

---

## ✅ Чеклист перед запуском

### Контент
- [ ] Все тексты переведены на ваш язык
- [ ] Логотип и фавикон заменены
- [ ] Контактная информация обновлена
- [ ] Юридические страницы заполнены (AGB, Impressum)

### SEO
- [ ] Мета-теги обновлены
- [ ] og-image.jpg создан
- [ ] Sitemap.xml содержит ваш домен
- [ ] Google Analytics подключен

### Функционал
- [ ] Платежи настроены и протестированы
- [ ] Email уведомления работают
- [ ] Тестовый заказ успешно прошел
- [ ] Админка доступна и работает

### Производительность
- [ ] PageSpeed > 90
- [ ] Все изображения оптимизированы
- [ ] Нет console.error в production

---

## 🆘 Нужна помощь?

### Самостоятельно:
- Документация: `README.md`
- API: `API_DOCUMENTATION.md`
- FAQ: `TROUBLESHOOTING.md`

### Профессиональная помощь:
- 📧 Email: support@yoursite.com
- 💬 Telegram: @yourhandle
- 🎥 Video call: Calendly link

### Услуги:
- **Базовая кастомизация**: €300 (1-2 дня)
- **Полная адаптация**: €800 (3-5 дней)
- **Индивидуальные фичи**: от €150/час

---

<div align="center">

Удачи с вашим магазином! 🚀✨

</div>
