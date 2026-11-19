import { createElement, ReactElement } from 'react';
import type { DocumentProps } from '@react-pdf/renderer';

import { SalesTargetReport } from '@/services/salesTargets/types';
import { pdfFileName } from './salesTargets.utils';

/**
 * Genera y descarga el corte en PDF con los mismos datos que se ven en
 * pantalla (sede, mes y fecha de corte).
 *
 * `@react-pdf/renderer` y el documento se cargan bajo demanda: solo quien
 * descarga paga su peso. Por eso no se usa `usePDFProcessor`, que lo importa
 * de forma estática.
 */
export async function exportSalesTargetPdf(report: SalesTargetReport) {
  const [{ pdf }, { SalesTargetDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./pdf/salesTargetDocument'),
  ]);
  const logoSrc = `${window.location.origin}/moto-candela-logo2.png`;
  // El componente devuelve un <Document>; react-pdf tipa la raíz como tal.
  const document_ = createElement(SalesTargetDocument, {
    report,
    logoSrc,
  }) as unknown as ReactElement<DocumentProps>;
  const blob = await pdf(document_).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = pdfFileName(report);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
