import React from 'react';
import type { Metadata } from 'next';
import LandingNavBar from '@/components/navigation/landingbar/LandingNavBar.component';
import LandingCarousel from '@/components/landing/LandingCarousel.component';
import LandingCatalogue from '@/components/landing/LandingCatalogue.component';
import LandingCatalogueParts from '@/components/landing/LandingCatalogueParts.component';
import LandingContent from '@/components/landing/LandingContent.component';
import LandingFooter from '@/components/landing/LandingFooter.component';

export const metadata: Metadata = {
  title: 'Moto Candela | Venta de Motos',
  description:
    'Moto Candela ofrece venta de motos, repuestos y cobertura nacional. Descubre nuestras opciones, sucursales y soporte especializado.',
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
  openGraph: {
    title: 'Moto Candela | Venta de Motos',
    description:
      'Venta de motos, repuestos y cobertura nacional. Conoce nuestras ofertas, sucursales y soporte especializado.',
    type: 'website',
    url: 'https://motocandela.com/',
    siteName: 'Moto Candela',
    locale: 'es_ES',
    images: [
      {
        url: 'https://motocandela.com/moto-candela-logo.svg',
        width: 1200,
        height: 630,
        alt: 'Moto Candela - Venta de motos',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Moto Candela | Venta de Motos',
    description:
      'Venta de motos, repuestos y cobertura nacional. Descubre nuestras opciones, sucursales y soporte especializado.',
    images: ['https://motocandela.com/moto-candela-logo.svg'],
  },
  alternates: {
    canonical: 'https://motocandela.com/',
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <LandingNavBar />
      <LandingCarousel />
      <section className="w-3/4 py-4 md:py-6 items-center justify-center mx-auto">
        <div className="text-center mb-2" />
        <div className="h-12 md:h-14 flex items-center justify-center relative">
          <h1
            className="text-secondary font-black text-xl md:text-2xl lg:text-4xl tracking-tighter text-center"
            style={{ textShadow: '2px 2px 0 #000' }}
          >
            VENTA DE MOTOS Y REPUESTOS ORIGINALES CON COBERTURA NACIONAL
          </h1>
        </div>
      </section>
      <LandingCatalogue category="1" />
      <LandingCatalogueParts />
      <LandingContent />
      <LandingFooter />
    </div>
  );
}
