'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  showSearch?: boolean;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  options,
  selectedValues,
  onToggle,
  showDropdown,
  setShowDropdown,
  onSelectAll,
  onClearAll,
  showSearch = false,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setSearchTerm('');
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, setShowDropdown]);

  // Limpiar búsqueda cuando se cierra el dropdown
  useEffect(() => {
    if (!showDropdown) {
      setSearchTerm('');
    }
  }, [showDropdown]);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const handleOptionClick = (value: string) => {
    onToggle(value);
    // NO cerrar el dropdown aquí
  };

  const handleSelectAllClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectAll();
  };

  const handleClearAllClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClearAll();
  };

  // Filtrar opciones basado en el término de búsqueda
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleButtonClick}
        className={`px-4 py-2 border rounded-md text-sm w-full text-left flex justify-between items-center ${
          selectedValues.length > 0
            ? 'bg-blue-50 border-blue-300'
            : 'bg-white border-gray-300'
        }`}
      >
        <span>
          {label}{' '}
          {selectedValues.length > 0 && (
            <span className="text-blue-600 font-medium">
              ({selectedValues.length})
            </span>
          )}
        </span>
        {showDropdown ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {showDropdown && (
        <div
          className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-2 border-b">
            {/* Barra de búsqueda */}
            {showSearch && (
              <div className="mb-2">
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            <div className="flex justify-between mb-2">
              <button
                type="button"
                onClick={handleSelectAllClick}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              >
                Seleccionar todos
              </button>
              <button
                type="button"
                onClick={handleClearAllClick}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              >
                Limpiar
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-2 text-sm text-gray-500 text-center">
                  No se encontraron resultados
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(option.value)}
                      onChange={() => handleOptionClick(option.value)}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm">{option.label}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
