// hooks/usePDFProcessor.ts
import { useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';
import type { ReactElement } from 'react';

// Definimos un tipo para docType
export type DocType = 'contrato' | 'autorizacion';

/**
 * Hook para generar y descargar un PDF usando @react-pdf/renderer.
 * @param component — El componente ReactElement a renderizar (ej. <ContratoPDF data={...} />).
 * @param fileName — El nombre del archivo final .pdf que se descargará.
 */
export function usePDFProcessor() {
  const generatePdf = useCallback(
    async (component: ReactElement, fileName: string) => {
      try {
        // 1. Generamos el PDF en un blob
        const blob = await pdf(component).toBlob();

        // 2. Forzamos la descarga
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Error generando PDF:', error);
        throw error;
      }
    },
    []
  );

  return { generatePdf };
}
