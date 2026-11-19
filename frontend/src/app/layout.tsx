import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers/providers.component';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Moto candela - Admin',
  description: 'Panel administrativo de Moto candela',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
