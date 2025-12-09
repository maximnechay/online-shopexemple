// lib/store/useCartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/lib/types';

// Extended CartItem with variant support
export interface CartItem {
    product: Product;
    quantity: number;
    variantId?: string;      // ID from product_variants table
    variantName?: string;    // e.g., "50cm, Dark Brown"
    variantPrice?: number;   // Variant-specific price (if different from product)
    variantImage?: string;   // Variant-specific image
}

interface CartStore {
    items: CartItem[];
    addItem: (product: Product, quantity?: number, variant?: {
        id: string;
        name: string;
        price: number;
        image?: string;
    }) => void;
    removeItem: (productId: string, variantId?: string) => void;
    updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
    clearCart: () => void;
    getTotal: () => number;
    getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (product: Product, quantity = 1, variant) => {
                set((state) => {
                    // For variants, check both product.id AND variant.id
                    // For non-variants, just check product.id
                    const existingItem = state.items.find((item) => {
                        if (variant) {
                            return item.product.id === product.id && item.variantId === variant.id;
                        }
                        return item.product.id === product.id && !item.variantId;
                    });

                    if (existingItem) {
                        return {
                            items: state.items.map((item) => {
                                const isMatch = variant
                                    ? item.product.id === product.id && item.variantId === variant.id
                                    : item.product.id === product.id && !item.variantId;

                                return isMatch
                                    ? { ...item, quantity: item.quantity + quantity }
                                    : item;
                            }),
                        };
                    }

                    // New item
                    const newItem: CartItem = {
                        product,
                        quantity,
                    };

                    if (variant) {
                        newItem.variantId = variant.id;
                        newItem.variantName = variant.name;
                        newItem.variantPrice = variant.price;
                        newItem.variantImage = variant.image;
                    }

                    return {
                        items: [...state.items, newItem],
                    };
                });
            },

            removeItem: (productId: string, variantId?: string) => {
                set((state) => ({
                    items: state.items.filter((item) => {
                        if (variantId) {
                            return !(item.product.id === productId && item.variantId === variantId);
                        }
                        return !(item.product.id === productId && !item.variantId);
                    }),
                }));
            },

            updateQuantity: (productId: string, quantity: number, variantId?: string) => {
                if (quantity <= 0) {
                    get().removeItem(productId, variantId);
                    return;
                }

                set((state) => ({
                    items: state.items.map((item) => {
                        const isMatch = variantId
                            ? item.product.id === productId && item.variantId === variantId
                            : item.product.id === productId && !item.variantId;

                        return isMatch ? { ...item, quantity } : item;
                    }),
                }));
            },

            clearCart: () => {
                set({ items: [] });
            },

            getTotal: () => {
                const items = get().items;
                return items.reduce((total, item) => {
                    // Use variant price if available, otherwise product price
                    const price = item.variantPrice ?? item.product.price;
                    return total + price * item.quantity;
                }, 0);
            },

            getItemCount: () => {
                const items = get().items;
                return items.reduce((count, item) => count + item.quantity, 0);
            },
        }),
        {
            name: 'cart-storage',
        }
    )
);