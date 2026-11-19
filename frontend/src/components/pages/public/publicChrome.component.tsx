import React from 'react';
import {
  Facebook,
  Globe,
  Instagram,
  Menu,
  Music2,
  UserCircle,
  Youtube,
} from 'lucide-react';

import { HOME } from '@/constants/routes';
import LandingNavBar from '@/components/navigation/landingbar/LandingNavBar.component';
import LandingFooter from '@/components/landing/LandingFooter.component';
import {
  FooterStyle,
  HeaderStyle,
  PageImage,
  SocialKind,
  SocialLink,
} from '@/services/pages/types';
import { CONTACT_METHODS } from '@/utils/landing-data';
import { WhatsappIcon } from '../blocks/shared.component';
import { getTheme } from '../themes';

/** Lo configurable de la cabecera y el pie, fuera de los bloques */
export interface PageChrome {
  showLogo: boolean;
  /** `logo` = píldora con el logo; `site` = la barra de navegación de la landing */
  headerStyle?: HeaderStyle;
  /** Logo propio de la página; sin él, el de Moto Candela */
  logo?: PageImage | null;
  showFooter: boolean;
  /** `simple` = el pie propio (editable); `site` = el pie de la landing */
  footerStyle?: FooterStyle;
  /** Vacío = "© <año> Moto Candela" */
  footerText?: string;
  /** `null`/ausente = redes de Moto Candela; `[]` = ninguna */
  socialLinks?: SocialLink[] | null;
}

export const DEFAULT_CHROME: PageChrome = {
  showLogo: true,
  headerStyle: 'logo',
  logo: null,
  showFooter: true,
  footerStyle: 'simple',
  footerText: '',
  socialLinks: null,
};

const SOCIAL_ICONS: Record<
  SocialKind,
  React.ComponentType<{ className?: string }>
> = {
  instagram: Instagram,
  facebook: Facebook,
  whatsapp: WhatsappIcon,
  tiktok: Music2,
  youtube: Youtube,
  website: Globe,
};

export const SOCIAL_LABELS: Record<SocialKind, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  website: 'Sitio web',
};

/** Las redes de Moto Candela, lo que se ve si la página no define las suyas */
export function defaultSocialLinks(): SocialLink[] {
  const links: SocialLink[] = [];
  const instagram = socialUrl('Instagram');
  const facebook = socialUrl('Facebook');
  if (instagram) links.push({ kind: 'instagram', url: instagram });
  if (facebook) links.push({ kind: 'facebook', url: facebook });
  return links;
}

export const defaultFooterText = () =>
  `© ${new Date().getFullYear()} Moto Candela`;

const socialUrl = (icon: string) =>
  CONTACT_METHODS.find((method) => method.icon === icon)?.url;

interface ChromeProps {
  theme: string;
  /** En la vista previa el logo no navega */
  interactive?: boolean;
}

function Logo({ theme, custom }: { theme: string; custom?: PageImage | null }) {
  if (custom) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={custom.url}
        alt=""
        className="h-9 w-auto max-w-[180px] object-contain"
      />
    );
  }
  const src =
    getTheme(theme).logo === 'light'
      ? '/moto-candela-footer-logo.svg'
      : '/moto-candela-logo.svg';
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="Moto Candela" className="h-9 w-auto" />;
}

/**
 * Cabecera mínima: solo el logo en una píldora clara, flotando sobre el
 * primer bloque (por eso siempre el logo oscuro, sea cual sea el tema). Con
 * un logo propio, la píldora no lleva a la landing: no es Moto Candela.
 */
export function PublicHeader({
  interactive = true,
  chrome,
}: Pick<ChromeProps, 'interactive'> & { chrome: PageChrome }) {
  if (!chrome.showLogo) return null;
  if (chrome.headerStyle === 'site') {
    // La barra real (login, menú, enlaces a la landing) en la página pública;
    // en la vista previa, una copia sin comportamiento que responde al ancho
    // del marco (la real usa `lg:` del navegador).
    return interactive ? (
      <div className="relative z-40 pt-4">
        <LandingNavBar />
      </div>
    ) : (
      <SiteHeaderPreview />
    );
  }
  const href = interactive && !chrome.logo ? HOME : undefined;
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-6xl px-5 py-5 page-md:px-8">
        <a
          href={href}
          className="pointer-events-auto rounded-full bg-white/85 px-4 py-2 shadow-sm backdrop-blur-md"
        >
          <Logo theme="candela" custom={chrome.logo} />
        </a>
      </div>
    </header>
  );
}

export function PublicFooter({
  theme,
  interactive = true,
  chrome,
}: ChromeProps & { chrome: PageChrome }) {
  // El pie de la web, tal cual; sus enlaces van a las secciones de la landing
  if (chrome.footerStyle === 'site') {
    return <LandingFooter sectionBase="/" responsive="container" />;
  }
  const links = chrome.socialLinks ?? defaultSocialLinks();
  const text = chrome.footerText?.trim() || defaultFooterText();
  // Con logo propio el pie no lleva a la landing: no es Moto Candela
  const href = interactive && !chrome.logo ? HOME : undefined;
  return (
    <footer className="border-t border-[var(--pg-border)] px-5 py-10 page-md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 page-md:flex-row page-md:justify-between">
        <a href={href}>
          <Logo theme={theme} custom={chrome.logo} />
        </a>
        {links.length > 0 && (
          <div className="flex items-center gap-3">
            {links.map((link, index) => {
              const Icon = SOCIAL_ICONS[link.kind] ?? Globe;
              return (
                <a
                  key={`${link.kind}-${index}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={SOCIAL_LABELS[link.kind] ?? link.kind}
                  className="rounded-full border border-[var(--pg-border)] p-2.5 text-[var(--pg-fg)] transition-colors hover:bg-[var(--pg-surface)]"
                >
                  <Icon className="h-5 w-5" />
                </a>
              );
            })}
          </div>
        )}
        <p className="text-sm text-[var(--pg-muted)]">{text}</p>
      </div>
    </footer>
  );
}

const SITE_LINKS = [
  'Inicio',
  'Motos',
  'Repuestos',
  'Cobertura',
  'Métodos de Pago',
  'Contacto',
];

/**
 * Copia visual de la barra de la landing para la vista previa del editor:
 * mismas proporciones, sin login ni navegación, y con container queries para
 * que el celular del marco muestre el menú hamburguesa.
 */
function SiteHeaderPreview() {
  return (
    <div className="relative z-40 pt-4">
      <nav className="mx-auto flex w-[95%] items-center justify-between rounded-2xl border border-white/10 bg-black px-4 py-3 shadow-lg shadow-black/30 page-md:w-[90%] page-md:px-6 page-lg:w-[85%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/moto-candela-logo.svg"
          alt="Moto Candela"
          className="ml-4 h-10 w-auto page-md:h-14"
        />
        <div className="mx-auto hidden items-center gap-1 px-2 py-1 page-lg:flex">
          {SITE_LINKS.map((label) => (
            <span
              key={label}
              className="rounded-full px-4 py-2 font-medium text-white"
            >
              {label}
            </span>
          ))}
        </div>
        <div className="flex flex-1 justify-center page-lg:hidden">
          <Menu className="h-6 w-6 text-white" />
        </div>
        <span className="mr-2 flex flex-col items-center gap-1 px-2 py-1 text-white page-lg:mr-4 page-lg:px-4">
          <UserCircle className="h-6 w-6 page-lg:h-7 page-lg:w-7" />
          <span className="text-[11px] text-white/80 page-lg:text-xs">
            Acceder
          </span>
        </span>
      </nav>
    </div>
  );
}
