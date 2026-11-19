import { useCallback } from 'react';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
// import ImageModule from 'docxtemplater-image-module-free';

type DocType = 'contrato' | 'autorizacion';

/**
 * Hook para procesar y descargar un documento Word (contrato o autorización)
 * usando docxtemplater, **sin** lógica de imagen para simplificar pruebas.
 */
export const useDocxProcessor = () => {
  const processDocument = useCallback(
    async (formData: Record<string, string>, docType: DocType) => {
      try {
        // 1. Definimos la ruta de la plantilla según docType
        let templateName = '';
        if (docType === 'contrato') {
          templateName = 'contrato_base.docx';
        } else {
          templateName = 'autorizacion_moto_base.docx';
        }

        // 2. Hacemos fetch de la plantilla desde /public/templates/
        const templateUrl = `/templates/${templateName}`;
        const templateRes = await fetch(templateUrl);
        if (!templateRes.ok) {
          throw new Error(`Error fetching template: ${templateUrl}`);
        }
        const arrayBuffer = await templateRes.arrayBuffer();

        // 3. Verificar que la URL de la firma esté presente
        // (Comentar/ignorar la firma, no la usaremos)
        // console.log('URL de firma:', formData.firma);

        // // 4. Cargar la imagen de la firma si existe (COMENTADO)
        // let imageBuffer: ArrayBuffer | null = null;
        // if (formData.firma) {
        //   const imageResponse = await fetch(formData.firma);
        //   if (!imageResponse.ok) {
        //     throw new Error(
        //       `Error al cargar la imagen. Status: ${imageResponse.status}`
        //     );
        //   }
        //   imageBuffer = await imageResponse.arrayBuffer();
        //   console.log('Imagen cargada, tamaño:', imageBuffer.byteLength);
        // }

        // // 5. Configurar el módulo de imágenes (COMENTADO)
        // const imageModule = new ImageModule({
        //   centered: true,
        //   getImage: async (tagValue: string) => {
        //     if (!imageBuffer) {
        //       console.warn('No hay firma. Se usará una imagen vacía.');
        //       return new ArrayBuffer(0);
        //     }
        //     return imageBuffer;
        //   },
        //   getSize: () => [235, 64],
        // });

        // 6. Inicializar docxtemplater, **sin** ImageModule
        const zip = new PizZip(arrayBuffer);
        const doc = new Docxtemplater(zip, {
          // modules: [imageModule],
          delimiters: { start: '<<', end: '>>' },
          paragraphLoop: true,
          linebreaks: true,
          parser: (tag) => ({
            get: (scope) => {
              return scope[tag];
            },
          }),
        });

        // 7. Insertar la data
        doc.setData(formData);
        doc.render();

        // 8. Generar el blob final
        const output = doc.getZip().generate({
          type: 'blob',
          mimeType:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

        // 9. Obtener la cédula del formData y generar nombre de archivo
        const cedula = formData.cedula || 'sin_cedula';
        const fileName =
          docType === 'contrato'
            ? `contrato_${cedula}.docx`
            : `autorizacion_${cedula}.docx`;

        // 10. Desencadenar descarga en el navegador
        const url = window.URL.createObjectURL(output);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Error procesando documento:', error);
        throw error;
      }
    },
    []
  );

  return { processDocument };
};
