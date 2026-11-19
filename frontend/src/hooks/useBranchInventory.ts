import { useQuery } from '@tanstack/react-query';
import { ProductsService } from '@/services/products/products.service';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { useToken } from '@/stores/auth/auth.store';
import { useState } from 'react';
import { GetAllServiceQueryParametersType } from '@/services/products/types';
import { applyQueryConfig } from '@/config/queryOptimization.config';

const productsService = new ProductsService();

/** Consultas que dispara el hook. */
export type BranchInventoryQuery =
  | 'partInventory'
  | 'purchasedProducts'
  | 'soldProducts'
  | 'financialProducts'
  | 'bikeInventory'
  | 'generalBikeInventory';

export interface UseBranchInventoryOptions {
  /**
   * Enciende/apaga consultas concretas. Lo que no se nombra queda encendido,
   * así los consumidores que solo pasan parámetros no cambian.
   * Sirve para no disparar las seis consultas cuando la pantalla usa una:
   * `useBranchInventory(params, { enabled: { bikeInventory: esMoto } })`.
   * Ojo: con una consulta apagada su `isLoading` queda en `true` para siempre
   * (React Query v4), así que para estados de carga usá `isFetching`.
   */
  enabled?: Partial<Record<BranchInventoryQuery, boolean>>;
}

/**
 * Hook personalizado que centraliza las llamadas relacionadas con el inventario de una sucursal
 * Utiliza el currentBranchId del store global para mantener los datos actualizados
 * cuando el usuario cambia de sucursal mediante el BranchSelector
 * Ahora con soporte para paginación en inventarios de motos, inventario general de motos y repuestos
 */
