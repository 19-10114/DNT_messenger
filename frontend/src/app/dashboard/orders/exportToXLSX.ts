import * as XLSX from 'xlsx';
import { LeaseModel } from '@/models/lease.model';
export function exportToXLSX(leases: LeaseModel[]) {
  if (leases.length === 0) {
    alert('No hay datos para exportar.');
    return;
  }

  const data: any[][] = [];
  const headers = [
    'ID',
    'Estado',
    'Usuario',
    'Fecha de Creación',
    'Producto',
    'Precio Completo del Producto',
    'Pago Inicial',
    'Pago Mensual',
    'Número de Cuotas',
    'Fecha de Pago Siguiente',
    'Tipo',
  ];

  data.push(headers);

  leases.forEach((lease) => {
    const rowData = [
      lease.id,
      lease.status,
      lease.user,
      lease.createdAt,
      lease.product,
      lease.fullProductPrice,
      lease.initialFee,
      lease.monthlyFee,
      lease.feesNumber,
      formatDate(lease.nextPaymentDate),
      lease.type,
    ];

    data.push(rowData);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Arrendamientos');
  XLSX.writeFile(wb, 'arrendamientos.xlsx');
}

function formatDate(dateString: string | undefined): string {
  if (dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    return `${day}/${month}/${year}`;
  } else {
    return '';
  }
}
