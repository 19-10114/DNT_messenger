import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * This function is used to merge tailwind and custom classes
 * @param inputs List of classes and variants
 * @returns
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string to a specific format (YYYY-MM-DD)
 * @param dateString Date string to be formatted
 * @returns Formatted date string or an empty string if input is undefined
 */
export function formatDate(dateString: string | Date | undefined) {
  if (dateString) {
    const date = new Date(dateString);
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = date.getUTCFullYear().toString();
    return `${year}-${month}-${day}`;
  } else {
    return '';
  }
}

/**
 * Calculates the number of days until a given date.
 * @param dateString Date string to compare with the current date
 * @returns Number of days from now until the given date, or -1 if the date is invalid
 */
export function getDaysUntil(dateString: string | undefined) {
  if (!dateString) {
    return -1; // Fecha inválida
  }

  const currentDate = new Date();
  const targetDate = new Date(dateString);

  // Calcular la diferencia en milisegundos y convertir a días
  const timeDiff = targetDate.getTime() - currentDate.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Convertir de milisegundos a días

  return daysDiff;
}

export const formatCurrency = (amount: number) => {
  return Number(amount).toLocaleString('es-VE', {
    // return (Number(amount) / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
};

export const formatCurrencyBolivares = (amount: number) => {
  return Number(amount).toLocaleString('es-VE', {
    // return (Number(amount) / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'BSF',
  });
};

export const formatNumber = (amount: number) => {
  return Number(amount).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const usdFormatCurrency = (amount: number) => {
  return Number(amount).toLocaleString('en-US', {
    // return (Number(amount) / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
};

// Determine which signature image to use based on director ID
export const getSignatureImage = (data: any) => {
  const directorId = data['idDirector'];
  if (directorId === '2') {
    return '/templates/firma_salva.jpg';
  } else if (directorId === '152') {
    return '/templates/firma_director_id_152.jpg';
  } else if (directorId === '9') {
    return '/templates/firma_hector.jpg';
  }
  return null;
};

export const getParsedAmount = (
  val?: number | { source?: string; parsedValue?: number }
): number => {
  if (val == null) return 0;
  if (typeof val === 'object') {
    return (val as any).parsedValue as number;
  }
  return val as number;
};

export const amountRoundedUp = (
  amount: number,
  decimalPlaces: number
): number => {
  const factor = Math.pow(10, decimalPlaces);
  return Math.ceil(amount * factor) / factor;
};
