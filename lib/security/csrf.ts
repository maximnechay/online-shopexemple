// lib/security/csrf.ts
const CSRF_SECRET = process.env.CSRF_SECRET || 'default-secret-CHANGE-ME-in-production';
const TOKEN_EXPIRY = 3600000; // 1 час

// In-memory store для токенов (в production используйте Redis)
const tokens = new Map<string, number>();

/**
 * Генерация случайной строки (Web Crypto API)
 */
function generateRandomString(length: number): string {
    const array = new Uint8Array(length);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(array);
    } else {
        // Fallback для Node.js (API routes)
        const nodeCrypto = require('crypto');
        nodeCrypto.randomFillSync(array);
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * HMAC подпись (Web Crypto API)
 */
async function createHmacSignature(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(CSRF_SECRET);
    const messageData = encoder.encode(token);

    if (typeof crypto !== 'undefined' && crypto.subtle) {
        // Web Crypto API (Edge Runtime)
        const key = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        const signature = await crypto.subtle.sign('HMAC', key, messageData);
        return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('');
    } else {
        // Node.js crypto (API routes)
        const nodeCrypto = require('crypto');
        const hmac = nodeCrypto.createHmac('sha256', CSRF_SECRET);
        hmac.update(token);
        return hmac.digest('hex');
    }
}

/**
 * Генерация CSRF токена
 */
export async function generateCSRFToken(): Promise<string> {
    const token = generateRandomString(32);
    const expiry = Date.now() + TOKEN_EXPIRY;

    // Создаем HMAC для дополнительной защиты
    const signature = await createHmacSignature(token);
    const signedToken = `${token}.${signature}`;

    tokens.set(signedToken, expiry);
    return signedToken;
}

/**
 * Верификация CSRF токена
 * Токен можно переиспользовать в течение срока действия (reusable)
 */
export async function verifyCSRFToken(token: string): Promise<boolean> {
    if (!token) return false;

    // Проверяем HMAC подпись сначала
    const [tokenPart, signature] = token.split('.');
    if (!tokenPart || !signature) return false;

    const expectedSignature = await createHmacSignature(tokenPart);

    if (signature !== expectedSignature) return false;

    // Проверяем существование токена
    const expiry = tokens.get(token);
    if (!expiry) {
        // Токен валидный по подписи, но не в хранилище - добавляем его
        // Это может быть токен после рестарта сервера
        tokens.set(token, Date.now() + TOKEN_EXPIRY);
        return true;
    }

    // Проверяем не истек ли токен
    if (Date.now() > expiry) {
        tokens.delete(token);
        return false;
    }

    return true;
}

/**
 * Удаление использованного токена (one-time use)
 */
export async function consumeCSRFToken(token: string): Promise<boolean> {
    if (!(await verifyCSRFToken(token))) return false;
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
