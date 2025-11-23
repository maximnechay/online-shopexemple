// app/layout.tsx
import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import PayPalProvider from '@/components/providers/PayPalProvider';

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
  title: 'Sneakers Shop - Премиум кроссовки',
  description: 'Оригинальные кроссовки от ведущих мировых брендов. Nike, Adidas, New Balance, Puma и другие.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <PayPalProvider>
            {children}
          </PayPalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}