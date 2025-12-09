// lib/security/validation.ts
import { z } from 'zod';

// Product validation schemas
export const createProductSchema = z.object({
    name: z.string().min(1, 'Name ist erforderlich').max(200),
    price: z.number().positive('Preis muss positiv sein'),
    compareAtPrice: z.number().positive().optional().nullable(),
    category: z.string().min(1, 'Kategorie ist erforderlich'),
    description: z.string().min(1, 'Beschreibung ist erforderlich'),
    brand: z.string().optional().nullable(),
    stockQuantity: z.number().int().min(0, 'Menge muss mindestens 0 sein'),
    inStock: z.boolean(),
    images: z.array(z.string().url()).min(1, 'Mindestens ein Bild erforderlich'),
    tags: z.string().optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial().extend({
    id: z.string().uuid(),
});

// Category validation schemas
export const createCategorySchema = z.object({
    id: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, 'ID muss lowercase und darf nur Buchstaben, Zahlen und Bindestriche enthalten'),
    name: z.string().min(1, 'Name ist erforderlich').max(100),
    slug: z.string().min(1).max(100),
    description: z.string().max(500).optional().nullable(),
    image: z.string().url().optional().nullable(),
});

export const updateCategorySchema = z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(100),
    description: z.string().max(500).optional().nullable(),
    image: z.string().url().optional().nullable(),
});

// Order validation schemas
export const createOrderSchema = z.object({
    userId: z.string().uuid().optional().nullable(),
    items: z.array(z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
        price: z.number().positive(),
    })).min(1, 'Mindestens ein Produkt erforderlich'),
    shippingAddress: z.object({
        street: z.string().min(1),
        city: z.string().min(1),
        postalCode: z.string().min(1),
        country: z.string().min(1),
    }),
    email: z.string().email('Ungültige E-Mail-Adresse'),
    phone: z.string().optional().nullable(),
    paymentMethod: z.enum(['stripe', 'paypal', 'sofort']),
});

// Newsletter validation
export const newsletterSubscribeSchema = z.object({
    email: z.string().email('Ungültige E-Mail-Adresse'),
    acceptsMarketing: z.boolean(),
});

// User validation
export const updateUserSchema = z.object({
    fullName: z.string().min(1).max(200).optional(),
    phone: z.string().max(20).optional().nullable(),
});

// Settings validation
export const shopSettingsSchema = z.object({
    shopName: z.string().min(1).max(200).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(20).optional(),
    address: z.string().max(500).optional(),
    shippingCost: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Ungültiges Preisformat'),
    freeShippingFrom: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Ungültiges Preisformat'),
});

// Payment settings validation
export const paymentSettingsSchema = z.object({
    stripeEnabled: z.boolean(),
    paypalEnabled: z.boolean(),
    sofortEnabled: z.boolean(),
});

// Validate request body helper
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
    try {
        const validated = schema.parse(data);
        return { success: true, data: validated };
    } catch (err) {
        if (err instanceof z.ZodError) {
            return {
                success: false,
                errors: err.issues.map((e) => `${e.path.join('.')}: ${e.message}`)
            };
        }
        return {
            success: false,
            errors: ['Validierungsfehler']
        };
    }
}

// Product query validation (для GET /api/products)
export const productQuerySchema = z.object({
    category: z.string().max(100).optional().nullable(),
    search: z.string().min(1).max(200).optional().nullable()
});

// Checkout validation
export const checkoutSchema = z.object({
    items: z.array(z.object({
        id: z.string().uuid('Ungültige Produkt-ID'),
        name: z.string().min(1).max(200),
        price: z.number().positive('Preis muss positiv sein'),
        quantity: z.number().int().positive('Menge muss positiv sein').max(100, 'Maximale Menge: 100'),
        variantId: z.string().uuid().nullable().optional(),
    })).min(1, 'Mindestens ein Artikel erforderlich').max(50, 'Zu viele Artikel'),

    customer: z.object({
        firstName: z.string().min(1, 'Vorname ist erforderlich').max(100),
        lastName: z.string().min(1, 'Nachname ist erforderlich').max(100),
        email: z.string().email('Ungültige E-Mail-Adresse'),
        phone: z.string().min(5).max(20).regex(/^[\d\s()+\-]+$/, 'Ungültige Telefonnummer'),
    }),

    deliveryMethod: z.enum(['delivery', 'pickup']),

    address: z.object({
        street: z.string().min(1).max(200),
        houseNumber: z.string().min(1).max(20),
        city: z.string().min(1).max(100),
        postalCode: z.string().min(5).max(10).regex(/^\d+$/, 'Postleitzahl muss nur Zahlen enthalten'),
        country: z.string().min(2).max(2).default('DE'), // ISO code
    }).nullable().optional(),

    userId: z.string().uuid().optional().nullable(),

    discount: z.number().min(0).optional(),
    couponCode: z.string().max(50).optional().nullable(),

    subtotal: z.number().positive().optional(),
    shipping: z.number().min(0).optional(),
    total: z.number().positive().optional(),
});

// Stripe webhook event validation
export const stripeWebhookEventSchema = z.object({
    id: z.string(),
    type: z.string(),
    data: z.object({
        object: z.any(),
    }),
});