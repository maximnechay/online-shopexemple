// lib/data/products.ts
import { Product } from '@/lib/types';

export const products: Product[] = [
    {
        id: '1',
        name: 'Arganöl Shampoo',
        slug: 'argan-shampoo',
        description: 'Professionelles Shampoo mit Arganöl für glänzendes und gesundes Haar. Geeignet für alle Haartypen.',
        price: 2890,
        compareAtPrice: 3490,
        images: [
            'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&h=800&fit=crop'
        ],
        category: 'hair-care',
        brand: 'Moroccanoil',
        inStock: true,
        stockQuantity: 15,
        tags: ['shampoo', 'arganöl', 'glanz'],
        rating: 4.8,
        reviewCount: 127,
        createdAt: '2024-01-15',
        updatedAt: '2024-11-10'
    },
    {
        id: '2',
        name: 'Hyaluronsäure Gesichtsserum',
        slug: 'hyaluron-serum',
        description: 'Intensive Feuchtigkeitspflege mit hochkonzentrierter Hyaluronsäure. Reduziert feine Linien und Fältchen.',
        price: 4590,
        compareAtPrice: 5990,
        images: [
            'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&h=800&fit=crop'
        ],
        category: 'face-care',
        brand: 'La Roche-Posay',
        inStock: true,
        stockQuantity: 23,
        tags: ['serum', 'hyaluron', 'anti-aging'],
        rating: 4.9,
        reviewCount: 234,
        createdAt: '2024-02-01',
        updatedAt: '2024-11-15'
    },
    {
        id: '3',
        name: 'Nährende Haarmaske',
        slug: 'hair-mask-nourishing',
        description: 'Tiefenpflegende Maske für trockenes und strapaziertes Haar mit Sheabutter und Keratin.',
        price: 3290,
        images: [
            'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&h=800&fit=crop'
        ],
        category: 'hair-care',
        brand: 'Olaplex',
        inStock: true,
        stockQuantity: 8,
        tags: ['maske', 'pflege', 'keratin'],
        rating: 4.7,
        reviewCount: 89,
        createdAt: '2024-01-20',
        updatedAt: '2024-11-12'
    },
    {
        id: '4',
        name: 'Vitamin C Tagescreme',
        slug: 'vitamin-c-day-cream',
        description: 'Aufhellende Tagescreme mit Vitamin C für strahlende Haut und ebenmäßigen Teint.',
        price: 3890,
        compareAtPrice: 4490,
        images: [
            'https://images.unsplash.com/photo-1556228852-80726b1ab421?w=800&h=800&fit=crop'
        ],
        category: 'face-care',
        brand: 'Vichy',
        inStock: true,
        stockQuantity: 19,
        tags: ['tagescreme', 'vitamin-c', 'aufhellend'],
        rating: 4.6,
        reviewCount: 156,
        createdAt: '2024-03-05',
        updatedAt: '2024-11-18'
    },
    {
        id: '5',
        name: 'Körper-Peeling Kokosnuss',
        slug: 'body-scrub-coconut',
        description: 'Sanftes Körperpeeling mit natürlichen Kokosnuss-Partikeln und pflegenden Ölen.',
        price: 2490,
        images: [
            'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=800&h=800&fit=crop'
        ],
        category: 'body-care',
        brand: 'The Body Shop',
        inStock: true,
        stockQuantity: 31,
        tags: ['peeling', 'kokosnuss', 'körperpflege'],
        rating: 4.5,
        reviewCount: 92,
        createdAt: '2024-02-10',
        updatedAt: '2024-11-10'
    },
    {
        id: '6',
        name: 'Matt-Finish Foundation',
        slug: 'matte-foundation',
        description: 'Langanhaltende Foundation mit mattem Finish für makellose Haut. Erhältlich in 12 Farbtönen.',
        price: 3690,
        images: [
            'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&h=800&fit=crop'
        ],
        category: 'makeup',
        brand: 'MAC',
        inStock: true,
        stockQuantity: 42,
        tags: ['foundation', 'make-up', 'matt'],
        rating: 4.8,
        reviewCount: 318,
        createdAt: '2024-01-08',
        updatedAt: '2024-11-19'
    },
    {
        id: '7',
        name: 'Reparatur-Haaröl',
        slug: 'repair-hair-oil',
        description: 'Leichtes Haaröl zur Reparatur von Spliss und Haarbruch. Mit Argan- und Jojobaöl.',
        price: 2890,
        compareAtPrice: 3290,
        images: [
            'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&h=800&fit=crop'
        ],
        category: 'hair-care',
        brand: 'Moroccanoil',
        inStock: true,
        stockQuantity: 12,
        tags: ['haaröl', 'reparatur', 'glanz'],
        rating: 4.7,
        reviewCount: 203,
        createdAt: '2024-02-20',
        updatedAt: '2024-11-16'
    },
    {
        id: '8',
        name: 'Retinol Nachtcreme',
        slug: 'retinol-night-cream',
        description: 'Anti-Aging Nachtcreme mit Retinol für straffere und glattere Haut über Nacht.',
        price: 5290,
        images: [
            'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&h=800&fit=crop'
        ],
        category: 'face-care',
        brand: 'CeraVe',
        inStock: false,
        stockQuantity: 0,
        tags: ['nachtcreme', 'retinol', 'anti-aging'],
        rating: 4.9,
        reviewCount: 412,
        createdAt: '2024-03-01',
        updatedAt: '2024-11-19'
    },
    {
        id: '9',
        name: 'Glitzer-Lidschatten Palette',
        slug: 'glitter-eyeshadow-palette',
        description: 'Luxuriöse Lidschatten-Palette mit 12 schimmernden und matten Farbtönen.',
        price: 4490,
        images: [
            'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&h=800&fit=crop'
        ],
        category: 'makeup',
        brand: 'Urban Decay',
        inStock: true,
        stockQuantity: 18,
        tags: ['lidschatten', 'palette', 'glitzer'],
        rating: 4.8,
        reviewCount: 267,
        createdAt: '2024-01-25',
        updatedAt: '2024-11-17'
    },
    {
        id: '10',
        name: 'Reichhaltige Bodylotion',
        slug: 'rich-body-lotion',
        description: 'Intensive Feuchtigkeitspflege für sehr trockene Haut mit Sheabutter und Vitamin E.',
        price: 1990,
        images: [
            'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=800&h=800&fit=crop'
        ],
        category: 'body-care',
        brand: 'Nivea',
        inStock: true,
        stockQuantity: 56,
        tags: ['bodylotion', 'feuchtigkeit', 'sheabutter'],
        rating: 4.6,
        reviewCount: 189,
        createdAt: '2024-02-15',
        updatedAt: '2024-11-14'
    },
    {
        id: '11',
        name: 'Volumen Shampoo',
        slug: 'volume-shampoo',
        description: 'Verleiht feinem Haar mehr Volumen und Fülle ohne zu beschweren.',
        price: 2390,
        images: [
            'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800&h=800&fit=crop'
        ],
        category: 'hair-care',
        brand: 'Kerastase',
        inStock: true,
        stockQuantity: 27,
        tags: ['shampoo', 'volumen', 'feines-haar'],
        rating: 4.5,
        reviewCount: 134,
        createdAt: '2024-03-10',
        updatedAt: '2024-11-18'
    },
    {
        id: '12',
        name: 'Lippenstift Matte Red',
        slug: 'matte-red-lipstick',
        description: 'Langanhaltender matter Lippenstift in klassischem Rot. Bis zu 12 Stunden Halt.',
        price: 2690,
        images: [
            'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&h=800&fit=crop'
        ],
        category: 'makeup',
        brand: 'MAC',
        inStock: true,
        stockQuantity: 33,
        tags: ['lippenstift', 'rot', 'matt'],
        rating: 4.7,
        reviewCount: 421,
        createdAt: '2024-01-30',
        updatedAt: '2024-11-19'
    }
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