// components/shop/ProductGrid.tsx
'use client';

import { useEffect } from 'react';
import { Product } from '@/lib/types';
import ProductCard from './ProductCard';
import { useReviewStats } from '@/lib/contexts/ReviewStatsContext';
import { motion } from 'framer-motion';

interface ProductGridProps {
    products: Product[];
    animated?: boolean;
}

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5
        }
    }
};

export default function ProductGrid({ products, animated = false }: ProductGridProps) {
    const { loadStats } = useReviewStats();

    useEffect(() => {
        // Загружаем статистику для всех продуктов одним запросом
        if (products.length > 0) {
            const productIds = products.map(p => p.id);
            loadStats(productIds);
        }
    }, [products]);

    if (animated) {
        return (
            <>
                {products.map((product) => (
                    <motion.div
                        key={product.id}
                        variants={cardVariants}
                        layout
                    >
                        <ProductCard product={product} />
                    </motion.div>
                ))}
            </>
        );
    }

    return (
        <>
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </>
    );
}
