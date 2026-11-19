export interface MechanicBranch {
  id: number;
  name: string;
  type: string;
  location: string | null;
  contact: string | null;
  url: string | null;
  billingAddress: string | null;
}

export interface MechanicInfo {
  id: number;
  firstName: string;
  lastName: string;
  documentId: string;
  role: string;
  branch: MechanicBranch | null;
}

export interface MechanicTotals {
  totalServices: number;
  totalCost: number;
  totalClientPrice: number;
}

export interface MechanicServiceLine {
  transactionId: number;
  plate: string;
  /** Bike's catalogue model, resolved from the plate; null if unresolved
   * (no plate, or the bike unit backfill hasn't run for it). */
  model: string | null;
  receptionDate: string;
  /** Client of the service's order, when it has one. */
  client: string | null;
}

export interface ServiceBreakdownItem {
  productId: number;
  name: string;
  quantity: number;
  totalCost: number;
  totalClientPrice: number;
  services: MechanicServiceLine[];
}

export interface MechanicReportItem {
  mechanic: MechanicInfo;
  totals: MechanicTotals;
  servicesBreakdown: ServiceBreakdownItem[];
}

export interface GetMechanicsReportResponse {
  message: string;
  data: {
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    results: MechanicReportItem[];
  };
}
