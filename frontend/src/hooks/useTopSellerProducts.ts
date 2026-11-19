import { useQuery } from '@tanstack/react-query';
import { ProductsService } from '@/services/products/products.service';
import { useToken } from '@/stores/auth/auth.store';
import { TopPartsQueryParams } from '@/services/products/types/GetProductsBackendResponse.type';

const productsService = new ProductsService();

interface UseTopPartsParams extends TopPartsQueryParams {
  enabled?: boolean;
}

export function useTopParts(params: UseTopPartsParams) {
  const token = useToken();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      'topParts',
      token,
      params.start,
      params.finish,
      params.page,
      params.pageSize,
    ],
    queryFn: () =>
      productsService.getTopParts(token as string, {
        start: params.start,
        finish: params.finish,
        page: params.page,
        pageSize: params.pageSize,
      }),
    enabled:
      !!token && !!params.start && !!params.finish && params.enabled !== false,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  const responseData = data?.data;
  const results = responseData?.results ?? [];
  const pagination = {
    currentPage: responseData?.currentPage ?? Number(params.page ?? '1'),
    totalPages: responseData?.totalPages ?? 1,
    totalElements: responseData?.totalElements ?? 0,
    pageSize: responseData?.pageSize ?? Number(params.pageSize ?? '10'),
  };

  return {
    isLoading,
    isError,
    results,
    pagination,
    refetch,
    message: data?.message,
  };
}
