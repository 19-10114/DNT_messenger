import React from 'react';
import { Page, Text, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { CertificateOriginSchemaType } from '@/schemas/certificateOrigin.schema';

const styles = StyleSheet.create({
  page: {
    position: 'relative',
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 0,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
  textAbsolute: {
    position: 'absolute',
    textTransform: 'uppercase',
  },
  // Coordinates need calibration based on template 'certificado_de_origen.jpg'
  concesionario: { top: 700, left: 150 },
  rif: { top: 720, left: 150 },
  cedula: { top: 740, left: 150 },
  factura: { top: 760, left: 150 }, // Assuming position
  fechaFactura: { top: 760, left: 350 }, // Assuming position

  nombreRazonSocial: { top: 210, left: 150 },
  casaApto: { top: 230, left: 150 },
  avenidaCalle: { top: 230, left: 300 },
  distritoParroquia: { top: 250, left: 150 },
  codigoPostal: { top: 250, left: 350 },
  telefonoHabitacion: { top: 270, left: 150 },
});

interface CertificateOriginDocumentProps {
  data: CertificateOriginSchemaType;
}

const CertificateOriginDocument: React.FC<CertificateOriginDocumentProps> = ({
  data,
}) => {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Image
          src="/templates/certificado_de_origen.jpg"
          style={styles.backgroundImage}
        />

        <Text style={[styles.textAbsolute, styles.concesionario]}>
          {data.concesionario}
        </Text>
        <Text style={[styles.textAbsolute, styles.rif]}>{data.rif}</Text>
        <Text style={[styles.textAbsolute, styles.cedula]}>{data.cedula}</Text>
        <Text style={[styles.textAbsolute, styles.factura]}>
          {data.factura}
        </Text>
        <Text style={[styles.textAbsolute, styles.fechaFactura]}>
          {data.fechaFactura}
        </Text>
        <Text style={[styles.textAbsolute, styles.nombreRazonSocial]}>
          {data.nombreRazonSocial}
        </Text>
        <Text style={[styles.textAbsolute, styles.casaApto]}>
          {data.casaApto}
        </Text>
        <Text style={[styles.textAbsolute, styles.avenidaCalle]}>
          {data.avenidaCalle}
        </Text>
        <Text style={[styles.textAbsolute, styles.distritoParroquia]}>
          {data.distritoParroquia}
        </Text>
        <Text style={[styles.textAbsolute, styles.codigoPostal]}>
          {data.codigoPostal}
        </Text>
        <Text style={[styles.textAbsolute, styles.telefonoHabitacion]}>
          {data.telefonoHabitacion}
        </Text>
      </Page>
    </Document>
  );
};

export default CertificateOriginDocument;
