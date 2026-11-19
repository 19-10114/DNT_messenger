import { redirect } from 'next/navigation';

import { GPS_MONITORING } from '@/constants/routes';

/** `/dashboard/gps` no tiene contenido propio: entra por Monitoreo. */
export default function GpsPage() {
  redirect(GPS_MONITORING);
}
