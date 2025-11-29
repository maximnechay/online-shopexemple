// lib/contexts/ReviewStatsContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ReviewStats {
    average: number;
    total: number;
}

interface ReviewStatsContextType {
    getStats: (productId: string) => ReviewStats | null;
    loadStats: (productIds: string[]) => Promise<void>;
    loading: boolean;
}

const ReviewStatsContext = createContext<ReviewStatsContextType | undefined>(undefined);

export function ReviewStatsProvider({ children }: { children: ReactNode }) {
    const [statsCache, setStatsCache] = useState<Record<string, ReviewStats>>({});
    const [loading, setLoading] = useState(false);
    const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());

    const loadStats = async (productIds: string[]) => {
        // Фильтруем только те ID, которые еще не загружены
        const idsToLoad = productIds.filter(id => !loadedIds.has(id));

        if (idsToLoad.length === 0) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/reviews/stats?product_ids=${idsToLoad.join(',')}`);
            if (response.ok) {
                const data = await response.json();
                setStatsCache(prev => ({ ...prev, ...data.stats }));
                setLoadedIds(prev => new Set([...prev, ...idsToLoad]));
            }
        } catch (error) {
            console.error('Error loading review stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStats = (productId: string): ReviewStats | null => {
        return statsCache[productId] || null;
    };

    return (
        <ReviewStatsContext.Provider value={{ getStats, loadStats, loading }}>
            {children}
        </ReviewStatsContext.Provider>
    );
}

export function useReviewStats() {
    const context = useContext(ReviewStatsContext);
    if (context === undefined) {
        throw new Error('useReviewStats must be used within a ReviewStatsProvider');
    }
    return context;
}
