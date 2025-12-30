import './globals.css';
import { cn } from '@/lib/utils';
import { Providers } from '@/components/Providers';
import { CommandMenu } from '@/components/CommandMenu';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  metadataBase: new URL('https://elbuencorte.co'),
  title: 'El Buen Corte | Tradición y Calidad',
  description:
    'Carnes seleccionadas de calidad superior y cocina tradicional entregada directamente a tu puerta en 24 horas.',
  keywords: [
    'carne',
    'premium',
    'asado',
    'parrilla',
    'delivery',
    'bogota',
    'tradicion',
  ],
  openGraph: {
    title: 'El Buen Corte | Tradición, Calidad y Sabor',
    description:
      'La mejor selección de cortes premium para tus asados. Pide online y recibe en casa.',
    url: 'https://elbuencorte.co',
    siteName: 'El Buen Corte',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'El Buen Corte - Carnes Premium',
      },
    ],
    type: 'website',
  },
  authors: [{ name: 'El Buen Corte' }],
  robots: 'index, follow',
  manifest: '/site.webmanifest',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <body className={cn('min-h-screen bg-background font-sans antialiased')}>
        <Providers>
          {children}
          <CommandMenu />
        </Providers>
      </body>
    </html>
  );
}
