import { useQueries } from '@tanstack/react-query';
import { TransactionService } from '@/services/transactions/transactions.service';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import {
  DailyReportBackendResponse,
  DailyReportData,
  DailyReportOthersBackendResponse,
  DailyReportOthersData,
} from '@/services/transactions/types/DailyReport.type';

const service = new TransactionService();

interface BaseParams {
  date: string;
  page?: string;
  pageSize?: string;
}

const getRetryConfig = () => ({
  retry: (failureCount: number, error: any) => {
    if (error?.response?.status === 404) {
      return false;
    }
    return failureCount < 2;
  },
  retryDelay: 1000,
});

export function useDailyReport(params: BaseParams, enabled: boolean = false) {
  const token = useToken();
  const branchId = useCurrentBranchId();
  const branchIdString =
    branchId !== undefined && branchId !== null
      ? branchId.toString()
      : undefined;

  const queries = useQueries({
    queries: [
      {
        queryKey: [
          'dailyReport',
          'base',
          token,
          branchIdString,
          params.date,
          params.page,
          params.pageSize,
        ],
        queryFn: () =>
          service.getDailyReport(token, branchIdString as string, {
            date: params.date,
            page: params.page,
            pageSize: params.pageSize,
          }),
        enabled: !!token && !!branchIdString && enabled,
        refetchOnWindowFocus: false,
        keepPreviousData: true,
        ...getRetryConfig(),
      },
      {
        queryKey: [
          'dailyReport',
          'other',
          token,
          branchIdString,
          params.date,
          params.page,
          params.pageSize,
        ],
        queryFn: () =>
          service.getDailyReportOther(token, branchIdString as string, {
            date: params.date,
            page: params.page,
            pageSize: params.pageSize,
          }),
        enabled: !!token && !!branchIdString && enabled,
        refetchOnWindowFocus: false,
        keepPreviousData: true,
        ...getRetryConfig(),
      },
    ],
  });

  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);

  const baseResp = queries[0].data as DailyReportBackendResponse | undefined;
  const otherResp = queries[1].data as
    | DailyReportOthersBackendResponse
    | undefined;

  // Sin movimientos en la fecha el backend devuelve `data: []` (ver el servicio)
  const baseData: DailyReportData | undefined =
    baseResp && !Array.isArray(baseResp.data) ? baseResp.data : undefined;
  const otherData: DailyReportOthersData | undefined =
    otherResp && !Array.isArray(otherResp.data) ? otherResp.data : undefined;

  const rows = baseData?.results ?? [];

  // Build color summary rows from staticData.bikeSummary when available, otherwise aggregate from results
  let colorRows: { product: string; color: string; count: number }[] = [];
  const bikeSummaryMap = baseData?.staticData?.bikeSummary;
  if (bikeSummaryMap && typeof bikeSummaryMap === 'object') {
    colorRows = Object.entries(bikeSummaryMap).flatMap(
      ([productName, colors]) =>
        Object.entries(colors).map(([hexColor, count]) => ({
          product: productName,
          color: hexColor,
          count: count as number,
        }))
    );
  } else {
    const map = new Map<
      string,
      { product: string; color: string; count: number }
    >();
    rows.forEach((r) => {
      const key = `${r.product}__${r.color}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, { product: r.product, color: r.color, count: 1 });
      }
    });
    colorRows = Array.from(map.values());
  }

  const notes =
    otherData?.staticData?.notes ?? baseData?.staticData?.notes ?? [];

  const summary = {
    totalCashUsd: baseData?.staticData?.totals.totalCashUsd ?? 0,
    totalNonCashUsd: baseData?.staticData?.totals.totalNonCashUsd ?? 0,
    totalCashBs: baseData?.staticData?.totals.totalCashBs ?? 0,
    totalNonCashBs: baseData?.staticData?.totals.totalNonCashBs ?? 0,
    grandTotalUsd: baseData?.staticData?.totals.grandTotalUsd ?? 0,
    grandTotalBs: baseData?.staticData?.totals.grandTotalBs ?? 0,
    dp: otherData?.staticData?.totals.dp ?? 0,
    spentBs: otherData?.staticData?.totals.spentBs ?? 0,
    spentCashBs: otherData?.staticData?.totals.spentCashBs ?? 0,
    spentUsd: otherData?.staticData?.totals.spentUsd ?? 0,
    spentCashUsd: otherData?.staticData?.totals.spentCashUsd ?? 0,
    withdrawnCashUsd: otherData?.staticData?.totals.withdrawnCashUsd ?? 0,
    abonoBs: otherData?.staticData?.totals.abonoBs ?? 0,
    abonoCashBs: otherData?.staticData?.totals.abonoCashBs ?? 0,
    abonoUsd: otherData?.staticData?.totals.abonoUsd ?? 0,
    abonoCashUsd: otherData?.staticData?.totals.abonoCashUsd ?? 0,
    totalCashUsdOther: otherData?.staticData?.totals.totalCashUsd ?? 0,
    totalUsdOther: otherData?.staticData?.totals.totalUsd ?? 0,
    totalCashBsOther: otherData?.staticData?.totals.totalCashBs ?? 0,
    totalBsOther: otherData?.staticData?.totals.totalBs ?? 0,
  };

  // La consulta respondió bien pero la fecha no tiene nada que mostrar
  const isEmpty =
    !isLoading &&
    !isError &&
    (!!baseResp || !!otherResp) &&
    rows.length === 0 &&
    (otherData?.results?.length ?? 0) === 0;

  return {
    isLoading,
    isError,
    isEmpty,
    rows,
    colorRows,
    notes,
    summary,
    pagination: {
      currentPage: baseData?.currentPage ?? Number(params.page ?? '1'),
      totalPages: baseData?.totalPages ?? 1,
    },
    other: {
      results: otherData?.results ?? [],
      pagination: {
        currentPage: otherData?.currentPage ?? Number(params.page ?? '1'),
        totalPages: otherData?.totalPages ?? 1,
      },
    },
    branchId: branchId,
  };
}
