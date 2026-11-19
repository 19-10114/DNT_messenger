export interface BranchData {
  name: string;
  type: string;
  /** Código corto para documentos ("GRN"). Vacío lo quita. */
  code?: string;
}

export interface BranchResponse {
  message: string;
  data: BranchItem[];
}

export interface BranchItem {
  id: number;
  name: string;
  type: string;
  code?: string | null;
}
