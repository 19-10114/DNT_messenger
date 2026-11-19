import { MotoCandelaHttpService } from '@/services/motoCandelaHttp.service';
import { BranchData, BranchResponse, BranchItem } from './types/Branch.type';

export class BranchService {
  private service: MotoCandelaHttpService;

  constructor() {
    this.service = new MotoCandelaHttpService();
  }

  public async createBranch(token: string, branchData: BranchData) {
    const response = await this.service.post<any>({
      endpoint: `/branches/`,
      customHeaders: {
        Authorization: `Token ${token}`,
      },
      data: branchData,
    });
    return response;
  }

  public async getBranchByName(token: string, name: string) {
    const response = await this.service.get<any>({
      endpoint: `/branches/${name}`,
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return response;
  }

  public async getBranches(
    token: string,
    branchId: string,
    isPartsAdmin = false
  ): Promise<BranchResponse> {
    const endpoint = isPartsAdmin
      ? `/branches/part-admin/all`
      : `/branches/all/${branchId}`;
    const response = await this.service.get<BranchResponse>({
      endpoint,
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return response;
  }

  public async getAllMcBranches(token: string): Promise<BranchResponse> {
    const response = await this.service.get<BranchResponse>({
      endpoint: `/branches/mc/all`,
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return response;
  }

  /**
   * Every branch, with no role-based exclusion -- unlike getAllMcBranches,
   * which hides the supplier ("empire") and sale accounts ("Ventas", "Dale
   * Play"). For filters that need those as legitimate origin/target values.
   */
  public async getAllBranchesUnfiltered(token: string): Promise<BranchResponse> {
    const response = await this.service.get<BranchResponse>({
      endpoint: `/branches/every`,
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return response;
  }

  // public async getBranches(token: string): Promise<BranchResponse> {
  //   const response = await this.service.get<BranchResponse>({
  //     endpoint: `/branches/all`,
  //     customHeaders: {
  //       Authorization: `Token ${token}`,
  //     },
  //   });
  //   return response;
  // }

  public async deleteBranch(token: string, name: string) {
    const response = await this.service.delete<any>({
      endpoint: `/branches/`,
      customHeaders: {
        Authorization: `Token ${token}`,
      },
      data: {
        name: name,
      },
    });
    return response;
  }

  public async updateBranch(
    token: string,
    branchId: number,
    branchData: Partial<BranchData>
  ) {
    const response = await this.service.patch<any>({
      endpoint: `/branches/${branchId}`,
      customHeaders: {
        Authorization: `Token ${token}`,
      },
      data: branchData,
    });
    return response;
  }
}
