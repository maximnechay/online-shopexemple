// lib/utils/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

/**
 * Полная санитизация HTML - удаляет все теги
 * Использовать для: заголовков, имен, названий
 */
export function sanitizeHTML(dirty: string): string {
    if (!dirty) return '';

    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: [], // Не разрешаем никакие теги
        ALLOWED_ATTR: [], // Не разрешаем никакие атрибуты
        KEEP_CONTENT: true, // Сохраняем текстовое содержимое
    });
}

/**
 * Базовая санитизация для отзывов
 * Разрешает только безопасное форматирование текста
 */
export function sanitizeReview(review: string): string {
    if (!review) return '';

    return DOMPurify.sanitize(review, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
    });
}

/**
 * Санитизация для описаний товаров (админ может добавить форматирование)
 * Более либеральная, но все еще безопасная
 */
export function sanitizeProductDescription(description: string): string {
    if (!description) return '';

    return DOMPurify.sanitize(description, {
        ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'strong', 'em', 'ul', 'ol', 'li', 'h3', 'h4'],
        KEEP_CONTENT: true,
    });
}

/**
 * Клиентская версия санитизации (для компонентов)
 * Проверяет наличие window перед использованием
 */
export function sanitizeHTMLClient(dirty: string): string {
    if (typeof window === 'undefined') {
        return sanitizeHTML(dirty);
    }

    const clientPurify = DOMPurify(window);
    return clientPurify.sanitize(dirty, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
    });
}

export function sanitizeReviewClient(review: string): string {
    if (typeof window === 'undefined') {
        return sanitizeReview(review);
    }

    const clientPurify = DOMPurify(window);
    return clientPurify.sanitize(review, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
    });
}
