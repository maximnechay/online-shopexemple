'use client';

export default function StructuredData() {
    const organizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Élégance Beauty & Cosmetics',
        alternateName: 'Élégance',
        url: 'https://elegance-beauty.de',
        logo: 'https://elegance-beauty.de/logo.png',
        image: 'https://elegance-beauty.de/og-image.jpg',
        description: 'Premium Beauty-Produkte und professionelle Kosmetik für Ihre natürliche Schönheit',
        address: {
            '@type': 'PostalAddress',
            streetAddress: 'Musterstraße 10',
            addressLocality: 'Berlin',
            postalCode: '10115',
            addressCountry: 'DE',
        },
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+49-123-456-7890',
            contactType: 'customer service',
            email: 'info@elegance-beauty.de',
            availableLanguage: ['German', 'English'],
            areaServed: 'DE',
        },
        sameAs: [
            'https://www.instagram.com/elegance_beauty',
            'https://www.facebook.com/elegancebeauty',
            'https://www.youtube.com/@elegancebeauty',
            'https://twitter.com/elegancebeauty',
        ],
    };

    const webSiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Élégance Beauty & Cosmetics',
        url: 'https://elegance-beauty.de',
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://elegance-beauty.de/catalog?search={search_term_string}',
            },
            'query-input': 'required name=search_term_string',
        },
    };

    const localBusinessSchema = {
        '@context': 'https://schema.org',
        '@type': 'Store',
        '@id': 'https://elegance-beauty.de/#store',
        name: 'Élégance Beauty & Cosmetics',
        image: 'https://elegance-beauty.de/og-image.jpg',
        url: 'https://elegance-beauty.de',
        telephone: '+49-123-456-7890',
        email: 'info@elegance-beauty.de',
        priceRange: '€€-€€€',
        address: {
            '@type': 'PostalAddress',
            streetAddress: 'Musterstraße 10',
            addressLocality: 'Berlin',
            postalCode: '10115',
            addressCountry: 'DE',
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: 52.5200,
            longitude: 13.4050,
        },
        openingHoursSpecification: [
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                opens: '09:00',
                closes: '21:00',
            },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
            />
        </>
    );
}
