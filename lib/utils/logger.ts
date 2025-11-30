// lib/utils/logger.ts

type SensitiveField = 'email' | 'phone' | 'address' | 'password' | 'token' | 'secret' |
    'api_key' | 'client_secret' | 'street' | 'house_number' |
    'postal_code' | 'customer_email' | 'customer_phone';

/**
 * Список полей, которые нужно скрывать в логах
 */
const SENSITIVE_KEYS: string[] = [
    'email',
    'phone',
    'password',
    'token',
    'secret',
    'api_key',
    'client_secret',
    'street',
    'address',
    'house_number',
    'postal_code',
    'customer_email',
    'customer_phone',
    'card_number',
    'cvv',
    'ssn',
    'credit_card',
];

/**
 * Рекурсивно удаляет чувствительные данные из объекта
 */
export function redactSensitiveData(obj: any): any {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => redactSensitiveData(item));
    }

    const redacted: any = {};

    for (const key of Object.keys(obj)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = SENSITIVE_KEYS.some(sk => lowerKey.includes(sk));

        if (isSensitive) {
            // Частично показываем email для отладки
            if (lowerKey.includes('email') && typeof obj[key] === 'string') {
                const email = obj[key] as string;
                const [local, domain] = email.split('@');
                if (local && domain) {
                    redacted[key] = `${local.substring(0, 2)}***@${domain}`;
                } else {
                    redacted[key] = '[REDACTED]';
                }
            } else {
                redacted[key] = '[REDACTED]';
            }
        } else if (typeof obj[key] === 'object') {
            redacted[key] = redactSensitiveData(obj[key]);
        } else {
            redacted[key] = obj[key];
        }
    }

    return redacted;
}

/**
 * Безопасное логирование с автоматическим скрытием чувствительных данных
 */
export function safeLog(message: string, data?: any) {
    if (data) {
        console.log(message, redactSensitiveData(data));
    } else {
        console.log(message);
    }
}

/**
 * Безопасное логирование ошибок
 */
export function safeError(message: string, data?: any) {
    if (data) {
        console.error(message, redactSensitiveData(data));
    } else {
        console.error(message);
    }
}

/**
 * Безопасное логирование предупреждений
 */
export function safeWarn(message: string, data?: any) {
    if (data) {
        console.warn(message, redactSensitiveData(data));
    } else {
        console.warn(message);
    }
}
