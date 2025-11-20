// lib/data/products.ts
import { Product } from '@/lib/types';

export const products: Product[] = [

];

// Category info
export const categories = [
    {
        id: 'hair-care' as const,
        name: 'Haarpflege',
        slug: 'haarpflege',
        description: 'Shampoos, Conditioner, Masken und Stylingprodukte',
        image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&h=400&fit=crop'
    },
    {
        id: 'face-care' as const,
        name: 'Gesichtspflege',
        slug: 'gesichtspflege',
        description: 'Cremes, Seren, Reinigung und Masken',
        image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&h=400&fit=crop'
    },
    {
        id: 'body-care' as const,
        name: 'Körperpflege',
        slug: 'koerperpflege',
        description: 'Bodylotions, Peelings, Öle und Duschgels',
        image: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=600&h=400&fit=crop'
    },
    {
        id: 'makeup' as const,
        name: 'Make-up',
        slug: 'makeup',
        description: 'Foundation, Lippenstifte, Mascara und mehr',
        image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&h=400&fit=crop'
    },
    {
        id: 'tools' as const,
        name: 'Tools & Zubehör',
        slug: 'tools',
        description: 'Pinsel, Schwämme und Beauty-Tools',
        image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=400&fit=crop'
    },
    {
        id: 'nails' as const,
        name: 'Nagelpflege',
        slug: 'nagelpflege',
        description: 'Nagellacke, Pflege und Nail-Art',
        image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=400&fit=crop'
    }
];