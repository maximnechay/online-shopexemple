// app/layout.tsx
import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { ReviewStatsProvider } from '@/lib/contexts/ReviewStatsContext';
import PayPalProvider from '@/components/providers/PayPalProvider';
import CookieBanner from '@/components/cookie/CookieBanner';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
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

// ✅ Изменено на функцию для Sentry
export function generateMetadata(): Metadata {
  return {
    title: 'Beauty Salon Shop',
    description: 'Premium beauty products and services',
    other: {
      ...Sentry.getTraceData()
    }
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={`${playfair.variable} ${inter.variable}`}>
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