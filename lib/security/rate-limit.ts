// lib/security/rate-limit.ts
import { NextRequest } from 'next/server';

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

const store: RateLimitStore = {};

// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    Object.keys(store).forEach(key => {
        if (store[key].resetTime < now) {
            delete store[key];
        }
    });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

export const RATE_LIMITS = {
    // Public endpoints
    public: { maxRequests: 100, windowMs: 60000 }, // 100 req/min
    products: { maxRequests: 100, windowMs: 60000 }, // 100 req/min
    productDetail: { maxRequests: 200, windowMs: 60000 }, // 200 req/min

    // Authentication
    login: { maxRequests: 5, windowMs: 900000 }, // 5 req/15min
    signup: { maxRequests: 3, windowMs: 3600000 }, // 3 req/hour

    // Orders
    createOrder: { maxRequests: 10, windowMs: 3600000 }, // 10 req/hour

    // Newsletter
    newsletter: { maxRequests: 5, windowMs: 3600000 }, // 5 req/hour

    // Admin endpoints
    admin: { maxRequests: 100, windowMs: 60000 }, // 100 req/min

    // Webhooks
    webhook: { maxRequests: 100, windowMs: 60000 }, // 100 req/min

    // Payment
    payment: { maxRequests: 10, windowMs: 60000 }, // 10 req/min

    // Reviews
    reviews: { maxRequests: 5, windowMs: 3600000 }, // 5 req/hour (creating reviews)
    reviewsRead: { maxRequests: 100, windowMs: 60000 }, // 100 req/min (reading)

    // Coupons
    coupons: { maxRequests: 20, windowMs: 60000 }, // 20 req/min

    // Contact form
    contact: { maxRequests: 5, windowMs: 3600000 }, // 5 req/hour
};

export function rateLimit(
    request: NextRequest,
    config: RateLimitConfig
): { success: true } | { success: false; retryAfter: number } {
    // Get identifier (IP or user ID)
    const identifier = getIdentifier(request);
    const key = `${identifier}-${config.windowMs}`;

    const now = Date.now();
    const record = store[key];

    if (!record || record.resetTime < now) {
        // Create new record
        store[key] = {
            count: 1,
            resetTime: now + config.windowMs,
        };
        return { success: true };
    }

    if (record.count >= config.maxRequests) {
        // Rate limit exceeded
        const retryAfter = Math.ceil((record.resetTime - now) / 1000);
        return { success: false, retryAfter };
    }

    // Increment count
    record.count++;
    return { success: true };
}

function getIdentifier(request: NextRequest): string {
    // Try to get user ID from auth
    // For now, use IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] :
        request.headers.get('x-real-ip') ||
        'unknown';
    return ip;
}

export function createRateLimitMiddleware(config: RateLimitConfig) {
    return (request: NextRequest) => {
        const result = rateLimit(request, config);
        return result;
    };
}
