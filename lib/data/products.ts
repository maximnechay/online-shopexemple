// lib/data/products.ts
import { Product } from '@/lib/types';

export const products: Product[] = [
    {
        id: '1',
        name: 'Air Zoom Pegasus 40',
        slug: 'nike-air-zoom-pegasus-40',
        description: 'Универсальные беговые кроссовки с технологией Air Zoom для максимальной амортизации. Идеальны для ежедневных пробежек.',
        price: 12990,
        compareAtPrice: 14990,
        images: [
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&h=800&fit=crop'
        ],
        category: 'running',
        brand: 'Nike',
        inStock: true,
        stockQuantity: 15,
        tags: ['бег', 'амортизация', 'тренировки'],
        rating: 4.8,
        reviewCount: 327,
        createdAt: '2024-01-15',
        updatedAt: '2024-11-10'
    },
    {
        id: '2',
        name: 'Ultraboost Light',
        slug: 'adidas-ultraboost-light',
        description: 'Легкие беговые кроссовки с технологией Boost для непревзойденного возврата энергии. Вес всего 245г.',
        price: 18990,
        compareAtPrice: 21990,
        images: [
            'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&h=800&fit=crop'
        ],
        category: 'running',
        brand: 'Adidas',
        inStock: true,
        stockQuantity: 23,
        tags: ['бег', 'легкие', 'boost'],
        rating: 4.9,
        reviewCount: 534,
        createdAt: '2024-02-01',
        updatedAt: '2024-11-15'
    },
    {
        id: '3',
        name: 'LeBron 21',
        slug: 'nike-lebron-21',
        description: 'Профессиональные баскетбольные кроссовки с поддержкой голеностопа и системой амортизации Zoom Air.',
        price: 16990,
        images: [
            'https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=800&h=800&fit=crop'
        ],
        category: 'basketball',
        brand: 'Nike',
        inStock: true,
        stockQuantity: 8,
        tags: ['баскетбол', 'lebron', 'профи'],
        rating: 4.7,
        reviewCount: 189,
        createdAt: '2024-01-20',
        updatedAt: '2024-11-12'
    },
    {
        id: '4',
        name: 'Air Force 1 \'07',
        slug: 'nike-air-force-1-07',
        description: 'Легендарные повседневные кроссовки в классическом белом цвете. Икона уличного стиля с 1982 года.',
        price: 10990,
        compareAtPrice: 11990,
        images: [
            'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop'
        ],
        category: 'lifestyle',
        brand: 'Nike',
        inStock: true,
        stockQuantity: 42,
        tags: ['классика', 'стиль', 'белые'],
        rating: 4.9,
        reviewCount: 1256,
        createdAt: '2024-03-05',
        updatedAt: '2024-11-18'
    },
    {
        id: '5',
        name: 'Suede Classic XXI',
        slug: 'puma-suede-classic-xxi',
        description: 'Культовые замшевые кроссовки в обновленной версии. Стиль и комфорт на каждый день.',
        price: 7990,
        images: [
            'https://images.unsplash.com/photo-1584735175315-9d5df23860e6?w=800&h=800&fit=crop'
        ],
        category: 'lifestyle',
        brand: 'Puma',
        inStock: true,
        stockQuantity: 31,
        tags: ['замша', 'классика', 'стиль'],
        rating: 4.6,
        reviewCount: 392,
        createdAt: '2024-02-10',
        updatedAt: '2024-11-10'
    },
    {
        id: '6',
        name: 'Metcon 9',
        slug: 'nike-metcon-9',
        description: 'Универсальные тренировочные кроссовки для кроссфита и функционального тренинга. Максимальная стабильность.',
        price: 13990,
        images: [
            'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=800&fit=crop'
        ],
        category: 'training',
        brand: 'Nike',
        inStock: true,
        stockQuantity: 19,
        tags: ['кроссфит', 'тренировки', 'стабильность'],
        rating: 4.8,
        reviewCount: 418,
        createdAt: '2024-01-08',
        updatedAt: '2024-11-19'
    },
    {
        id: '7',
        name: '574 Core',
        slug: 'new-balance-574-core',
        description: 'Классические ретро-кроссовки с технологией ENCAP для комфорта в течение всего дня.',
        price: 8990,
        compareAtPrice: 9990,
        images: [
            'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&h=800&fit=crop'
        ],
        category: 'lifestyle',
        brand: 'New Balance',
        inStock: true,
        stockQuantity: 28,
        tags: ['ретро', 'комфорт', 'классика'],
        rating: 4.7,
        reviewCount: 603,
        createdAt: '2024-02-20',
        updatedAt: '2024-11-16'
    },
    {
        id: '8',
        name: 'Mercurial Superfly 9',
        slug: 'nike-mercurial-superfly-9',
        description: 'Профессиональные футбольные бутсы с технологией Zoom Air для взрывной скорости на поле.',
        price: 24990,
        images: [
            'https://images.unsplash.com/photo-1511556820780-d912e42b4980?w=800&h=800&fit=crop'
        ],
        category: 'football',
        brand: 'Nike',
        inStock: false,
        stockQuantity: 0,
        tags: ['футбол', 'скорость', 'профи'],
        rating: 4.9,
        reviewCount: 212,
        createdAt: '2024-03-01',
        updatedAt: '2024-11-19'
    },
    {
        id: '9',
        name: 'Chuck Taylor All Star',
        slug: 'converse-chuck-taylor',
        description: 'Легендарные высокие кеды Converse. Классика американского стиля с 1917 года.',
        price: 5990,
        images: [
            'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800&h=800&fit=crop'
        ],
        category: 'lifestyle',
        brand: 'Converse',
        inStock: true,
        stockQuantity: 56,
        tags: ['кеды', 'классика', 'высокие'],
        rating: 4.8,
        reviewCount: 2167,
        createdAt: '2024-01-25',
        updatedAt: '2024-11-17'
    },
    {
        id: '10',
        name: 'SB Dunk Low',
        slug: 'nike-sb-dunk-low',
        description: 'Скейтбордические кроссовки с усиленной подошвой и прочной конструкцией для катания.',
        price: 11990,
        images: [
            'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=800&fit=crop'
        ],
        category: 'skateboarding',
        brand: 'Nike',
        inStock: true,
        stockQuantity: 15,
        tags: ['скейт', 'dunk', 'прочные'],
        rating: 4.7,
        reviewCount: 489,
        createdAt: '2024-02-15',
        updatedAt: '2024-11-14'
    },
    {
        id: '11',
        name: 'GEL-Kayano 30',
        slug: 'asics-gel-kayano-30',
        description: 'Премиальные беговые кроссовки с технологией GEL для максимальной амортизации и поддержки.',
        price: 17990,
        images: [
            'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&h=800&fit=crop'
        ],
        category: 'running',
        brand: 'Asics',
        inStock: true,
        stockQuantity: 12,
        tags: ['бег', 'gel', 'поддержка'],
        rating: 4.8,
        reviewCount: 334,
        createdAt: '2024-03-10',
        updatedAt: '2024-11-18'
    },
    {
        id: '12',
        name: 'Club C 85',
        slug: 'reebok-club-c-85',
        description: 'Винтажные теннисные кроссовки в минималистичном дизайне. Комфорт и стиль 80-х годов.',
        price: 7490,
        images: [
            'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&h=800&fit=crop'
        ],
        category: 'lifestyle',
        brand: 'Reebok',
        inStock: true,
        stockQuantity: 33,
        tags: ['ретро', 'теннис', 'винтаж'],
        rating: 4.6,
        reviewCount: 521,
        createdAt: '2024-01-30',
        updatedAt: '2024-11-19'
    }
];

// Category info
export const categories = [
    {
        id: 'running' as const,
        name: 'Беговые',
        slug: 'running',
        description: 'Кроссовки для бега и тренировок',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop'
    },
    {
        id: 'basketball' as const,
        name: 'Баскетбольные',
        slug: 'basketball',
        description: 'Кроссовки для баскетбола',
        image: 'https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=600&h=400&fit=crop'
    },
    {
        id: 'lifestyle' as const,
        name: 'Повседневные',
        slug: 'lifestyle',
        description: 'Кроссовки на каждый день',
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=400&fit=crop'
    },
    {
        id: 'training' as const,
        name: 'Тренировочные',
        slug: 'training',
        description: 'Кроссовки для тренировок и кроссфита',
        image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=400&fit=crop'
    },
    {
        id: 'football' as const,
        name: 'Футбольные',
        slug: 'football',
        description: 'Бутсы для футбола',
        image: 'https://images.unsplash.com/photo-1511556820780-d912e42b4980?w=600&h=400&fit=crop'
    },
    {
        id: 'skateboarding' as const,
        name: 'Для скейтбординга',
        slug: 'skateboarding',
        description: 'Кроссовки для скейтборда',
        image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&h=400&fit=crop'
    }
];
