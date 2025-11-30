// lib/validation/schemas.ts
import { z } from 'zod';

// ============================================
// PRODUCT SCHEMAS
// ============================================

export const createProductSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
    description: z.string().min(10, 'Description too short').max(5000, 'Description too long'),
    price: z.number().positive('Price must be positive'),
    stock_quantity: z.number().int().min(0, 'Stock cannot be negative'),
    category: z.string().min(1, 'Category is required'),
    image_url: z.string().url('Invalid image URL').optional(),
    sku: z.string().max(50).optional(),
    is_featured: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productIdSchema = z.object({
    id: z.string().uuid('Invalid product ID'),
});

// ============================================
// ORDER SCHEMAS
// ============================================

export const createOrderSchema = z.object({
    first_name: z.string().min(1, 'First name is required').max(50),
    last_name: z.string().min(1, 'Last name is required').max(50),
    email: z.string().email('Invalid email address'),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
    street: z.string().min(1, 'Street is required'),
    house_number: z.string().min(1, 'House number is required'),
    city: z.string().min(1, 'City is required'),
    postal_code: z.string().regex(/^\d{5}$/, 'Invalid postal code (must be 5 digits)'),
    items: z.array(z.object({
        productId: z.string().uuid('Invalid product ID'),
        quantity: z.number().int().positive('Quantity must be positive'),
    })).min(1, 'At least one item is required'),
    delivery_method: z.enum(['pickup', 'delivery']).optional(),
    payment_method: z.enum(['stripe', 'paypal', 'cash']).optional(),
    notes: z.string().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
    notes: z.string().max(500).optional(),
});

// ============================================
// COUPON SCHEMAS
// ============================================

export const validateCouponSchema = z.object({
    code: z.string().min(1, 'Coupon code is required').max(50),
    subtotal: z.number().positive('Subtotal must be positive'),
});

export const createCouponSchema = z.object({
    code: z.string().min(1).max(50).regex(/^[A-Z0-9-]+$/, 'Only uppercase letters, numbers, and hyphens'),
    discount_type: z.enum(['percentage', 'fixed']),
    discount_value: z.number().positive('Discount value must be positive'),
    min_purchase: z.number().min(0).optional(),
    max_uses: z.number().int().positive().optional(),
    expires_at: z.string().datetime().optional(),
    is_active: z.boolean().optional(),
});

// ============================================
// REVIEW SCHEMAS
// ============================================

export const createReviewSchema = z.object({
    product_id: z.string().uuid('Invalid product ID'),
    rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
    title: z.string().min(3, 'Title too short').max(100, 'Title too long'),
    comment: z.string().min(10, 'Comment too short').max(1000, 'Comment too long'),
});

export const updateReviewSchema = createReviewSchema.partial().omit({ product_id: true });

// ============================================
// CATEGORY SCHEMAS
// ============================================

export const createCategorySchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().max(500).optional(),
    slug: z.string().regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens').optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// ============================================
// NEWSLETTER SCHEMAS
// ============================================

export const subscribeNewsletterSchema = z.object({
    email: z.string().email('Invalid email address'),
    name: z.string().min(1).max(100).optional(),
});

export const unsubscribeNewsletterSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export const sendNewsletterSchema = z.object({
    subject: z.string().min(1, 'Subject is required').max(200),
    content: z.string().min(10, 'Content too short').max(10000, 'Content too long'),
    recipients: z.enum(['all', 'test']).optional(),
});

// ============================================
// CONTACT SCHEMAS
// ============================================

export const contactFormSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    email: z.string().email('Invalid email address'),
    subject: z.string().min(1, 'Subject is required').max(200),
    message: z.string().min(10, 'Message too short').max(2000, 'Message too long'),
});

// ============================================
// CHECKOUT SCHEMAS
// ============================================

export const checkStockSchema = z.object({
    items: z.array(z.object({
        productId: z.string().uuid('Invalid product ID'),
        quantity: z.number().int().positive('Quantity must be positive').max(100, 'Quantity too large'),
    })).min(1, 'At least one item is required').max(50, 'Too many items'),
});

export const checkoutSessionSchema = z.object({
    session_id: z.string().min(1, 'Session ID is required').regex(/^cs_/, 'Invalid Stripe session ID format'),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Валидация и возврат ошибок в удобном формате
 */
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {

    try {
        const validated = schema.parse(data);
        return { success: true, data: validated };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errors = error.issues.map((err: z.ZodIssue) =>
                `${err.path.join('.')}: ${err.message}`
            );
            return { success: false, errors };
        }
        return { success: false, errors: ['Validation failed'] };
    }
}
