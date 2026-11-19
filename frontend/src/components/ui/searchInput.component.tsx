import React, { useState, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from './input.component';
import { Search } from 'lucide-react';

interface SearchInputProps {
  placeholder?: string;
  onSearch: (searchTerm: string) => void;
  initialValue?: string;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({
  placeholder = 'Buscar...',
  onSearch,
  initialValue = '',
  debounceMs = 500,
  className = '',
}: SearchInputProps): JSX.Element {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  /** Último término emitido, para distinguir el eco propio de un reset externo. */
  const lastEmitted = React.useRef(initialValue);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    lastEmitted.current = value;
    onSearch(value);
  }, debounceMs);

  useEffect(() => {
    // Si el padre nos devuelve lo que acabamos de emitir no se toca el input:
    // el debounce va detrás de lo tipeado y sincronizar movería el cursor.
    if (initialValue === lastEmitted.current) return;

    lastEmitted.current = initialValue;
    setSearchTerm(initialValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <Input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        className="pl-10"
      />
    </div>
  );
}
