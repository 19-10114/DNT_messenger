export interface Pagination<T> {
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  results: T[];
}
