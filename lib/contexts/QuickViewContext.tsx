// lib/contexts/QuickViewContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Product } from '@/lib/types';

interface QuickViewContextType {
    product: Product | null;
    isOpen: boolean;
    openQuickView: (product: Product) => void;
    closeQuickView: () => void;
}

const QuickViewContext = createContext<QuickViewContextType | undefined>(undefined);

export function QuickViewProvider({ children }: { children: ReactNode }) {
    const [product, setProduct] = useState<Product | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const openQuickView = (product: Product) => {
        setProduct(product);
        setIsOpen(true);
        // Блокируем скролл на body
        document.body.style.overflow = 'hidden';
    };

    const closeQuickView = () => {
        setIsOpen(false);
        setProduct(null);
        // Разблокируем скролл
        document.body.style.overflow = 'unset';
    };

    return (
        <QuickViewContext.Provider value={{ product, isOpen, openQuickView, closeQuickView }}>
            {children}
        </QuickViewContext.Provider>
    );
}

export function useQuickView() {
    const context = useContext(QuickViewContext);
    if (!context) {
        throw new Error('useQuickView must be used within QuickViewProvider');
    }
    return context;
}
