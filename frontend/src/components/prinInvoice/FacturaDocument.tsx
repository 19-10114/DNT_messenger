import React from 'react';
import { Page, Text, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { InvoiceSchemaType } from '@/schemas/invoice.schema';

const tableRowStart = 280; // Adjusted start for table
const rowHeight = 20;
// Column positions (X coordinates)
const colQty = 40;
const colDesc = 100;
const colUnit = 280;
const colTotal = 350;

// Create styles
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
  // Absolute positioning helper
  textAbsolute: {
    position: 'absolute',
  },

  // -- Header Data --
  emissionPlace: { top: 135, left: 150 },
  day: { top: 135, left: 230 },
  month: { top: 135, left: 250 },
  year: { top: 135, left: 270 },

  // -- Client Data --
  clientName: { top: 160, left: 150 },
  clientAddress: { top: 175, left: 100 },
  clientPhone: { top: 200, left: 250 },

  clientId: { top: 250, left: 50 },
  deliveryOrder: { top: 250, left: 120 },
  paymentConditions: { top: 250, left: 300 },

  // -- Footer Totals --
  subtotal: { top: 500, left: 350 },
  total: { top: 560, left: 350 },
});

interface FacturaDocumentProps {
  data: InvoiceSchemaType;
}

const FacturaDocument: React.FC<FacturaDocumentProps> = ({ data }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Background Image */}
        <Image
          src="/templates/moto candela factura.jpeg"
          style={styles.backgroundImage}
        />

        {/* Header Data */}
        <Text style={[styles.textAbsolute, styles.emissionPlace]}>
          {data.emissionPlace}
        </Text>
        <Text style={[styles.textAbsolute, styles.day]}>{data.day}</Text>
        <Text style={[styles.textAbsolute, styles.month]}>{data.month}</Text>
        <Text style={[styles.textAbsolute, styles.year]}>{data.year}</Text>

        {/* Client Data */}
        <Text style={[styles.textAbsolute, styles.clientName]}>
          {data.clientName}
        </Text>
        <Text style={[styles.textAbsolute, styles.clientAddress]}>
          {data.clientAddress}
        </Text>
        <Text style={[styles.textAbsolute, styles.clientPhone]}>
          {data.clientPhone}
        </Text>

        <Text style={[styles.textAbsolute, styles.clientId]}>
          {data.clientId}
        </Text>
        <Text style={[styles.textAbsolute, styles.deliveryOrder]}>
          {data.deliveryOrder}
        </Text>
        <Text style={[styles.textAbsolute, styles.paymentConditions]}>
          {data.paymentConditions}
        </Text>

        {/* Items */}
        {data.items.map((item, index) => {
          const y = tableRowStart + index * rowHeight;
          return (
            <React.Fragment key={index}>
              <Text style={{ position: 'absolute', top: y, left: colQty }}>
                {item.quantity}
              </Text>
              <Text style={{ position: 'absolute', top: y, left: colDesc }}>
                {item.description}
              </Text>
              <Text style={{ position: 'absolute', top: y, left: colUnit }}>
                {item.unitPrice.toFixed(2)}
              </Text>
              <Text style={{ position: 'absolute', top: y, left: colTotal }}>
                {item.totalPrice.toFixed(2)}
              </Text>
            </React.Fragment>
          );
        })}

        {/* Totals */}
        <Text style={[styles.textAbsolute, styles.subtotal]}>
          {data.subtotal.toFixed(2)}
        </Text>
        <Text style={[styles.textAbsolute, styles.total]}>
          {data.totalToPay.toFixed(2)}
        </Text>
      </Page>
    </Document>
  );
};

export default FacturaDocument;
