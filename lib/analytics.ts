// lib/analytics.ts
// Google Analytics 4 Event Tracking Utilities

declare global {
    interface Window {
        gtag: (...args: any[]) => void;
    }
}

// Helper function to safely call gtag
const gtag = (...args: any[]) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag(...args);
    }
};

// Page View
export const pageview = (url: string) => {
    gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
        page_path: url,
    });
};

// Generic Event
export const event = (action: string, params?: Record<string, any>) => {
    gtag('event', action, params);
};

// ============================================
// E-commerce Events (GA4 Standard)
// ============================================

// View Item List (Catalog page)
export const viewItemList = (items: any[], listName: string = 'Product Catalog') => {
    gtag('event', 'view_item_list', {
        item_list_name: listName,
        items: items.map((item, index) => ({
            item_id: item.id,
            item_name: item.name,
            item_category: item.category,
            price: item.price,
            currency: 'EUR',
            index: index,
        })),
    });
};

// View Item (Product detail page)
export const viewItem = (product: any) => {
    gtag('event', 'view_item', {
        currency: 'EUR',
        value: product.price,
        items: [{
            item_id: product.id,
            item_name: product.name,
            item_category: product.category,
            price: product.price,
            quantity: 1,
        }],
    });
};

// Add to Cart
export const addToCart = (product: any, quantity: number = 1) => {
    gtag('event', 'add_to_cart', {
        currency: 'EUR',
        value: product.price * quantity,
        items: [{
            item_id: product.id,
            item_name: product.name,
            item_category: product.category,
            price: product.price,
            quantity: quantity,
        }],
    });
};

// Remove from Cart
export const removeFromCart = (product: any, quantity: number = 1) => {
    gtag('event', 'remove_from_cart', {
        currency: 'EUR',
        value: product.price * quantity,
        items: [{
            item_id: product.id,
            item_name: product.name,
            item_category: product.category,
            price: product.price,
            quantity: quantity,
        }],
    });
};

// View Cart
export const viewCart = (items: any[], totalValue: number) => {
    gtag('event', 'view_cart', {
        currency: 'EUR',
        value: totalValue,
        items: items.map((item) => ({
            item_id: item.id,
            item_name: item.name,
            item_category: item.category,
            price: item.price,
            quantity: item.quantity,
        })),
    });
};

// Begin Checkout
export const beginCheckout = (items: any[], totalValue: number) => {
    gtag('event', 'begin_checkout', {
        currency: 'EUR',
        value: totalValue,
        items: items.map((item) => ({
            item_id: item.id,
            item_name: item.name,
            item_category: item.category,
            price: item.price,
            quantity: item.quantity,
        })),
    });
};

// Add Payment Info
export const addPaymentInfo = (paymentMethod: string, value: number) => {
    gtag('event', 'add_payment_info', {
        currency: 'EUR',
        value: value,
        payment_type: paymentMethod,
    });
};

// Purchase (Most important!)
export const purchase = (
    transactionId: string,
    items: any[],
    totalValue: number,
    tax: number = 0,
    shipping: number = 0
) => {
    gtag('event', 'purchase', {
        transaction_id: transactionId,
        value: totalValue,
        tax: tax,
        shipping: shipping,
        currency: 'EUR',
        items: items.map((item) => ({
            item_id: item.id,
            item_name: item.name,
            item_category: item.category,
            price: item.price,
            quantity: item.quantity,
        })),
    });
};

// ============================================
// Custom Events
// ============================================

// Search
export const search = (searchTerm: string, resultsCount?: number) => {
    gtag('event', 'search', {
        search_term: searchTerm,
        ...(resultsCount !== undefined && { results_count: resultsCount }),
    });
};

// Newsletter Signup
export const newsletterSignup = (method: string = 'homepage') => {
    gtag('event', 'newsletter_signup', {
        method: method,
    });
};

// User Registration
export const userRegistration = (method: string = 'email') => {
    gtag('event', 'sign_up', {
        method: method,
    });
};

// User Login
export const userLogin = (method: string = 'email') => {
    gtag('event', 'login', {
        method: method,
    });
};

// Add to Wishlist
export const addToWishlist = (product: any) => {
    gtag('event', 'add_to_wishlist', {
        currency: 'EUR',
        value: product.price,
        items: [{
            item_id: product.id,
            item_name: product.name,
            item_category: product.category,
            price: product.price,
        }],
    });
};

// Share
export const share = (method: string, contentType: string, itemId: string) => {
    gtag('event', 'share', {
        method: method,
        content_type: contentType,
        item_id: itemId,
    });
};

// Click on CTA
export const clickCTA = (ctaName: string, location: string) => {
    gtag('event', 'cta_click', {
        cta_name: ctaName,
        location: location,
    });
};

// Form Submission
export const formSubmit = (formName: string) => {
    gtag('event', 'form_submit', {
        form_name: formName,
    });
};

// Error Tracking
export const trackError = (errorMessage: string, errorLocation: string) => {
    gtag('event', 'exception', {
        description: errorMessage,
        fatal: false,
        location: errorLocation,
    });
};