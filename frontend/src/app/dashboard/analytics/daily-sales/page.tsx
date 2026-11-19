'use client';

import React, { useRef, useEffect, useMemo, useState } from 'react';
import * as echarts from 'echarts';
import { useToken } from '@/stores/auth/auth.store';
import UtilityDetailsModal from '@/components/modals/UtilityDetailsModal.component';
import { Button } from '@/components/ui/button.component';
import { FilterDate } from '@/components/ui/filterDate.component';
import FilterDropdown from '@/components/ui/filterDropdown.component';
import { useUtilityData } from '@/hooks/useUtilityData';
import {
  UtilityBranchData,
  UtilityProduct,
  SearchType,
} from '@/services/transactions/types/SalesReport.type';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.component';

type MetricType = 'utility' | 'soldQuantity' | 'boughtQuantity';

const UtilityChart = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const token = useToken();
  const getDefaultDates = () => {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      startDate: formatDate(lastMonth),
      endDate: formatDate(today),
    };
  };

  const defaultDates = getDefaultDates();

  const [startDate, setStartDate] = useState<string>(defaultDates.startDate);
  const [endDate, setEndDate] = useState<string>(defaultDates.endDate);
  const [searchType, setSearchType] = useState<SearchType>('bikes');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]); // Nuevo estado para modelos
  const [metricType, setMetricType] = useState<MetricType>('utility');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false); // Nuevo estado para dropdown de modelos
  const [selectedBranch, setSelectedBranch] = useState<{
    branchName: string;
    branchId: number;
    products: any[];
  } | null>(null);
  const [showTable, setShowTable] = useState(false);

  const {
    data: apiData,
    isLoading,
    error,
    isError,
    isFetching,
    refetch,
  } = useUtilityData({
    branchId: '29',
    search: searchType,
    view: 'global',
    startDate,
    endDate,
  });

  // Sin rango seleccionado se vuelve al período por defecto (último mes)
  const handleDateChange = (start?: string, end?: string) => {
    setStartDate(start ?? defaultDates.startDate);
    setEndDate(end ?? defaultDates.endDate);
  };

  // Obtener todas las sucursales disponibles
  const branches = useMemo(() => {
    if (!apiData?.data) return [];
    return apiData.data.map((branch) => ({
      id: branch.branchId,
      name: branch.branchName,
      products: branch.products,
    }));
  }, [apiData]);

  // Obtener opciones de sucursales para el filtro
  const locationOptions = useMemo(() => {
    if (!branches.length) return [];
    return branches.map((branch) => ({
      value: branch.name,
      label: branch.name,
    }));
  }, [branches]);

  // Obtener opciones de productos para el filtro
  const productOptions = useMemo(() => {
    if (!apiData?.data) return [];

    const productsSet = new Set<string>();

    apiData.data.forEach((branch: UtilityBranchData) => {
      branch.products.forEach((product: UtilityProduct) => {
        let modelMatches = true;
        if (searchType === 'parts' && selectedModels.length > 0) {
          const productModel = product.productModel || 'Todos';
          modelMatches =
            productModel === 'Todos' || selectedModels.includes(productModel);
        }

        if (modelMatches) {
          productsSet.add(product.productName);
        }
      });
    });

    return Array.from(productsSet)
      .sort()
      .map((prod) => ({ value: prod, label: prod }));
  }, [apiData, searchType, selectedModels]);

  // Obtener opciones de modelos para el filtro
  const modelOptions = useMemo(() => {
    if (searchType !== 'parts' || !apiData?.data) return [];

    const modelsSet = new Set<string>();

    apiData.data.forEach((branch: UtilityBranchData) => {
      branch.products.forEach((product: UtilityProduct) => {
        const model = product.productModel || 'Todos';
        modelsSet.add(model);
      });
    });

    return Array.from(modelsSet)
      .sort()
      .map((model) => ({ value: model, label: model }));
  }, [apiData, searchType]);

  // Obtener el valor de la métrica seleccionada para un producto
  const getMetricValue = (
    product: UtilityProduct,
    metric: MetricType
  ): number => {
    switch (metric) {
      case 'utility':
        return Number(product.utility) || 0;
      case 'soldQuantity':
        return Number(product.soldQuantity) || 0;
      case 'boughtQuantity':
        return Number(product.boughtQuantity) || 0;
      default:
        return 0;
    }
  };

  // Obtener el nombre de la métrica para mostrar
  const getMetricName = (metric: MetricType): string => {
    switch (metric) {
      case 'utility':
        return 'Utilidad';
      case 'soldQuantity':
        return 'Cantidad Vendida';
      case 'boughtQuantity':
        return 'Cantidad Comprada';
      default:
        return '';
    }
  };

  // Preparar datos para el gráfico
  const chartData = useMemo(() => {
    if (!apiData?.data) return [];

    const filteredBranches = branches.filter((branch) => {
      if (selectedLocations.length === 0) return true;
      return selectedLocations.includes(branch.name);
    });

    return filteredBranches
      .map((branch) => {
        let totalValue = 0;
        const productsData: any[] = [];

        branch.products.forEach((product) => {
          let productMatches =
            selectedProducts.length === 0 ||
            selectedProducts.includes(product.productName);

          let modelMatches = true;
          if (searchType === 'parts' && selectedModels.length > 0) {
            const productModel = product.productModel || 'Todos';
            modelMatches =
              productModel === 'Todos' || selectedModels.includes(productModel);
          }

          if (productMatches && modelMatches) {
            const value = getMetricValue(product, metricType);
            totalValue += value;

            productsData.push({
              name: product.productName,
              model: product.productModel || 'Todos',
              value: value,
              utility: Number(product.utility) || 0,
              soldQuantity: Number(product.soldQuantity) || 0,
              boughtQuantity: Number(product.boughtQuantity) || 0,
              boughtAmount: Number(product.boughtAmount) || 0,
              soldAmount: Number(product.soldAmount) || 0,
              beginningInventory: Number(product.beginningInventory) || 0,
              endingInventory: Number(product.endingInventory) || 0,
            });
          }
        });

        return {
          branchName: branch.name,
          branchId: branch.id,
          totalValue,
          products: productsData,
        };
      })
      .sort((a, b) => b.totalValue - a.totalValue);
  }, [
    apiData,
    branches,
    selectedLocations,
    selectedProducts,
    selectedModels,
    metricType,
    searchType,
  ]);

  const globalTotals = useMemo(() => {
    if (!chartData.length)
      return { totalUtility: 0, totalSales: 0, totalPurchases: 0 };

    return chartData.reduce(
      (acc, branch) => {
        branch.products.forEach((product) => {
          acc.totalUtility += product.utility || 0;
          acc.totalSales += product.soldQuantity || 0;
          acc.totalPurchases += product.boughtQuantity || 0;
        });
        return acc;
      },
      { totalUtility: 0, totalSales: 0, totalPurchases: 0 }
    );
  }, [chartData]);

  // Generar colores para los productos
  const generateColors = (count: number) => {
    const colors = [
      '#5470C6',
      '#438126',
      '#6df966',
      '#7e0303',
      '#54b4db',
      '#9A60B4',
      '#FC8452',
      '#EA7CCC',
      '#c14945',
      '#C6E579',
      '#F4E001',
      '#ea1fbb',
      '#46bcbc',
      '#FFB980',
      '#A5D7C6',
    ];

    if (count <= colors.length) {
      return colors.slice(0, count);
    }

    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    return result;
  };

  // Efecto para renderizar el gráfico
  useEffect(() => {
    if (!chartRef.current || chartData.length === 0) {
      return;
    }

    const chartInstance = echarts.init(chartRef.current);

    const isBikes = searchType === 'bikes';

    let option: any;

    if (isBikes) {
      const allProducts = new Set<string>();
      chartData.forEach((branch) => {
        branch.products.forEach((product: any) => {
          allProducts.add(product.name);
        });
      });
      const productList = Array.from(allProducts).sort();
      const colors = generateColors(productList.length);

      const series = productList.map((productName, index) => ({
        name: productName,
        type: 'bar',
        stack: 'total',
        data: chartData.map((branch) => {
          const product = branch.products.find(
            (p: any) => p.name === productName
          );
          return product ? product.value : 0;
        }),
        itemStyle: {
          color: colors[index],
          borderRadius:
            index === productList.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0],
        },
        label: {
          show: false,
        },
      }));

      option = {
        title: {
          text: `${getMetricName(metricType)} por Sucursal - Motos`,
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow',
          },
          formatter: (params: any) => {
            const branchData = chartData[params[0].dataIndex];
            let result = `<div style="font-weight:bold;margin-bottom:4px;">${branchData.branchName}</div>`;
            result += `<hr style="margin:8px 0;border-top:1px solid #ddd;">`;

            if (branchData.products.length === 0) {
              result += `<div>No hay productos en este período</div>`;
            } else {
              branchData.products.forEach((product: any, index: number) => {
                const value = product.value;
                const formattedValue =
                  metricType === 'utility'
                    ? value.toLocaleString('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })
                    : value.toLocaleString();

                result += `<div style="margin:4px 0;">
                  <div><strong>${product.name}:</strong> ${formattedValue}</div>
                </div>`;
                if (index < branchData.products.length - 1) {
                  result += `<div style="border-top:1px solid #eee; margin:4px 0;"></div>`;
                }
              });
            }
            result += `<hr style="margin:8px 0;border-top:1px solid #ddd;">`;
            result += `<div style="margin-bottom:4px;"><strong>Total ${getMetricName(metricType)}:</strong> ${
              metricType === 'utility'
                ? branchData.totalValue.toLocaleString('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })
                : branchData.totalValue.toLocaleString()
            }</div>`;
            return result;
          },
        },
        legend: {
          data: productList,
          bottom: 10,
          type: 'scroll',
          pageButtonItemGap: 5,
          pageButtonGap: 5,
          pageIconColor: '#64748b',
          pageIconInactiveColor: '#cbd5e1',
          pageIconSize: 12,
          pageTextStyle: {
            color: '#64748b',
            fontSize: 10,
          },
          pageFormatter: '{current}/{total}',
          selector: [
            {
              type: 'all',
              title: 'Todas',
            },
            {
              type: 'inverse',
              title: 'Ninguna',
            },
          ],
          selectorLabel: {
            show: true,
            position: 'end',
            margin: 8,
            color: '#64748b',
            fontSize: 10,
          },
          selectedMode: 'multiple',
          itemGap: 6,
          itemWidth: 15,
          itemHeight: 14,
          textStyle: {
            fontSize: 12,
            overflow: 'truncate',
            width: 100,
          },
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: productList.length > 0 ? '25%' : '10%',
          top: '15%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          data: chartData.map((item) => item.branchName),
          axisLabel: {
            rotate: 45,
            fontSize: 12,
            interval: 0,
          },
        },
        yAxis: {
          type: 'value',
          name: getMetricName(metricType),
          axisLabel: {
            formatter: (value: number) => {
              return metricType === 'utility'
                ? value.toLocaleString('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })
                : value.toLocaleString();
            },
          },
        },
        series: series,
      };
    } else {
      option = {
        title: {
          text: `${getMetricName(metricType)} por Sucursal - Repuestos`,
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        tooltip: {
          show: false,
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '10%',
          top: '15%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          data: chartData.map((item) => item.branchName),
          axisLabel: {
            rotate: 45,
            fontSize: 12,
            interval: 0,
          },
        },
        yAxis: {
          type: 'value',
          name: getMetricName(metricType),
          axisLabel: {
            formatter: (value: number) => {
              return metricType === 'utility'
                ? value.toLocaleString('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })
                : value.toLocaleString();
            },
          },
        },
        series: [
          {
            name: getMetricName(metricType),
            type: 'bar',
            data: chartData.map((item) => item.totalValue),
            itemStyle: {
              color: '#5470C6',
              borderRadius: [4, 4, 0, 0],
            },
            label: {
              show: true,
              position: 'top',
              formatter: (params: any) => {
                return metricType === 'utility'
                  ? params.value.toLocaleString('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })
                  : params.value.toLocaleString();
              },
              fontSize: 10,
              rotate: 0,
            },
          },
        ],
      };
    }

    chartInstance.setOption(option);
    chartInstance.resize();

    // Manejador de click en las barras
    chartInstance.on('click', (params: any) => {
      if (params.componentType === 'series' && params.seriesType === 'bar') {
        const branchData = chartData[params.dataIndex];
        setSelectedBranch({
          branchName: branchData.branchName,
          branchId: branchData.branchId,
          products: branchData.products,
        });
        setShowTable(true);
      }
    });

    const handleResize = () => {
      chartInstance.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.off('click');
      chartInstance.dispose();
    };
  }, [chartData, searchType, metricType]);

  // Handlers para filtros
  const handleProductToggle = (product: string) => {
    setSelectedProducts((prev) =>
      prev.includes(product)
        ? prev.filter((prod) => prod !== product)
        : [...prev, product]
    );
  };

  const handleLocationToggle = (location: string) => {
    setSelectedLocations((prev) =>
      prev.includes(location)
        ? prev.filter((loc) => loc !== location)
        : [...prev, location]
    );
  };

  const handleModelToggle = (model: string) => {
    setSelectedModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    );
  };

  const handleKpiClick = () => {
    const allProducts = chartData.flatMap((branch) => branch.products);
    const groupedProductsMap = new Map<string, any>();
    allProducts.forEach((product) => {
      if (groupedProductsMap.has(product.name)) {
        const existing = groupedProductsMap.get(product.name);
        existing.utility += product.utility;
        existing.soldQuantity += product.soldQuantity;
        existing.boughtQuantity += product.boughtQuantity;
        existing.soldAmount += product.soldAmount;
        existing.boughtAmount += product.boughtAmount;
        existing.beginningInventory += product.beginningInventory;
        existing.endingInventory += product.endingInventory;
        existing.value += product.value;
      } else {
        groupedProductsMap.set(product.name, { ...product });
      }
    });
    const groupedProducts = Array.from(groupedProductsMap.values());

    setSelectedBranch({
      branchName: 'Todas las sucursales',
      branchId: 0,
      products: groupedProducts,
    });
    setShowTable(true);
  };

  const selectAllProducts = () => {
    setSelectedProducts(productOptions.map((opt) => opt.value));
  };

  const clearAllProducts = () => {
    setSelectedProducts([]);
  };

  const selectAllLocations = () => {
    setSelectedLocations(locationOptions.map((opt) => opt.value));
  };

  const clearAllLocations = () => {
    setSelectedLocations([]);
  };

  const selectAllModels = () => {
    setSelectedModels(modelOptions.map((opt) => opt.value));
  };

  const clearAllModels = () => {
    setSelectedModels([]);
  };

  const clearAllFilters = () => {
    setSelectedProducts([]);
    setSelectedLocations([]);
    setSelectedModels([]);
  };

  const metricOptions = [
    { value: 'utility', label: 'Utilidad' },
    { value: 'soldQuantity', label: 'Cantidad Vendida' },
    { value: 'boughtQuantity', label: 'Cantidad Comprada' },
  ];

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-lg shadow p-6 flex items-center justify-center h-96">
        <div className="text-gray-500 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full bg-white rounded-lg shadow p-6 flex items-center justify-center h-96">
        <div className="text-red-500 text-center">
          <p className="text-lg font-semibold mb-2">Error</p>
          <p>{error?.message || 'Error al cargar los datos'}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        {/* Selector de tipo de producto */}
        <div className="mb-8">
          <div className="grid grid-cols-2">
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setSearchType('bikes');
                  setSelectedProducts([]);
                  setSelectedLocations([]);
                  setSelectedModels([]);
                }}
                className={`text-2xl font-bold pb-3 transition-colors duration-200 ${
                  searchType === 'bikes'
                    ? 'text-black-600 border-b-2 border-black-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Motos
              </button>
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setSearchType('parts');
                  setSelectedProducts([]);
                  setSelectedLocations([]);
                  setSelectedModels([]);
                }}
                className={`text-2xl font-bold pb-3 transition-colors duration-200 ${
                  searchType === 'parts'
                    ? 'text-black-600 border-b-2 border-black-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Repuestos
              </button>
            </div>
          </div>
          <div className="h-px bg-gray-200"></div>
        </div>

        {/* Filtro de fechas */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <FilterDate onChange={handleDateChange} />
        </div>

        {/* Filtros Dropdown*/}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Filtro de metrica*/}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Métrica:
            </label>
            <select
              value={metricType}
              onChange={(e) => setMetricType(e.target.value as MetricType)}
              className="px-4 py-2 border rounded-md text-sm w-full bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {metricOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {/* Filtro de sucursales */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Sucursales:
            </label>
            <FilterDropdown
              label="Seleccionar sucursales"
              options={locationOptions}
              selectedValues={selectedLocations}
              onToggle={handleLocationToggle}
              showDropdown={showLocationDropdown}
              setShowDropdown={setShowLocationDropdown}
              onSelectAll={selectAllLocations}
              onClearAll={clearAllLocations}
              showSearch={true}
            />
          </div>
          {/* Filtro de modelos */}
          {searchType === 'parts' && modelOptions.length > 0 && (
            <div className="grid grid-cols-1 mb-6">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Modelos:
                </label>
                <FilterDropdown
                  label="Seleccionar modelos"
                  options={modelOptions}
                  selectedValues={selectedModels}
                  onToggle={handleModelToggle}
                  showDropdown={showModelDropdown}
                  setShowDropdown={setShowModelDropdown}
                  onSelectAll={selectAllModels}
                  onClearAll={clearAllModels}
                  showSearch={true}
                />
              </div>
            </div>
          )}

          {/* Filtro de productos */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Productos:
            </label>
            <FilterDropdown
              label="Seleccionar productos"
              options={productOptions}
              selectedValues={selectedProducts}
              onToggle={handleProductToggle}
              showDropdown={showProductDropdown}
              setShowDropdown={setShowProductDropdown}
              onSelectAll={selectAllProducts}
              onClearAll={clearAllProducts}
              showSearch={true}
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-center gap-4 mb-6">
          <Button onClick={clearAllFilters} variant="outline">
            Limpiar filtros
          </Button>
          <Button onClick={() => refetch()} variant="default">
            Actualizar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={handleKpiClick}
        >
          <CardHeader>
            <CardTitle>Utilidad Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {globalTotals.totalUtility.toLocaleString('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={handleKpiClick}
        >
          <CardHeader>
            <CardTitle>Ventas Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {globalTotals.totalSales.toLocaleString('es-CO')}
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={handleKpiClick}
        >
          <CardHeader>
            <CardTitle>Compras Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {globalTotals.totalPurchases.toLocaleString('es-CO')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico */}
      <div className="w-full">
        <div
          ref={chartRef}
          style={{ width: '100%', height: '500px', minHeight: '500px' }}
          className="bg-gray-50 border rounded"
        />
        {isFetching && (
          <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Información sobre filtros aplicados */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-600">
          <strong>Filtros aplicados:</strong>{' '}
          <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">
            Período: {startDate} - {endDate}
          </span>
          {selectedLocations.length > 0 && (
            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">
              Sucursales: {selectedLocations.length} seleccionadas
            </span>
          )}
          {selectedProducts.length > 0 && (
            <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs mr-2">
              Productos: {selectedProducts.length} seleccionados
            </span>
          )}
          {searchType === 'parts' && selectedModels.length > 0 && (
            <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs mr-2">
              Modelos: {selectedModels.length} seleccionados
            </span>
          )}
          <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs mr-2">
            {searchType === 'bikes' ? 'Motos' : 'Repuestos'}
          </span>
          <span className="inline-block bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
            Métrica: {metricOptions.find((m) => m.value === metricType)?.label}
          </span>
        </p>
      </div>

      {/* Modal de detalles */}
      <UtilityDetailsModal
        token={token}
        startDate={startDate}
        endDate={endDate}
        branchName={selectedBranch?.branchName || ''}
        branchId={selectedBranch?.branchId || 0}
        searchType={searchType}
        selectedProducts={selectedProducts}
        selectedModels={selectedModels}
        products={selectedBranch?.products || []}
        isOpen={showTable}
        onClose={() => {
          setShowTable(false);
          setSelectedBranch(null);
        }}
      />
    </div>
  );
};

export default UtilityChart;
