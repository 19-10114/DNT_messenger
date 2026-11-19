'use client';

import React, { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import {
  BRANCH_WHATSAPP_NUMBERS,
  DEFAULT_WHATSAPP_NUMBER,
} from '@/constants/locations';
import { NO_IMAGE_SRC } from '@/constants/images';
import '../componentStyle.css';
import Image from 'next/image';

interface ProductDetailModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedBranchData, setSelectedBranchData] = useState<{
    branchId: string;
    branchName: string;
    colors: any[];
  } | null>(null);
  const [selectedColor, setSelectedColor] = useState<any | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const images: string[] = product?.images ?? [];

  useEffect(() => {
    if (isOpen && product) {
      setSelectedBranch(null);
      setSelectedBranchData(null);
      setSelectedColor(null);
      // La imagen principal arranca siempre en la primera del producto
      setSelectedImage(product.images?.[0] ?? null);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  // Imagen grande y miniaturas: la que está en grande no se repite abajo
  const mainImage = selectedImage ?? images[0] ?? null;
  const thumbnails = images.filter((image) => image !== mainImage);

  // Agrupar colores por sucursal
  const branchesWithColors =
    product.branches
      ?.map((branch: any) => ({
        branchId: branch.branchId,
        branchName: branch.branchName,
        colors:
          branch.colors?.filter((color: any) => color.quantity === true) || [],
      }))
      .filter((branch: any) => branch.colors.length > 0) || [];

  const handleBranchSelect = (branch: any) => {
    if (selectedBranch === branch.branchId) {
      // Si ya está seleccionada, la desseleccionamos
      setSelectedBranch(null);
      setSelectedBranchData(null);
      setSelectedColor(null);
    } else {
      // Seleccionamos la nueva sucursal y preseleccionamos el primer color
      setSelectedBranch(branch.branchId);
      setSelectedBranchData({
        branchId: branch.branchId,
        branchName: branch.branchName,
        colors: branch.colors,
      });
      setSelectedColor(branch.colors[0] || null);
    }
  };

  const handleColorSelect = (color: any) => {
    setSelectedColor(color);
  };

  const handleWhatsAppRedirect = () => {
    let whatsappNumber = DEFAULT_WHATSAPP_NUMBER;

    if (selectedBranchData) {
      whatsappNumber =
        BRANCH_WHATSAPP_NUMBERS[selectedBranchData.branchId] ||
        DEFAULT_WHATSAPP_NUMBER;
    }

    let message = `¡Hola! Me interesa obtener más información sobre la moto: *${product.brand} ${product.model}*`;
    if (selectedColor) {
      message += `\nColor: ${selectedColor.color}`;
    }

    message += `\n\n¿Podrían proporcionarme más detalles sobre disponibilidad y condiciones? ¡Gracias!`;

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURI(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4"
        onClick={onClose}
      >
        {/* Modal Content - Flex column para footer fijo */}
        <div
          className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl mx-2 sm:mx-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Fijo arriba */}
          <div className="relative p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              aria-label="Cerrar modal"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>

            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 pr-10 leading-tight">
              {product.brand} {product.model}
            </h2>
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Imagen y descripción */}
              <div className="space-y-4">
                {/* Imagen principal del producto */}
                <div className="relative overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={mainImage || NO_IMAGE_SRC}
                    alt={`${product.brand} ${product.model}`}
                    onError={(e) => {
                      e.currentTarget.src = NO_IMAGE_SRC;
                    }}
                    className={`w-full h-64 sm:h-80 lg:h-96 rounded-lg ${
                      mainImage
                        ? 'object-cover'
                        : 'object-contain p-10 opacity-50'
                    }`}
                  />
                </div>

                {/* Miniaturas: solo las imágenes que no están en grande */}
                {thumbnails.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {thumbnails.map((image) => (
                      <button
                        key={image}
                        onClick={() => setSelectedImage(image)}
                        className="relative w-20 h-20 rounded-md overflow-hidden border-2 border-gray-200 hover:border-secondary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-secondary"
                        aria-label={`Ver otra imagen de ${product.brand} ${product.model}`}
                      >
                        <img
                          src={image}
                          alt={`${product.brand} ${product.model} miniatura`}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Descripción del producto */}
                <div>
                  <p className="text-gray-700 leading-relaxed">
                    {product.description ||
                      `${product.brand} ${product.model} - Motocicleta de alta calidad con excelente rendimiento y diseño moderno.`}
                  </p>
                </div>
              </div>

              {/* Sucursales y colores */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 text-center justify-center">
                  Disponibilidad por sucursal
                </h3>
                <p className="text-gray-600 text-sm">
                  <strong>ELIGE</strong> sucursal, color y presiona{' '}
                  <strong>CONSULTAR</strong> para obtener atención{' '}
                  <strong>INMEDIATA</strong>.
                </p>

                {branchesWithColors.length > 0 ? (
                  <div className="space-y-3">
                    {branchesWithColors.map((branch: any) => (
                      <div
                        key={branch.branchId}
                        className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                          selectedBranch === branch.branchId
                            ? 'border-secondary bg-secondary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {/* Sucursal */}
                        <button
                          className="w-full py-3 px-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 text-left"
                          onClick={() => handleBranchSelect(branch)}
                        >
                          <div className="flex items-center gap-3">
                            <MapPin
                              className={`w-4 h-4 transition-colors duration-200 ${
                                selectedBranch === branch.branchId
                                  ? 'text-secondary scale-125'
                                  : 'text-gray-500 group-hover:text-gray-900'
                              }`}
                            />
                            <div className="font-semibold text-gray-900">
                              {branch.branchName}
                            </div>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              {branch.colors.length}{' '}
                              {branch.colors.length > 1
                                ? 'colores disponibles'
                                : 'color disponible'}
                            </span>
                          </div>
                        </button>

                        {/* Colores - se muestran solo si esta sucursal está seleccionada */}
                        {selectedBranch === branch.branchId && (
                          <div className="px-4 pb-3 bg-gray-50 border-t border-gray-100">
                            <div className="flex flex-wrap gap-3 ml-4 md:ml-6 lg:ml-7">
                              {branch.colors.map((color: any, idx: number) => (
                                <button
                                  key={idx}
                                  onClick={() => handleColorSelect(color)}
                                  className={`flex flex-col items-center gap-1 transition-all duration-200 ${
                                    selectedColor?.color === color.color
                                      ? 'scale-125'
                                      : 'opacity-80 hover:opacity-100'
                                  }`}
                                >
                                  <div
                                    className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                                      selectedColor?.color === color.color
                                        ? 'border-secondary shadow-md'
                                        : 'border-gray-300'
                                    }`}
                                    style={{
                                      backgroundColor:
                                        color.colorHex || '#000000',
                                    }}
                                    title={color.color}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No hay sucursales con disponibilidad para este modelo.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer - Fijo abajo */}
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 sm:py-2 px-4 rounded-md transition-colors duration-200"
              >
                Cerrar
              </button>
              <button
                onClick={handleWhatsAppRedirect}
                className="flex-1 bg-[#25D366] hover:bg-[#20b859] text-white font-medium py-3 sm:py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <Image
                  src="icons/ws-white-logo.svg"
                  alt="WhatsApp"
                  width={28}
                  height={28}
                />
                <span className="font-bold">CONSULTAR</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetailModal;
