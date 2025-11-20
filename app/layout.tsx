import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/contexts/AuthContext';

const inter = Inter({ 
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({ 
  subsets: ['latin', 'cyrillic'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Салон Красоты Élégance | Магазин профессиональной косметики',
  description: 'Интернет-магазин профессиональной косметики для красоты и ухода. Широкий выбор средств для волос, лица и тела от ведущих брендов.',
  keywords: 'салон красоты, косметика, уход за волосами, уход за лицом, профессиональная косметика',
  authors: [{ name: 'Élégance Beauty Salon' }],
  openGraph: {
    title: 'Салон Красоты Élégance',
    description: 'Магазин профессиональной косметики',
    type: 'website',
    locale: 'ru_RU',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${inter.variable} ${playfair.variable}`}>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
