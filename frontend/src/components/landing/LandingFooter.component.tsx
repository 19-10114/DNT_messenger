'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, Phone, MapPin, Facebook, Instagram, Clock } from 'lucide-react';
import MotoCandelaLogo from '/public/moto-candela-footer-logo.svg';
import { CONTACT_METHODS } from '@/utils/landing-data';

const whatsappUrl =
  CONTACT_METHODS.find((method) => method.icon === 'Phone')?.url ||
  'https://wa.me/584242345435';

const facebookUrl =
  CONTACT_METHODS.find((method) => method.icon === 'Facebook')?.url ||
  'https://www.facebook.com/profile.php?id=100071188989098';

const instagramUrl =
  CONTACT_METHODS.find((method) => method.icon === 'Instagram')?.url ||
  'https://www.instagram.com/motocandela';

interface LandingFooterProps {
  /**
   * Prefijo de los enlaces a secciones de la landing. Vacío en la landing
   * (`#cobertura`); `/` desde otra página (`/#cobertura`), p. ej. las Páginas.
   */
  sectionBase?: string;
  /**
   * `viewport` (landing): responde al ancho de la ventana. `container`
   * (Páginas): responde al contenedor `page`, para que la vista previa de
   * celular del editor se vea como un celular.
   */
  responsive?: 'viewport' | 'container';
}

const LandingFooter: React.FC<LandingFooterProps> = ({
  sectionBase = '',
  responsive = 'viewport',
}) => {
  const c = responsive === 'container';
  // Clases literales para que Tailwind las genere (no se arman con strings)
  const wrapper = c
    ? 'max-w-7xl mx-auto px-4 page-md:px-6 page-lg:px-8 py-10'
    : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10';
  const card = c
    ? 'bg-white/5 rounded-3xl border border-white/10 p-6 page-md:p-8 mb-6'
    : 'bg-white/5 rounded-3xl border border-white/10 p-6 sm:p-8 mb-6';
  const grid = c
    ? 'grid grid-cols-1 page-md:grid-cols-3 gap-10'
    : 'grid grid-cols-1 md:grid-cols-3 gap-10';
  const bottom = c
    ? 'flex flex-col page-md:flex-row justify-between items-center gap-3 px-2'
    : 'flex flex-col sm:flex-row justify-between items-center gap-3 px-2';
  const section = (id: string) => `${sectionBase}#${id}`;

  return (
    <footer className="bg-primary border-t border-white/10">
      <div className={wrapper}>
        {/* Tarjeta principal */}
        <div className={card}>
          <div className={grid}>
            {/* Logo + descripción + redes sociales */}
            <div className="flex flex-col">
              <Image
                src={MotoCandelaLogo}
                alt="Moto Candela"
                width={300}
                height={120}
                className="h-12 w-auto mb-5"
                unoptimized
              />
              <p className="text-white/50 text-sm leading-relaxed mb-2 text-center">
                J-50276236-1
              </p>
              <p className="text-white/50 text-sm leading-relaxed mb-2 pt-4">
                Tu aliado confiable en soluciones de arrendamiento con opción a
                compra.
              </p>
              <p className="text-secondary text-sm font-medium mb-6">
                Enciende tu Futuro con nosotros.
              </p>
              <div className="flex gap-3 mt-auto items-center justify-center">
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/50 transition-colors hover:text-blue-500 hover:bg-white/20"
                >
                  <Facebook size={20} />
                </a>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/50 transition-colors hover:text-red-500 hover:bg-white/20"
                >
                  <Instagram size={20} />
                </a>
              </div>
            </div>

            {/* Contacto */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-5">
                Contacto
              </h3>
              <div className="space-y-3.5">
                <a
                  href="mailto:info@motocandela.com"
                  className="flex items-center gap-3 text-white/60 text-sm transition-colors hover:text-white"
                >
                  <Mail size={15} className="text-secondary shrink-0" />
                  info@motocandela.com
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-white/60 text-sm transition-colors hover:text-white"
                >
                  <Phone size={15} className="text-secondary shrink-0" />
                  +58 212-7621794
                </a>
                <div className="flex items-start gap-3 text-white/60 text-sm">
                  <MapPin
                    size={15}
                    className="text-secondary shrink-0 mt-0.5"
                  />
                  <span className="leading-relaxed">
                    Av. Francisco Solano López con Av. Las Acacias, Edif.
                    Seguros Mercantil, Piso 8. Oficina 81-A, Urb. La Florida -
                    Caracas - Distrito Capital, Venezuela.
                  </span>
                </div>
                <div className="flex items-center gap-3 text-white/60 text-sm">
                  <Clock size={15} className="text-secondary shrink-0" />
                  Lun – Vie, 9:00 AM – 5:30 PM
                </div>
              </div>
            </div>

            {/* Enlaces útiles */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-5">
                Enlaces
              </h3>
              <div className="flex flex-col gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-white/60 text-sm transition-colors hover:text-white"
                >
                  <Phone size={14} className="shrink-0" />
                  Contactar por WhatsApp
                </a>
                <Link
                  href={section('bikes-catalogue')}
                  className="text-white/60 text-sm transition-colors hover:text-white"
                >
                  Ver Catálogo de Motos
                </Link>
                <Link
                  href={section('cobertura')}
                  className="text-white/60 text-sm transition-colors hover:text-white"
                >
                  Ubicaciones y Cobertura
                </Link>
                <Link
                  href={section('payment-methods')}
                  className="text-white/60 text-sm transition-colors hover:text-white"
                >
                  Métodos de Pago
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Barra inferior */}
        <div className={bottom}>
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} Moto Candela. Todos los derechos
            reservados.
          </p>
          <div className="flex gap-5 text-xs text-white/30">
            <Link href="#" className="transition-colors hover:text-white/60">
              Términos
            </Link>
            <Link href="#" className="transition-colors hover:text-white/60">
              Privacidad
            </Link>
            <Link href="#" className="transition-colors hover:text-white/60">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
