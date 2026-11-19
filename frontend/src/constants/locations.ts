export const LOCATIONS = [
  {
    id: 'Chacao',
    name: 'Oficina Principal (Chacao)',
  },
  {
    id: 'Guarenas',
    name: 'Guarenas',
  },
  {
    id: 'Tucupita',
    name: 'Tucupita',
  },
  {
    id: 'Maturin',
    name: 'Maturin',
  },
  {
    id: 'Pto_Ordaz',
    name: 'Puerto Ordaz',
  },
  {
    id: 'El_Panita',
    name: 'El Panita',
  },
  {
    id: 'Piritu',
    name: 'Piritu',
  },
  {
    id: 'Temblador',
    name: 'Temblador',
  },
];

export const BRANCH_WHATSAPP_NUMBERS: Record<string, string> = {
  25: '584121519925', //Guayana
  27: '584242345435', //Guarenas
  28: '584127527522', //Guatire
  29: '584249343606', //Maturín
  30: '584125273024', //Temblador
  31: '584249549337', //Tucupita
  33: '584121182843', //Piritu
};

export const DEFAULT_WHATSAPP_NUMBER = '584242345435';

// Sucursales ocultas en el landing por ahora (el dashboard sí las muestra).
// Espejo de LANDING_HIDDEN_BRANCHES en el backend, que ya las filtra con origin=landing.
export const LANDING_HIDDEN_BRANCH_IDS: number[] = [32, 39, 41];
