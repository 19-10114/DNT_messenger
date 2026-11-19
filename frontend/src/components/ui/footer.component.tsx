import React from 'react';

export const FooterComponent: React.FC = () => {
  const phoneNumber = '+584126780277'; // Cambia esto por el número de teléfono real
  const instagramUrl = 'https://www.instagram.com/DALEPLAYSERVICES_'; // Cambia esto por la URL de Instagram real
  const googleMapsUrl = 'https://www.google.com/maps?q=loc:latitude,longitude'; // Cambia esto por la URL de Google Maps real

  return (
    <footer className="flex item-center jutify-between bg-gray-800 text-white py-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* WhatsApp */}
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold">WhatsApp</h3>
            <p>{phoneNumber}</p>
            <a
              href={`https://wa.me/${phoneNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Enviar Mensaje
            </a>
          </div>

          {/* Instagram */}
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold">Instagram</h3>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              @DALEPLAYSERVICES_
            </a>
          </div>

          {/* Google Maps */}
          {/*<div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold">Ubicación</h3>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Ver en Google Maps
            </a>
          </div>*/}
        </div>
      </div>
    </footer>
  );
};
