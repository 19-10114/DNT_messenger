import React, { forwardRef, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useReactToPrint } from 'react-to-print';
import {
  certificateOriginSchema,
  CertificateOriginSchemaType,
} from '@/schemas/certificateOrigin.schema';
import { Button } from '@/components/ui/button.component';
import { Printer } from 'lucide-react';

interface InteractiveCertificateFormProps {
  defaultValues?: Partial<CertificateOriginSchemaType>;
}

export const InteractiveCertificateForm = forwardRef<
  HTMLDivElement,
  InteractiveCertificateFormProps
>(({ defaultValues }, ref) => {
  const componentRef = useRef<HTMLDivElement>(null);

  const pageStyle = `
    @page {
      size: A4;
      margin: 0;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
      }
    }
  `;

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'Certificado de Origen',
    pageStyle: pageStyle,
  });

  const { register } = useForm<CertificateOriginSchemaType>({
    resolver: zodResolver(certificateOriginSchema),
    defaultValues: defaultValues || {
      concesionario: '',
      rif: '',
      cedula: '',
      factura: '',
      fechaFactura: '',
      nombreRazonSocial: '',
      casaApto: '',
      urbanizacionBarrio: '',
      avenidaCalle: '',
      distritoParroquia: '',
      ciudad: '',
      state: '',
      codigoPostal: '',
      telefonoHabitacion: '',
    },
  });

  const InputField = ({
    name,
    top,
    left,
    width = '200px',
  }: {
    name: keyof CertificateOriginSchemaType;
    top: string;
    left: string;
    width?: string;
  }) => (
    <input
      {...register(name)}
      className="absolute uppercase text-sm font-medium transition-all bg-yellow-100/30 border border-yellow-400/50 rounded-sm hover:bg-yellow-100/50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 print:bg-transparent print:border-none print:shadow-none"
      style={{
        top,
        left,
        width,
      }}
    />
  );

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 print:hidden">
        <Button onClick={() => handlePrint()} className="gap-2">
          <Printer className="w-4 h-4" /> Imprimir / Guardar como PDF
        </Button>
      </div>

      <div
        ref={componentRef}
        className="print-content relative w-[794px] h-[1123px] bg-white shadow-lg print:shadow-none overflow-hidden"
      >
        <img
          src="/templates/certificado_de_origen.jpg"
          alt="Plantilla Certificado"
          className="absolute inset-x-0 w-full h-full object-contain pointer-events-none print:hidden"
          style={{ top: '-5%' }}
        />

        {/* <InputField name="concesionario" top="53%" left="15%" width="260px" /> */}
        {/* <InputField name="rif" top="53%" left="50.5%" width="150px" /> */}
        <InputField name="cedula" top="57.8%" left="13.5%" width="300px" />
        <InputField name="factura" top="57.8%" left="52%" width="100px" />
        <InputField name="fechaFactura" top="57.4%" left="72%" width="150px" />

        <InputField
          name="nombreRazonSocial"
          top="60.7%"
          left="14.5%"
          width="400px"
        />
        <InputField name="casaApto" top="63.5%" left="12%" width="180px" />
        <InputField
          name="urbanizacionBarrio"
          top="67%"
          left="13.5%"
          width="400px"
        />
        <InputField name="avenidaCalle" top="63.5%" left="56%" width="200px" />
        <InputField name="ciudad" top="66.5%" left="69.5%" width="150px" />
        <InputField name="distritoParroquia" top="70%" left="13.5%" />
        <InputField name="state" top="69%" left="53.5%" width="200px" />
        <InputField name="codigoPostal" top="69.3%" left="79%" width="100px" />
        <InputField name="telefonoHabitacion" top="72.3%" left="28%" />

        <InputField
          name="insurance_company"
          top="75.6%"
          left="13.5%"
          width="290px"
        />
        <InputField
          name="insurance_number"
          top="75.6%"
          left="54%"
          width="150px"
        />
        <InputField
          name="insurance_expiration"
          top="75.6%"
          left="75%"
          width="130px"
        />
        <InputField name="dom_reserve" top="78.5%" left="13.5%" width="290px" />
        <InputField name="dom_number" top="81%" left="13.5%" width="290px" />
        <InputField
          name="observations"
          top="78.5%"
          left="52.5%"
          width="300px"
        />
      </div>
    </div>
  );
});

InteractiveCertificateForm.displayName = 'InteractiveCertificateForm';
