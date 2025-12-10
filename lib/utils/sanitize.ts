// lib/utils/sanitize.ts

/**
 * Простая санитизация без jsdom (работает в Vercel serverless)
 */

// Удаляет все HTML теги
function stripTags(str: string): string {
    if (!str) return '';
    return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .trim();
}

// Разрешает только определённые теги
function allowTags(str: string, allowedTags: string[]): string {
    if (!str) return '';

    // Удаляем опасные теги и атрибуты
    let clean = str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/javascript:/gi, '');

    // Regex для разрешённых тегов
    const tagPattern = allowedTags.join('|');
    const allowedPattern = new RegExp(`<(?!\/?(${tagPattern})(?:\\s|>|$))[^>]+>`, 'gi');

    clean = clean.replace(allowedPattern, '');

    // Удаляем атрибуты из разрешённых тегов
    const attrPattern = new RegExp(`<(${tagPattern})\\s+[^>]*>`, 'gi');
    clean = clean.replace(attrPattern, '<$1>');

    return clean.trim();
}

export function sanitizeHTML(dirty: string): string {
    return stripTags(dirty);
}

export function sanitizeReview(review: string): string {
    return allowTags(review, ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li']);
}

export function sanitizeProductDescription(description: string): string {
    return allowTags(description, ['p', 'br', 'b', 'i', 'strong', 'em', 'ul', 'ol', 'li', 'h3', 'h4']);
}

export function sanitizeHTMLClient(dirty: string): string {
    return sanitizeHTML(dirty);
}

export function sanitizeReviewClient(review: string): string {
    return sanitizeReview(review);
}