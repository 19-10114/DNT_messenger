import { MotoCandelaHttpService } from '../motoCandelaHttp.service';
import {
  CashWithdrawal,
  CreateCashWithdrawalPayload,
} from './types/CashWithdrawal.type';

interface BackendResponse<T> {
  message: string;
  data: T;
}

const MULTIPART = { 'Content-Type': 'multipart/form-data' };

/** Salidas de efectivo (`/api/cash-withdrawals/`). No son gastos. */
export class CashWithdrawalsService {
  private service: MotoCandelaHttpService;

  constructor() {
    this.service = new MotoCandelaHttpService();
  }

  public async getCashWithdrawal(
    token: string | undefined,
    id: number
  ): Promise<CashWithdrawal> {
    const response = await this.service.get<BackendResponse<CashWithdrawal>>({
      endpoint: `/cash-withdrawals/${id}`,
      token,
    });
    return response.data;
  }

  /** Multipart por el comprobante opcional; claves en snake_case. */
  public async createCashWithdrawal(
    token: string | undefined,
    payload: CreateCashWithdrawalPayload
  ): Promise<CashWithdrawal> {
    const formData = new FormData();
    const fields: [string, string | number | undefined][] = [
      ['branch', payload.branch],
      ['destination', payload.destination],
      ['concept', payload.concept],
      ['delivered_to', payload.deliveredTo],
      ['reference', payload.reference],
      ['amount_usd', payload.amountUsd],
      ['notes', payload.notes],
    ];
    fields.forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, String(value));
    });
    if (payload.receipt) {
      formData.append('receipt', payload.receipt, payload.receipt.name);
    }
    const response = await this.service.post<BackendResponse<CashWithdrawal>>({
      endpoint: '/cash-withdrawals/',
      data: formData,
      token,
      customHeaders: MULTIPART,
    });
    return response.data;
  }

  public async cancelCashWithdrawal(
    token: string | undefined,
    id: number,
    reason: string
  ): Promise<CashWithdrawal> {
    const response = await this.service.post<BackendResponse<CashWithdrawal>>({
      endpoint: `/cash-withdrawals/${id}/cancel`,
      data: { reason },
      token,
    });
    return response.data;
  }
}
