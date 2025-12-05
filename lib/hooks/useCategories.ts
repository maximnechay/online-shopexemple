// lib/hooks/useCategories.ts
'use client';

import { useState, useEffect } from 'react';

export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
}

// Дефолтные категории для начальной загрузки
const defaultCategories: Category[] = [
    { id: 'hair-care', name: 'Haarpflege', slug: 'haarpflege' },
    { id: 'face-care', name: 'Gesichtspflege', slug: 'gesichtspflege' },
    { id: 'body-care', name: 'Körperpflege', slug: 'koerperpflege' },
    { id: 'makeup', name: 'Make-up', slug: 'makeup' },
    { id: 'tools', name: 'Tools & Zubehör', slug: 'tools' },
    { id: 'nails', name: 'Nagelpflege', slug: 'nagelpflege' }
];

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>(defaultCategories);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    setCategories(data);
                }
            } else {
                setError('Failed to load categories');
            }
        } catch (err) {
            console.error('Error loading categories:', err);
            setError('Error loading categories');
        } finally {
            setLoading(false);
        }
    };

    const refresh = () => {
        setLoading(true);
        loadCategories();
    };

    return { categories, loading, error, refresh };
}
