import React, { useState, useEffect } from 'react';
import { Search, Plus, User } from 'lucide-react';
import { Input } from '@/components/ui/input.component';
import { Button } from '@/components/ui/button.component';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.component';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command.component';
import { useClientByCountryId } from '@/hooks/useClients';
import { ClientData } from '@/services/clients/types/Client.type';
import { ClientFormModal } from './ClientFormModal.component';
import { useToken } from '@/stores/auth/auth.store';

/** Lo mínimo que el selector necesita para mostrar un cliente ya elegido */
export type ClientSearchSelection = Pick<
  ClientData,
  'id' | 'firstName' | 'lastName' | 'countryId'
>;

interface ClientSearchProps {
  onClientSelect?: (client: ClientData | null) => void;
  placeholder?: string;
  className?: string;
  /** When true, address fields are required and the modal will auto-open for incomplete clients */
  isBikeOrder?: boolean;
  /** Cliente ya asociado al registro, para abrir el selector con él cargado */
  initialClient?: ClientSearchSelection | null;
}

/** Check if a client is missing any required address fields */
function isClientMissingAddressData(client: ClientData): boolean {
  return (
    !client.residenceType?.trim() ||
    !client.street?.trim() ||
    !client.residence?.trim() ||
    !client.district?.trim() ||
    !client.state?.trim() ||
    !client.postalCode?.trim() ||
    !client.localPhoneNumber?.trim()
  );
}

export function ClientSearch({
  onClientSelect,
  placeholder = 'Buscar cliente por cédula...',
  className = '',
  isBikeOrder = false,
  initialClient = null,
}: ClientSearchProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [shouldSearch, setShouldSearch] = useState(false);
  const [selectedClient, setSelectedClient] =
    useState<ClientSearchSelection | null>(initialClient);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);

  const token = useToken();

  const { client, isLoadingClient, isErrorClient, refetchClient } =
    useClientByCountryId(token, searchValue, shouldSearch);

  useEffect(() => {
    if (!open) {
      setShouldSearch(false);
    }
  }, [open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);

    // Solo buscar si hay al menos 4 caracteres (cédula mínima)
    if (value.length >= 4) {
      setShouldSearch(true);
    } else {
      setShouldSearch(false);
    }
  };

  const handleClientSelect = (clientData: ClientData) => {
    // If it's a bike order and the client is missing address data, open the modal in update mode
    if (isBikeOrder && isClientMissingAddressData(clientData)) {
      setEditingClient(clientData);
      setShowCreateModal(true);
      setOpen(false);
      return;
    }

    setSelectedClient(clientData);
    onClientSelect?.(clientData);
    setOpen(false);
    setSearchValue('');
    setShouldSearch(false);
  };

  const handleCreateClient = () => {
    setEditingClient(null);
    setShowCreateModal(true);
    setOpen(false);
  };

  const handleClientCreated = (newClient: ClientData) => {
    setShowCreateModal(false);
    setEditingClient(null);
    setSelectedClient(newClient);
    onClientSelect?.(newClient);
    setSearchValue('');
    setShouldSearch(false);
  };

  const displayValue = selectedClient
    ? `${selectedClient.firstName} ${selectedClient.lastName} - ${selectedClient.countryId}`
    : '';

  return (
    <>
      <div className={`w-full ${className}`}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between text-left font-normal"
            >
              {selectedClient ? (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{displayValue}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Search className="h-4 w-4" />
                  <span>Seleccionar cliente...</span>
                </div>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Input
                  placeholder={placeholder}
                  value={searchValue}
                  onChange={handleInputChange}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  type="number"
                />
              </div>
              <CommandList>
                {/* Mostrar cliente encontrado */}
                {client && !isErrorClient && (
                  <CommandGroup heading="Cliente encontrado">
                    <CommandItem
                      onSelect={() => handleClientSelect(client)}
                      className="cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {client.firstName} {client.lastName}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Cédula: {client.countryId} | {client.email}
                        </span>
                      </div>
                    </CommandItem>
                  </CommandGroup>
                )}

                {/* Mostrar loading */}
                {isLoadingClient && (
                  <CommandGroup>
                    <CommandItem disabled>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                        <span>Buscando cliente...</span>
                      </div>
                    </CommandItem>
                  </CommandGroup>
                )}

                {/* Mostrar opción de crear cliente */}
                {searchValue.length >= 4 &&
                  (isErrorClient || !client) &&
                  !isLoadingClient && (
                    <CommandGroup heading="Opciones">
                      <CommandItem
                        onSelect={handleCreateClient}
                        className="cursor-pointer text-blue-600"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                          <span className="font-medium">
                            Crear nuevo cliente
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Cédula: {searchValue}
                          </span>
                        </div>
                      </CommandItem>
                    </CommandGroup>
                  )}

                {/* Mensaje cuando no hay resultados y no se puede crear */}
                {searchValue.length > 0 && searchValue.length < 4 && (
                  <CommandEmpty>
                    Ingrese al menos 4 dígitos de la cédula
                  </CommandEmpty>
                )}

                {/* Mensaje inicial */}
                {searchValue.length === 0 && (
                  <CommandEmpty>
                    Ingrese la cédula del cliente para buscar
                  </CommandEmpty>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Modal de creación/actualización de cliente */}
      <ClientFormModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingClient(null);
        }}
        onClientCreated={handleClientCreated}
        initialCountryId={searchValue}
        token={token}
        existingClient={editingClient}
        isBikeOrder={isBikeOrder}
      />
    </>
  );
}
