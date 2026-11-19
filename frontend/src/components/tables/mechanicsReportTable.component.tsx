'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button.component';
import {
  exportToXLSX,
  ExportData,
} from '@/components/excelExporter/exportXSLX';
import { BikeServicesService } from '@/services/bikeServices/bikeServices.service';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { MechanicReportItem } from '@/services/bikeServices/types/MechanicReport.type';
import { FilterDate } from '@/components/ui/filterDate.component';
import { formatDate } from '@/lib/utils';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';

function exportMechanicsReport(results: MechanicReportItem[]) {
  let sumServices = 0;
  let sumCost = 0;

  const rows: ExportData[] = results.map((item) => {
    sumServices += item.totals.totalServices;
    sumCost += item.totals.totalCost;

    return {
      ID: item.mechanic.id,
      Nombre: item.mechanic.firstName,
      Apellido: item.mechanic.lastName,
      Cédula: item.mechanic.documentId,
      'Servicios Realizados': item.totals.totalServices,
      'Costo Total ($)': item.totals.totalCost,
      Sucursal: item.mechanic.branch?.name ?? '',
    };
  });

  rows.push({
    ID: 'TOTALES',
    Nombre: '-',
    Apellido: '-',
    Cédula: '-',
    'Servicios Realizados': sumServices,
    'Costo Total ($)': sumCost,
    Sucursal: '-',
  });

  exportToXLSX(rows, 'Reporte de Mecánicos');
}

