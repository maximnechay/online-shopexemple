// app/layout.tsx
import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import PayPalProvider from '@/components/providers/PayPalProvider';
import CookieBanner from '@/components/cookie/CookieBanner';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';

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

export const metadata: Metadata = {
  title: 'Beauty Salon Shop',
  description: 'Premium beauty products and services',
};

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
          <PayPalProvider>
            {children}
            <CookieBanner />
          </PayPalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}