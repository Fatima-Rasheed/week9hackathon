import type { Metadata } from 'next';
import { Josefin_Sans, Lato } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/lib/cartContext';

const josefinSans = Josefin_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'HealthCare Store — Your Wellness Partner',
  description: 'Browse premium healthcare products with AI-powered recommendations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${josefinSans.variable} ${lato.variable}`}>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
