// app/layout.tsx
import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { ReviewStatsProvider } from '@/lib/contexts/ReviewStatsContext';
import PayPalProvider from '@/components/providers/PayPalProvider';
import CookieBanner from '@/components/cookie/CookieBanner';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import StructuredData from '@/components/seo/StructuredData';
import * as Sentry from '@sentry/nextjs';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// ✅ Полная SEO-оптимизация с мета-тегами
export function generateMetadata(): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://elegance-beauty.de';
  const siteName = 'Élégance Beauty & Cosmetics';
  const siteDescription = 'Hochwertige Beauty-Produkte und professionelle Kosmetik für Ihre natürliche Schönheit. Entdecken Sie Premium-Hautpflege, Make-up und Wellness-Produkte in Deutschland.';

  return {
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: siteDescription,
    keywords: [
      'Beauty Shop',
      'Kosmetik Online',
      'Hautpflege',
      'Make-up',
      'Premium Kosmetik',
      'Beauty Produkte',
      'Naturkosmetik',
      'Anti-Aging',
      'Gesichtspflege',
      'Körperpflege',
      'Beauty Deutschland',
    ],
    authors: [{ name: 'Élégance Beauty' }],
    creator: 'Élégance Beauty & Cosmetics',
    publisher: 'Élégance Beauty',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: '/',
      languages: {
        'de-DE': '/de',
        'en-US': '/en',
      },
    },
    openGraph: {
      type: 'website',
      locale: 'de_DE',
      url: siteUrl,
      title: siteName,
      description: siteDescription,
      siteName: siteName,
      images: [
        {
          url: `${siteUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: `${siteName} - Premium Beauty Products`,
        },
        {
          url: `${siteUrl}/logo.png`,
          width: 512,
          height: 512,
          alt: `${siteName} Logo`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteName,
      description: siteDescription,
      images: [`${siteUrl}/og-image.jpg`],
      creator: '@elegancebeauty',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
        { url: '/web-app-manifest-192x192.png', type: 'image/png', sizes: '192x192' },
        { url: '/web-app-manifest-512x512.png', type: 'image/png', sizes: '512x512' },
      ],
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
      other: [
        {
          rel: 'mask-icon',
          url: '/favicon.svg',
          color: '#1f2937',
        },
      ],
    },
    manifest: '/site.webmanifest',
    other: {
      ...Sentry.getTraceData(),
      'msapplication-TileColor': '#1f2937',
      'theme-color': '#ffffff',
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        {/* Structured Data for SEO */}
        <StructuredData />
      </head>
      <body className="font-sans antialiased">
        {/* Google Analytics - загружается только если указан Measurement ID */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics
            measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
          />
        )}

        <AuthProvider>
          <ReviewStatsProvider>
            <PayPalProvider>
              {children}
              <CookieBanner />
            </PayPalProvider>
          </ReviewStatsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}