export function MechanicsReportTable() {
  const token = useToken();
  const branchId = useCurrentBranchId();
  const branchIdString = branchId != null ? branchId.toString() : '';

  const bikeServicesService = useMemo(() => new BikeServicesService(), []);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [mechanicInput, setMechanicInput] = useState('');

  const [appliedMechanic, setAppliedMechanic] = useState('');
  const [appliedStart, setAppliedStart] = useState('');
  const [appliedFinish, setAppliedFinish] = useState('');
  // Remonta el FilterDate para reiniciar su selección interna
  const [dateFilterKey, setDateFilterKey] = useState(0);

  const [selectedMechanic, setSelectedMechanic] =
    useState<MechanicReportItem | null>(null);
  // Qué tipo de servicio está expandido dentro del modal actual (un producto
  // a la vez); se resetea al cambiar/cerrar de mecánico.
  const [expandedProductId, setExpandedProductId] = useState<number | null>(
    null
  );
  const closeModal = () => {
    setSelectedMechanic(null);
    setExpandedProductId(null);
  };

  const hasActiveFilters = !!(appliedMechanic || appliedStart || appliedFinish);

  const handleSearch = () => {
    setAppliedMechanic(mechanicInput);
    setPage(1);
  };

  // El rango de fechas se aplica al instante, sin pasar por "Buscar"
  const handleDateChange = (start?: string, finish?: string) => {
    setAppliedStart(start ?? '');
    setAppliedFinish(finish ?? '');
    setPage(1);
  };

  const clearFilters = () => {
    setMechanicInput('');
    setAppliedMechanic('');
    setAppliedStart('');
    setAppliedFinish('');
    setDateFilterKey((k) => k + 1);
    setPage(1);
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      'mechanics-report',
      {
        branchIdString,
        page,
        pageSize,
        appliedMechanic,
        appliedStart,
        appliedFinish,
      },
    ],
    queryFn: () =>
      bikeServicesService.getMechanicsReport(token as string, branchIdString, {
        page: String(page),
        pageSize: String(pageSize),
        mechanic: appliedMechanic || undefined,
        start: appliedStart || undefined,
        finish: appliedFinish || undefined,
      }),
    enabled: !!token && !!branchIdString,
  });

  const results = data?.data?.results ?? [];
  const totalPages = data?.data?.totalPages ?? 1;
  const currentPage = data?.data?.currentPage ?? page;
  const totalElements = data?.data?.totalElements ?? 0;

  const columns: GenericTableColumn<MechanicReportItem>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '5rem',
      // Al hacer click en el ID se abre el detalle del mecánico
      onCellClick: (item) => {
        setSelectedMechanic(item);
        setExpandedProductId(null);
      },
      render: (item) => item.mechanic.id,
    },
    {
      key: 'firstName',
      header: 'Nombre',
      render: (item) => item.mechanic.firstName,
    },
    {
      key: 'lastName',
      header: 'Apellido',
      render: (item) => item.mechanic.lastName,
    },
    {
      key: 'documentId',
      header: 'Cédula',
      render: (item) => item.mechanic.documentId,
    },
    {
      key: 'totalServices',
      header: 'Servicios Realizados',
      render: (item) => item.totals.totalServices,
    },
    {
      key: 'totalCost',
      header: 'Costo Total',
      render: (item) => `$${item.totals.totalCost.toFixed(2)}`,
    },
    {
      key: 'branch',
      header: 'Sucursal',
      // Solo para el super admin: en una sucursal todas las filas son iguales
      hidden: branchId !== 0,
      render: (item) => item.mechanic.branch?.name ?? '-',
    },
  ];

  if (isError) {
    return (
      <div className="py-8 text-center text-red-500">
        Error al cargar el reporte de mecánicos.
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="ml-2"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="py-3">
      {/* Filtros */}
      <div className="flex flex-col gap-4 my-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={mechanicInput}
            onChange={(e) => setMechanicInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar mecánico..."
            className="px-3 py-2 border rounded-md min-w-[200px]"
          />

          <Button onClick={handleSearch} size="sm">
            Buscar
          </Button>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* Filtro de fechas */}
        <div className="flex items-center">
          <FilterDate key={dateFilterKey} onChange={handleDateChange} />
        </div>
      </div>

      <div className="flex justify-end items-center mb-2">
        <Button
          variant="outline"
          size="sm"
          disabled={results.length === 0 || isLoading}
          onClick={() => exportMechanicsReport(results)}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Descargar
        </Button>
      </div>

      <GenericTable<MechanicReportItem>
        columns={columns}
        data={results}
        getRowKey={(item) => item.mechanic.id}
        isLoading={isLoading}
        emptyMessage="No hay resultados para mostrar"
        pagination={{
          currentPage,
          totalPages,
          totalElements,
          pageSize,
          onPageChange: setPage,
          onPageSizeChange: (newPageSize) => {
            setPageSize(newPageSize);
            setPage(1);
          },
        }}
      />

      {selectedMechanic && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-5 pb-3 border-b border-gray-300 bg-gray-200">
              <h2 className="text-xl font-semibold font-serif text-gray-800">
                Detalle del Mecánico
              </h2>
              <p className="text-md text-gray-700 mt-1">
                <span className="text-green-600 font-medium">
                  {selectedMechanic.mechanic.id}
                </span>{' '}
                - {selectedMechanic.mechanic.firstName}{' '}
                {selectedMechanic.mechanic.lastName}
              </p>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 gap-3 text-md bg-gray-50 rounded-lg p-4 justify-items-center">
                <div className="bg-blue-50 rounded-md p-3 text-center w-full">
                  <span className="text-gray-500 text-md">
                    Servicios Realizados
                  </span>
                  <p className="text-xl font-bold text-blue-600">
                    {selectedMechanic.totals.totalServices}
                  </p>
                </div>
                <div className="bg-green-50 rounded-md p-3 text-center w-full">
                  <span className="text-gray-500 text-md">Costo Total</span>
                  <p className="text-xl font-bold text-green-600">
                    ${selectedMechanic.totals.totalCost.toFixed(2)}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800 text-center pb-2 mb-3 border-b border-gray-300">
                  Servicios Realizados
                </h3>
                <div className="border rounded-lg overflow-hidden text-sm">
                  <div className="grid grid-cols-[auto_1fr_auto_auto] bg-gray-100 px-4 py-2 font-medium text-gray-600 text-xs uppercase">
                    <span />
                    <span>Servicio</span>
                    <span className="text-right pr-4">Cant.</span>
                    <span className="text-right">Costo</span>
                  </div>
                  <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                    {selectedMechanic.servicesBreakdown.map((service) => {
                      const isExpanded =
                        expandedProductId === service.productId;
                      return (
                        <li key={service.productId}>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedProductId(
                                isExpanded ? null : service.productId
                              )
                            }
                            className="w-full grid grid-cols-[auto_1fr_auto_auto] items-center px-4 py-2 text-left hover:bg-gray-50"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-gray-700">
                              {service.name}
                            </span>
                            <span className="text-gray-500 text-right pr-4 whitespace-nowrap">
                              {service.quantity}
                            </span>
                            <span className="text-gray-700 text-right whitespace-nowrap">
                              ${service.totalCost.toFixed(2)}
                            </span>
                          </button>
                          {isExpanded && (
                            <div className="bg-gray-50 px-4 py-2 border-t border-gray-100">
                              <div className="grid grid-cols-[1fr_1fr_auto_1fr] gap-2 text-xs font-medium text-gray-500 uppercase pb-1">
                                <span>Moto</span>
                                <span>Placa</span>
                                <span>Fecha</span>
                                <span>Cliente</span>
                              </div>
                              <ul className="divide-y divide-gray-100">
                                {service.services.map((line) => (
                                  <li
                                    key={line.transactionId}
                                    className="grid grid-cols-[1fr_1fr_auto_1fr] gap-2 py-1.5 text-xs"
                                  >
                                    <span className="text-gray-700">
                                      {line.model ?? '—'}
                                    </span>
                                    <span className="text-gray-700">
                                      {line.plate || '—'}
                                    </span>
                                    <span className="text-gray-500 whitespace-nowrap">
                                      {formatDate(line.receptionDate)}
                                    </span>
                                    <span className="text-gray-700">
                                      {line.client ?? '—'}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
            <div className="px-6 pb-5 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={closeModal}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