export function useBranchInventory(
  initialQueryParameters: GetAllServiceQueryParametersType = {},
  options: UseBranchInventoryOptions = {}
) {
  // Obtener el token y el ID de sucursal del store global
  const token = useToken();
  const currentBranchId = useCurrentBranchId();
  const branchIdString = currentBranchId?.toString();

  // Estados para controlar la paginación de cada inventario
  const [bikeInventoryParams, setBikeInventoryParams] =
    useState<GetAllServiceQueryParametersType>({
      page: initialQueryParameters.page || '1',
      pageSize: initialQueryParameters.pageSize || '10',
      search: initialQueryParameters.search || '',
    });

  const [partInventoryParams, setPartInventoryParams] =
    useState<GetAllServiceQueryParametersType>({
      page: initialQueryParameters.page || '1',
      pageSize: initialQueryParameters.pageSize || '10',
      search: initialQueryParameters.search || '',
    });

  const [generalBikeInventoryParams, setGeneralBikeInventoryParams] =
    useState<GetAllServiceQueryParametersType>({
      page: initialQueryParameters.page || '1',
      pageSize: initialQueryParameters.pageSize || '10',
      search: initialQueryParameters.search || '',
    });

  // Preset compartido: caché de inventario y sin refetch al enfocar la ventana
  const inventoryQueryConfig = applyQueryConfig('INVENTORY');

  const isQueryEnabled = (query: BranchInventoryQuery) =>
    options.enabled?.[query] ?? true;

  // Inventario de repuestos con paginación
  const partInventory = useQuery({
    queryKey: ['partInventory', token, branchIdString, partInventoryParams],
    queryFn: () =>
      productsService.getPartInventory(
        token as string,
        branchIdString as string,
        partInventoryParams
      ),
    enabled: !!token && !!branchIdString && isQueryEnabled('partInventory'),
    keepPreviousData: true,
    ...inventoryQueryConfig,
  });

  // Productos comprados
  const purchasedProducts = useQuery({
    queryKey: ['purchasedProducts', token, branchIdString],
    queryFn: () =>
      productsService.getPurchasedProducts(
        token as string,
        branchIdString as string
      ),
    enabled: !!token && !!branchIdString && isQueryEnabled('purchasedProducts'),
    ...inventoryQueryConfig,
  });

  // Productos vendidos
  const soldProducts = useQuery({
    queryKey: ['soldProducts', token, branchIdString],
    queryFn: () =>
      productsService.getSoldProducts(
        token as string,
        branchIdString as string
      ),
    enabled: !!token && !!branchIdString && isQueryEnabled('soldProducts'),
    ...inventoryQueryConfig,
  });

  // Productos financieros
  const financialProducts = useQuery({
    queryKey: ['financialProducts', token],
    queryFn: () => productsService.getAllFinancialProducts(token as string),
    enabled: !!token && isQueryEnabled('financialProducts'),
    ...inventoryQueryConfig,
  });

  /**
   * Inventario de motos con paginación.
   *
   * `keepPreviousData` es lo que sostiene la tabla mientras se escribe en el
   * buscador o se marca "usadas": cada cambio de filtro es una queryKey nueva,
   * así que sin esto `isLoading` volvería a `true` y la vista se vaciaría en
   * cada tecla. Con esto se mantienen los datos anteriores y solo `isFetching`
   * avisa que hay una consulta en curso.
   */
  const bikeInventory = useQuery({
    queryKey: ['bikeInventory', token, branchIdString, bikeInventoryParams],
    queryFn: () =>
      productsService.getBikeInventory(
        token as string,
        branchIdString as string,
        bikeInventoryParams
      ),
    enabled: !!token && !!branchIdString && isQueryEnabled('bikeInventory'),
    keepPreviousData: true,
    ...inventoryQueryConfig,
  });

  // Inventario general de motos con paginación
  const generalBikeInventory = useQuery({
    queryKey: [
      'generalBikeInventory',
      token,
      branchIdString,
      generalBikeInventoryParams,
    ],
    queryFn: () =>
      productsService.getGeneralBikeInventory(
        token as string,
        branchIdString as string,
        generalBikeInventoryParams
      ),
    enabled:
      !!token && !!branchIdString && isQueryEnabled('generalBikeInventory'),
    keepPreviousData: true,
    ...inventoryQueryConfig,
  });

  // Funciones para cambiar la página de cada inventario
  const setBikeInventoryPage = (page: number) => {
    setBikeInventoryParams((prev) => ({
      ...prev,
      page: page.toString(),
    }));
  };

  const setPartInventoryPage = (page: number) => {
    setPartInventoryParams((prev) => ({
      ...prev,
      page: page.toString(),
    }));
  };

  const setGeneralBikeInventoryPage = (page: number) => {
    setGeneralBikeInventoryParams((prev) => ({
      ...prev,
      page: page.toString(),
    }));
  };

  // Funciones para cambiar los parámetros de búsqueda de cada inventario
  const setBikeInventorySearch = (search: string) => {
    setBikeInventoryParams((prev) => ({
      ...prev,
      search,
      page: '1',
    }));
  };

  const setPartInventorySearch = (search: string) => {
    setPartInventoryParams((prev) => ({
      ...prev,
      search,
      page: '1',
    }));
  };

  // "Ver por recibir de Empire" en la matriz de todas las sucursales: el
  // backend agrega las filas y columnas que sólo tienen motos por recibir.
  const setGeneralBikeInventoryPending = (pending: boolean) => {
    setGeneralBikeInventoryParams((prev) =>
      (prev.pending === 'true') === pending
        ? prev
        : { ...prev, pending: pending ? 'true' : undefined, page: '1' }
    );
  };

  const setGeneralBikeInventorySearch = (search: string) => {
    setGeneralBikeInventoryParams((prev) => ({
      ...prev,
      search,
      page: '1',
    }));
  };

  /**
   * Filtro de motos usadas. Al desmarcar se quita la clave en vez de mandarla
   * en `false`, así el parámetro desaparece de la URL de la consulta.
   */
  const setBikeInventoryUsed = (used: boolean) => {
    setBikeInventoryParams((prev) => {
      const { used: previousUsed, ...rest } = prev;
      return used
        ? { ...rest, used: 'true', page: '1' }
        : { ...rest, page: '1' };
    });
  };

  /**
   * Filtro de motos con GPS (lo usa el destino Arranca). Igual que `used`: al
   * apagarlo se quita la clave para que `needGps` no viaje en la consulta.
   */
  const setBikeInventoryNeedGps = (needGps: boolean) => {
    setBikeInventoryParams((prev) => {
      const { needGps: previousNeedGps, ...rest } = prev;
      return needGps
        ? { ...rest, needGps: 'true', page: '1' }
        : { ...rest, page: '1' };
    });
  };

  /**
   * Refresca todos los datos. Las consultas apagadas por `options.enabled` se
   * saltan: `refetch()` ignora `enabled` y las traería igual.
   */
  const refetchAll = () => {
    if (isQueryEnabled('partInventory')) partInventory.refetch();
    if (isQueryEnabled('purchasedProducts')) purchasedProducts.refetch();
    if (isQueryEnabled('soldProducts')) soldProducts.refetch();
    if (isQueryEnabled('financialProducts')) financialProducts.refetch();
    if (isQueryEnabled('bikeInventory')) bikeInventory.refetch();
    if (isQueryEnabled('generalBikeInventory')) generalBikeInventory.refetch();
  };

  return {
    // Datos
    partInventory: {
      data: partInventory.data?.data,
      isLoading: partInventory.isLoading,
      isFetching: partInventory.isFetching,
      isError: partInventory.isError,
      refetch: partInventory.refetch,
      pagination: {
        currentPage: parseInt(partInventoryParams.page || '1', 10),
        pageSize: parseInt(partInventoryParams.pageSize || '10', 10),
        setPage: setPartInventoryPage,
      },
      queryParameters: partInventoryParams,
      setSearch: setPartInventorySearch,
    },
    purchasedProducts: {
      data: purchasedProducts.data?.data,
      isLoading: purchasedProducts.isLoading,
      isError: purchasedProducts.isError,
      refetch: purchasedProducts.refetch,
    },
    soldProducts: {
      data: soldProducts.data?.data,
      isLoading: soldProducts.isLoading,
      isError: soldProducts.isError,
      refetch: soldProducts.refetch,
    },
    financialProducts: {
      data: financialProducts.data?.data,
      isLoading: financialProducts.isLoading,
      isError: financialProducts.isError,
      refetch: financialProducts.refetch,
    },
    bikeInventory: {
      data: bikeInventory.data?.data,
      isLoading: bikeInventory.isLoading,
      isFetching: bikeInventory.isFetching,
      isError: bikeInventory.isError,
      refetch: bikeInventory.refetch,
      pagination: {
        currentPage: parseInt(bikeInventoryParams.page || '1', 10),
        pageSize: parseInt(bikeInventoryParams.pageSize || '10', 10),
        setPage: setBikeInventoryPage,
      },
      queryParameters: bikeInventoryParams,
      setSearch: setBikeInventorySearch,
      setUsed: setBikeInventoryUsed,
      setNeedGps: setBikeInventoryNeedGps,
    },
    generalBikeInventory: {
      data: generalBikeInventory.data?.data,
      isLoading: generalBikeInventory.isLoading,
      isFetching: generalBikeInventory.isFetching,
      isError: generalBikeInventory.isError,
      refetch: generalBikeInventory.refetch,
      pagination: {
        currentPage: parseInt(generalBikeInventoryParams.page || '1', 10),
        pageSize: parseInt(generalBikeInventoryParams.pageSize || '10', 10),
        setPage: setGeneralBikeInventoryPage,
      },
      queryParameters: generalBikeInventoryParams,
      setSearch: setGeneralBikeInventorySearch,
      setPending: setGeneralBikeInventoryPending,
    },
    // Utilidades
    refetchAll,
    // Información de contexto
    currentBranchId,
  };
}
