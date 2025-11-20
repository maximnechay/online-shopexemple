import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    images: string[];
    brand?: string;
    inStock: boolean;
}

interface WishlistStore {
    items: Product[];
    addItem: (product: Product) => void;
    removeItem: (productId: string) => void;
    isInWishlist: (productId: string) => boolean;
    clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (product) => {
                const items = get().items;
                const exists = items.find((item) => item.id === product.id);

                if (!exists) {
                    set({ items: [...items, product] });
                }
            },

            removeItem: (productId) => {
                set({ items: get().items.filter((item) => item.id !== productId) });
            },

            isInWishlist: (productId) => {
                return get().items.some((item) => item.id === productId);
            },

            clearWishlist: () => {
                set({ items: [] });
            },
        }),
        {
            name: 'wishlist-storage',
        }
    )
);