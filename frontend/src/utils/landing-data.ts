// Datos estáticos para el componente LandingContent

export interface ProcessStep {
  id: number;
  title: string;
  content: string;
}

export interface MarketSegment {
  id: number;
  title: string;
  content: string;
  icon: string;
}

export interface Benefit {
  id: number;
  title: string;
  content: string;
  icon: string;
}

export interface PaymentPlan {
  id: number;
  title: string;
  content: string;
}

export interface Location {
  title?: string;
  address: string;
  url: string;
}

export interface Region {
  region: string;
  locations: Location[];
}

export interface ContactMethod {
  id: number;
  title: string;
  content: string;
  url: string;
  icon: string;
}

export interface PaymentMethod {
  id: number;
  title: string;
  iconUrl: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 1,
    title: 'Pago Móvil',
    iconUrl: '/icons/pago-movil.svg',
  },
  {
    id: 2,
    title: 'Efectivo',
    iconUrl: '/icons/cash.svg',
  },
  {
    id: 3,
    title: 'Binance',
    iconUrl: '/icons/binance.svg',
  },
  {
    id: 4,
    title: 'Banesco Panamá',
    iconUrl: 'icons/banesco_logo.svg',
  },
  {
    id: 5,
    title: 'Transferencia Bancaria',
    iconUrl: 'icons/transferencia_bancaria.svg',
  },
  {
    id: 6,
    title: 'Zelle',
    iconUrl: 'icons/zelle_logo.svg',
  },
];

// Ubicaciones y cobertura
export const COVERAGE_REGIONS: Region[] = [
  {
    region: 'Región Central y Capital',
    locations: [
      {
        title: 'Guarenas',
        address: 'C.C. Copacabana, Av. Intercomunal',
        url: 'https://maps.app.goo.gl/2BiYX3dzqwtn2Gvh7',
      },
      {
        title: 'Guatire',
        address: 'Av. Arismendi, diagonal a la Catedral',
        url: 'https://maps.app.goo.gl/BFSZRjtrrtogk4qy5',
      },
    ],
  },
  {
    region: 'Región Oriental',
    locations: [
      {
        title: 'Maturín',
        address: 'Av. Juncal, cerca Mercado Nuevo',
        url: 'https://maps.app.goo.gl/otnMsemZ2Qf9YCTH9',
      },
      {
        title: 'Temblador',
        address: 'Av. Francisco de Miranda, Edif. Isaac Rodríguez',
        url: 'https://maps.app.goo.gl/NfPbAxr6Hzb4aUrR6',
      },
      {
        title: 'Tucupita',
        address:
          'Av. Francisco de Miranda, Edif. Isaac Rodríguez (Asesor: 0412-1519925)',
        url: 'https://maps.app.goo.gl/BuRpxJiADn3kHbjc7',
      },
      {
        title: 'Puerto Ordaz',
        address: 'UD-220 Caroní, Av. Principal de Castillito',
        url: '',
      },
      {
        title: 'Puerto Píritu',
        address: 'Av. Fernando Peñalver, diagonal al hospital',
        url: 'https://maps.app.goo.gl/k9gT4dxDyusC8MtV7',
      },
      {
        title: 'Guayana',
        address: 'Hay que ponerla',
        url: 'https://maps.app.goo.gl/mgGU26gj9xK991Sv9',
      },
      // {
      //   title: 'El Panita', address:'C.A. Av. Rojas, entre Cl. Azcue y Cl. Barreto, Maturín.',
      //   url: 'https://maps.app.goo.gl/Ny9VqBPAgbDHxnKEA',
      // },
    ],
  },
  {
    region: 'Aliados Comerciales',
    locations: [
      {
        title: 'Valencia',
        address: 'Av. Andrés Eloy Blanco, sector Santa Cecilia y El Viñedo',
        url: '',
      },
      {
        title: 'Tucacas',
        address: 'Vía Las Lapas, Tucacas 2055, Falcón',
        url: '',
      },
    ],
  },
];

// Métodos de contacto
export const CONTACT_METHODS: ContactMethod[] = [
  {
    id: 1,
    title: 'WhatsApp Directo',
    content: '58 424-2345435',
    url: 'https://wa.me/584242345435',
    icon: 'Phone',
  },
  {
    id: 2,
    title: 'Portal de Fans',
    content: 'Moto Candela en Facebook',
    url: 'https://www.facebook.com/motocandela',
    icon: 'Facebook',
  },
  {
    id: 3,
    title: 'Síguenos en Instagram',
    content: '@motocandela',
    url: 'https://www.instagram.com/motocandela',
    icon: 'Instagram',
  },
  {
    id: 4,
    title: 'Correo Electrónico',
    content: 'info@motocandela.com',
    url: 'mailto:info@motocandela.com',
    icon: 'Mail',
  },
];

// Configuración del mapa de Google
export const GOOGLE_MAPS_CONFIG = {
  embedUrl:
    'https://www.google.com/maps/d/u/0/embed?mid=1R-65Ct9T0KdgxXH-As0SWfypvpv6nZg&ehbc=2E312F&noprof=1',
  title: 'Ubicaciones Moto Candela',
};

// Constantes de texto
export const LANDING_CONTENT_TEXTS = {
  solution: {
    title: 'El Modelo Moto Candela: Tu Camino Simplificado a la Propiedad',
    subtitle:
      'Hemos diseñado un sistema de arrendamiento con opción a compra que es transparente, accesible y centrado en tu éxito. No es solo alquilar una moto; es invertir en tu futuro, paso a paso.',
    processTitle: 'Así te "Montas, Ruedas y Prosperas" con Moto Candela:',
    conclusion:
      'Con Moto Candela, tu esfuerzo se convierte directamente en propiedad y progreso.',
  },
  market: {
    title: 'Nuestro Mercado: Venezolanos Trabajadores y Emprendedores',
    subtitle:
      'Entendemos las necesidades de quienes buscan superarse día a día. Moto Candela es para ti, que ves en una motocicleta la herramienta clave para tu desarrollo profesional y personal.',
    conclusion:
      'También apoyamos a empresas que buscan dotar a sus empleados con vehículos eficientes para sus operaciones diarias.',
  },
  benefits: {
    title: 'Ventajas Clave: Tu Confianza, Nuestra Prioridad',
    subtitle:
      'Moto Candela va más allá de solo una moto. Te ofrecemos un paquete de beneficios diseñado para tu tranquilidad y crecimiento, posicionándonos como tu socio estratégico de confianza.',
    plansTitle: 'Además, contamos con Planes de Pago Adaptados a Ti',
    conclusion:
      'También ofrecemos planes quincenales (12, 18 o 24 quincenas). ¡Mayor flexibilidad para tu comodidad!',
  },
  coverage: {
    title: 'Nuestra Cobertura: Llegando a Más Venezolanos',
    subtitle:
      'Actualmente, puedes encontrarnos en diversas localidades, y seguimos trabajando para ampliar nuestra presencia y llevar la oportunidad Moto Candela a más rincones del país.',
    mapTitle: 'Concesionarios y Oficinas',
    conclusion:
      'Al dar click en alguna de nuestras sedes se te redirigirá a su ubicación en Google Maps',
  },
  contact: {
    title: '¿Listo Para Encender tu futuro?',
    subtitle:
      'En Moto Candela, creemos firmemente en tu potencial. Te ofrecemos la moto que necesitas para trabajar, crecer y transformar tu vida. Somos tu aliado confiable en cada kilómetro de tu camino al éxito.',
    schedule:
      'Nuestro horario de atención es de Lunes a Viernes, de 9:00 a.m. a 5:30 p.m.',
  },
};
