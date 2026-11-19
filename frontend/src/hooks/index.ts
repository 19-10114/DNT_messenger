import { useDocxProcessor } from './useDocxProcessor';
import { usePDFProcessor } from './usePDFProcessor';
import { useExchangeRate } from './useExchangeRate';
import { useTransactions } from './useTransactions';
import {
  useCanRevert,
  useRevertOrder,
  useRevertTransaction,
} from './useRevertMovement';
import { useDebtObjects } from './useDebtObjects';
import { useBranchInventory } from './useBranchInventory';
import { useDailyReport } from './useDailyReport';
import { useCashObjects } from './useCashObjects';
import { useGlobalPartInventory } from './useGlobalPartInventory';
import { useAllBranches } from './useAllBranches';
import {
  useCarouselImages,
  useFeaturedCarouselImages,
  useCreateCarouselImage,
  useUpdateCarouselImage,
  useDeleteCarouselImage,
} from './useCarouselImages';
import { useCarousel } from './useCarousel';
import {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
} from './useMediaQuery';

export {
  useDocxProcessor,
  usePDFProcessor,
  useExchangeRate,
  useTransactions,
  useCanRevert,
  useRevertOrder,
  useRevertTransaction,
  useBranchInventory,
  useDebtObjects,
  useDailyReport,
  useCashObjects,
  useGlobalPartInventory,
  useAllBranches,
  useCarouselImages,
  useCarousel,
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useFeaturedCarouselImages,
  useCreateCarouselImage,
  useUpdateCarouselImage,
  useDeleteCarouselImage,
};

// Hooks de productos (seccionados en hooks/products)
export * from './products';

// Hooks del Módulo de Gastos (seccionados en hooks/expenses)
export * from './expenses';
// Proveedores (hooks/suppliers)
export * from './suppliers';

// Hooks de soporte (hooks/support)
export * from './support';
