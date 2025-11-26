// app/catalog/metadata.ts
// Для добавления SEO metadata в catalog page

import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Produktkatalog | Beauty Salon Shop',
    description: 'Entdecken Sie unsere Premium-Auswahl an Kosmetikprodukten. Hochwertige Hautpflege, Make-up und Beauty-Produkte für jeden Hauttyp.',
    keywords: [
        'Kosmetik',
        'Beauty',
        'Hautpflege',
        'Make-up',
        'Schönheitsprodukte',
        'Premium Kosmetik',
        'Online Shop',
    ],
    openGraph: {
        title: 'Produktkatalog | Beauty Salon Shop',
        description: 'Entdecken Sie unsere Premium-Auswahl an Kosmetikprodukten.',
        type: 'website',
        locale: 'de_DE',
    },
    alternates: {
        canonical: '/catalog',
    },
};

// ИНСТРУКЦИЯ ПО ПРИМЕНЕНИЮ:
// Если используешь Server Components (удали 'use client' из catalog/page.tsx),
// то просто экспортируй эту metadata:
//
// export { metadata } from './metadata';
//
// Если оставляешь 'use client', то нужно создать layout.tsx для catalog:
//
// // app/catalog/layout.tsx
// import { metadata } from './metadata';
// export { metadata };
// export default function CatalogLayout({ children }: { children: React.ReactNode }) {
//     return <>{children}</>;
// }