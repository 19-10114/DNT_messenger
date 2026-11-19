import { LeaseModel } from '@/models/lease.model';
export interface GetProductByIdBackendResponseType {
  message: string;
  data: Data;
}

export interface Data {
  id: number;
  category: number;
  description: string;
  name: string;
  stock: number;
  leasePrice: number;
  initialFee: number;
  cashPrice: number;
  brand: string;
  internalId: string;
  createdAt: string;
  leaseOptions: { [key: string]: LeaseBackendResponse };
  images: string[];
  extra: object;
  isFeatured: boolean;
}

export interface LeaseBackendResponse {
  initialFee: number;
  weeklyFee: number;
  total: number;
}

export interface GetLeasesBackendResponseType {
  message: string;
  data: BackendLeasesPagination;
}

export interface BackendLeasesPagination {
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  results: LeaseModel[];
}

export interface LeaseStatusChangeResponse {
  message: string;
  new_status: string;
}

export interface LeaseStatusChangeSuccessfully {
  message: string;
  data: string;
}
