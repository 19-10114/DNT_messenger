'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ChevronUp, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DropdownMultipleOption {
  value: string;
  label: string;
}

interface DropdownMultipleProps {
  options: DropdownMultipleOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

const DropdownMultiple: React.FC<DropdownMultipleProps> = ({
  options,
  selectedValues,
  onToggle,
  placeholder = 'Selecciona opciones...',
  loading = false,
  disabled = false,
  className = '',
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!loading && !disabled) {
      setShowDropdown(!showDropdown);
    }
  };

  const handleOptionClick = (value: string) => {
    onToggle(value);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;

    // Buscar los labels correspondientes a los valores seleccionados
    const selectedLabels = selectedValues
      .map((value) => {
        const option = options.find((opt) => opt.value === value);
        return option ? option.label : value;
      })
      .join(', ');

    return selectedLabels;
  };

  return (
    <div className={cn('relative w-full', className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={loading || disabled}
        className={cn(
          'w-full px-3 py-2 text-left border rounded-md flex justify-between items-center',
          'bg-white hover:bg-gray-50 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          (loading || disabled) && 'opacity-50 cursor-not-allowed',
          selectedValues.length > 0 && 'border-blue-300 bg-blue-50'
        )}
      >
        <span
          className={cn(
            'text-sm truncate',
            selectedValues.length === 0 && 'text-gray-500'
          )}
        >
          {getDisplayText()}
        </span>
        {showDropdown ? (
          <ChevronUp className="h-4 w-4 ml-2 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 ml-2 shrink-0 text-gray-600" />
        )}
      </button>

      {showDropdown && (
        <div
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-1">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                No hay opciones disponibles
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleOptionClick(option.value)}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors',
                    'flex items-center justify-between',
                    selectedValues.includes(option.value) && 'bg-blue-50'
                  )}
                >
                  <span
                    className={cn(
                      selectedValues.includes(option.value) &&
                        'text-blue-700 font-medium'
                    )}
                  >
                    {option.label}
                  </span>
                  {selectedValues.includes(option.value) && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DropdownMultiple;
