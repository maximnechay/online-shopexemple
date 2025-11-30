// lib/security/csrf.ts
import { randomBytes, createHmac } from 'crypto';

const CSRF_SECRET = process.env.CSRF_SECRET || 'default-secret-CHANGE-ME-in-production';
const TOKEN_EXPIRY = 3600000; // 1 час

// In-memory store для токенов (в production используйте Redis)
const tokens = new Map<string, number>();

/**
 * Генерация CSRF токена
 */
export function generateCSRFToken(): string {
    const token = randomBytes(32).toString('hex');
    const expiry = Date.now() + TOKEN_EXPIRY;

    // Создаем HMAC для дополнительной защиты
    const hmac = createHmac('sha256', CSRF_SECRET);
    hmac.update(token);
    const signedToken = `${token}.${hmac.digest('hex')}`;

    tokens.set(signedToken, expiry);
    return signedToken;
}

/**
 * Верификация CSRF токена
 */
export function verifyCSRFToken(token: string): boolean {
    if (!token) return false;

    // Проверяем существование токена
    const expiry = tokens.get(token);
    if (!expiry) return false;

    // Проверяем не истек ли токен
    if (Date.now() > expiry) {
        tokens.delete(token);
        return false;
    }

    // Проверяем HMAC подпись
    const [tokenPart, signature] = token.split('.');
    if (!tokenPart || !signature) return false;

    const hmac = createHmac('sha256', CSRF_SECRET);
    hmac.update(tokenPart);
    const expectedSignature = hmac.digest('hex');

    return signature === expectedSignature;
}

/**
 * Удаление использованного токена (one-time use)
 */
export function consumeCSRFToken(token: string): boolean {
    if (!verifyCSRFToken(token)) return false;
    tokens.delete(token);
    return true;
}

/**
 * Очистка истекших токенов
 */
function cleanupExpiredTokens() {
    const now = Date.now();
    for (const [token, expiry] of tokens.entries()) {
        if (now > expiry) {
            tokens.delete(token);
        }
    }
}

// Запускаем очистку каждые 5 минут
setInterval(cleanupExpiredTokens, 300000);
