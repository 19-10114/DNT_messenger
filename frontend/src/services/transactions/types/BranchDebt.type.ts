export interface BranchDebtPayload {
  first_branch: string;
  second_branch: string;
}

export interface BranchDebtResponse {
  message: string;
  data: number;
}

export interface Branch {
  id: number;
  name: string;
  type: string;
}

export interface BranchDebtItem {
  branch: Branch;
  debt: number;
}

export interface BranchTotalDebtData {
  debts: BranchDebtItem[];
  total: number;
}

export interface BranchTotalDebtResponse {
  message: string;
  data: BranchTotalDebtData;
}
