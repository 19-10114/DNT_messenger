import React from 'react';
import { Button } from './button.component';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Componente de paginación para tablas y listas
 */
export function PaginationComponent({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps): JSX.Element {
  // Generar un array de números de página para mostrar
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5; // Número máximo de páginas a mostrar

    if (totalPages <= maxPagesToShow) {
      // Si hay menos páginas que el máximo, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Siempre mostrar la primera página
      pages.push(1);

      // Calcular el rango de páginas a mostrar alrededor de la página actual
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Ajustar si estamos cerca del inicio o final
      if (currentPage <= 2) {
        endPage = 4;
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - 3;
      }

      // Agregar elipsis si es necesario
      if (startPage > 2) {
        pages.push('...');
      }

      // Agregar páginas intermedias
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Agregar elipsis si es necesario
      if (endPage < totalPages - 1) {
        pages.push('...');
      }

      // Siempre mostrar la última página
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center space-x-2 mt-4">
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        variant="outline"
        size="sm"
      >
        Anterior
      </Button>

      <div className="flex space-x-1">
        {getPageNumbers().map((page, index) => (
          <Button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            variant={currentPage === page ? 'default' : 'outline'}
            size="sm"
            disabled={typeof page !== 'number'}
            className={typeof page !== 'number' ? 'cursor-default' : ''}
          >
            {page}
          </Button>
        ))}
      </div>

      <Button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        variant="outline"
        size="sm"
      >
        Siguiente
      </Button>
    </div>
  );
}
