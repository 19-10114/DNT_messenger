import { useQuery, useQueries } from '@tanstack/react-query';
import { TransactionService } from '@/services/transactions/transactions.service';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import {
  SalesReportBackendResponse,
  SalesReportCategory,
} from '@/services/transactions/types/SalesReport.type';
import {
  SalesReportSummary,
  VehicleReportRow,
  SpareReportRow,
} from '@/models/salesReport.model';

const service = new TransactionService();

interface BaseParams {
  start: string;
  finish: string;
  dp: boolean;
  page?: string;
  pageSize?: string;
}

export function useSalesReportCategory(
  category: SalesReportCategory,
  params: BaseParams,
  enabled: boolean = true
) {
  const token = useToken();
  const branchId = useCurrentBranchId();
  const branchIdString =
    branchId !== undefined && branchId !== null
      ? branchId.toString()
      : undefined;

  return useQuery({
    queryKey: [
      'salesReport',
      category,
      token,
      branchIdString,
      params.start,
      params.finish,
      params.dp,
      params.page,
      params.pageSize,
    ],
    queryFn: () =>
      service.getSalesReport(token, branchIdString as string, {
        start: params.start,
        finish: params.finish,
        category,
        dp: params.dp,
        page: params.page,
        pageSize: params.pageSize,
      }),
    enabled: !!token && !!branchIdString && enabled,
  });
}

export function useSalesReport(params: BaseParams, enabled: boolean = false) {
  const token = useToken();
  const branchId = useCurrentBranchId();
  const branchIdString =
    branchId !== undefined && branchId !== null
      ? branchId.toString()
      : undefined;

  const queries = useQueries({
    queries: (['bikes', 'mfb', 'parts'] as SalesReportCategory[]).map(
      (category) => ({
        queryKey: [
          'salesReport',
          category,
          token,
          branchIdString,
          params.start,
          params.finish,
          params.dp,
          params.page,
          params.pageSize,
        ],
        queryFn: () =>
          service.getSalesReport(token, branchIdString as string, {
            start: params.start,
            finish: params.finish,
            category,
            dp: params.dp ?? false,
            page: params.page,
            pageSize: params.pageSize,
          }),
        enabled: !!token && !!branchIdString && enabled,
        refetchOnWindowFocus: false,
        keepPreviousData: true,
      })
    ),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);

  const bikes = queries[0].data as
    | SalesReportBackendResponse['data']
    | undefined;
  const mfb = queries[1].data as SalesReportBackendResponse['data'] | undefined;
  const parts = queries[2].data as
    | SalesReportBackendResponse['data']
    | undefined;

  // Helper to safely extract number from MonetaryValue or number
  const getValue = (val: any): number => {
    if (typeof val === 'number') return val;
    if (val && typeof val === 'object' && 'parsedValue' in val) {
      return val.parsedValue;
    }
    return 0;
  };

  const totalUsd =
    getValue(bikes?.staticData?.totals.totalUsd) +
    getValue(mfb?.staticData?.totals.totalUsd) +
    getValue(parts?.staticData?.totals.totalUsd);

  const totalReceivedUsd =
    getValue(bikes?.staticData?.totals.usd) +
    getValue(mfb?.staticData?.totals.usd) +
    getValue(parts?.staticData?.totals.usd);

  const totalReceivedBs =
    getValue(bikes?.staticData?.totals.bs) +
    getValue(mfb?.staticData?.totals.bs) +
    getValue(parts?.staticData?.totals.bs);

  const summary: SalesReportSummary = {
    totalSales: totalUsd,
    totalBs: 0,
    totalUsd: totalReceivedUsd,
    receivedUsd: totalReceivedUsd,
    receivedBs: totalReceivedBs,
    motosQuantity: bikes?.staticData?.totals.totalQuantity ?? 0,
    motosAmount: getValue(bikes?.staticData?.totals.totalUsd),
    mfbQuantity: mfb?.staticData?.totals.totalQuantity ?? 0,
    mfbAmount: getValue(mfb?.staticData?.totals.totalUsd),
    repuestosQuantity: parts?.staticData?.totals.totalQuantity ?? 0,
    repuestosAmount: getValue(parts?.staticData?.totals.totalUsd),
  };

  const mapToRow = (r: any): any => {
    const variants = r.colors
      ? Object.entries(r.colors).map(([color, detail]: [string, any]) => ({
          color,
          hexColor: detail.hex,
          quantity: getValue(detail.quantity),
          dpQuantity: getValue(detail.dpQuantity),
        }))
      : [];

    return {
      id: r.id,
      modelo: r.name,
      cantidad: getValue(r.quantity),
      dpCantidad: getValue(r.dpQuantity),
      usd: getValue(r.totalUsd),
      bs: 0,
      receivedUsd: getValue(r.usd),
      receivedBs: getValue(r.bs),
      variants,
      items:
        r.items?.map((i: any) => ({
          ...i,
          sourceBranch: i.branchName, // Mapping branchName to sourceBranch for UI consistency
          branchId: i.branchId,
        })) || [],
    };
  };

  const vehicleRows: VehicleReportRow[] = [
    ...(bikes?.results ?? []).map(mapToRow),
    ...(mfb?.results ?? []).map(mapToRow),
  ];

  const spareRows: SpareReportRow[] = (parts?.results ?? []).map((r) => ({
    id: r.id,
    producto: r.name,
    cantidad: getValue(r.quantity),
    dpCantidad: getValue(r.dpQuantity),
    usd: getValue(r.totalUsd),
    bs: 0,
    receivedUsd: getValue(r.usd),
    receivedBs: getValue(r.bs),
    items:
      r.items?.map((i: any) => ({
        ...i,
        sourceBranch: i.branchName,
        branchId: i.branchId,
      })) || [],
  }));

  const vehiclesTotalPages = Math.max(
    bikes?.totalPages ?? 1,
    mfb?.totalPages ?? 1
  );
  const vehiclesCurrentPage =
    bikes?.currentPage ?? mfb?.currentPage ?? Number(params.page ?? '1');

  const partsTotalPages = parts?.totalPages ?? 1;
  const partsCurrentPage = parts?.currentPage ?? Number(params.page ?? '1');

  return {
    isLoading,
    isError,
    summary,
    vehicleRows,
    spareRows,
    vehiclesPagination: {
      currentPage: vehiclesCurrentPage,
      totalPages: vehiclesTotalPages,
    },
    partsPagination: {
      currentPage: partsCurrentPage,
      totalPages: partsTotalPages,
    },
  };
}
