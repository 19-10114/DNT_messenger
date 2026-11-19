/*
    Utils to obtain the corresponding range for a given date
*/

// Get quarter
export const getTrimestre = (dateString: string): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const monthUTC = utcDate.getUTCMonth() + 1;

  if (monthUTC >= 1 && monthUTC <= 3) return 'Enero - Marzo';
  if (monthUTC >= 4 && monthUTC <= 6) return 'Abril - Junio';
  if (monthUTC >= 7 && monthUTC <= 9) return 'Julio - Septiembre';
  return 'Octubre - Diciembre';
};

// Get month
export const getMes = (dateString: string): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  return utcDate.toLocaleString('es-ES', {
    month: 'long',
    timeZone: 'UTC',
  });
};

// Get week from a date with range of date
export const getSemana = (
  dateString: string
): { weekKey: string; weekRange: string } => {
  const [year, month, day] = dateString.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  const thursday = new Date(utcDate);
  thursday.setUTCDate(
    utcDate.getUTCDate() + (3 - ((utcDate.getUTCDay() + 6) % 7))
  );

  const jan4 = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));

  const weekNumber =
    Math.floor(
      (thursday.getTime() - jan4.getTime()) / (7 * 24 * 60 * 60 * 1000)
    ) + 1;

  const monday = new Date(utcDate);
  monday.setUTCDate(utcDate.getUTCDate() - ((utcDate.getUTCDay() + 6) % 7));

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  return {
    weekKey: `Semana ${weekNumber + 1}`,
    weekRange: `${formatDate(monday)} - ${formatDate(sunday)}`,
  };
};

// Get day with format and week day
export const getDia = (dateString: string): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  const dayFormatted = utcDate.getUTCDate().toString().padStart(2, '0');
  const monthFormatted = (utcDate.getUTCMonth() + 1)
    .toString()
    .padStart(2, '0');
  const dayOfWeek = utcDate.toLocaleString('es-ES', {
    weekday: 'short',
    timeZone: 'UTC',
  });

  return `${dayFormatted}/${monthFormatted} - ${dayOfWeek}`;
};

// Función para formatear fechas
export const formatDateToSpanish = (dateString: string): string => {
  try {
    const date = new Date(dateString + 'T00:00:00Z');
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return dateString;
  }
};

// Agrega días a una fecha dada
export const addDays = (dateString: string, days: number): string => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

// Calcula la diferencia en días entre dos fechas
export const dateDiffInDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';

  try {
    // Extraer directamente las partes de la fecha del string YYYY-MM-DD
    const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (match) {
      const [_, year, month, day] = match;
      return `${day}/${month}/${year}`;
    }

    // Si la fecha tiene timestamp, intentar extraer de nuevo
    const timestampMatch = dateString.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (timestampMatch) {
      const [_, year, month, day] = timestampMatch;
      return `${day}/${month}/${year}`;
    }

    return dateString;
  } catch (error) {
    return dateString;
  }
};

export const formatDateWithTime = (isoString: string): string => {
  const date = new Date(isoString);

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  return `${day}/${month}/${year} \n${hours}:${minutes}:${seconds}`;
};
