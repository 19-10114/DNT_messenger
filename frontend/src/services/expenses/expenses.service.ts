import { MotoCandelaHttpService } from '../motoCandelaHttp.service';
import { createUrl } from '@/utils/createUrl.utils';
import {
  CreateExpensePayload,
  Expense,
  ExpenseBeneficiary,
  ExpenseCategory,
  ExpenseCategoryPayload,
  ExpensesPage,
  ExpenseSummary,
  ExpenseTaxOptions,
  GetAllExpensesQueryParams,
  GetRetentionsQueryParams,
  RetentionLine,
  RetentionsPage,
  SavedBeneficiary,
  UpdateExpensePayload,
} from './types/Expense.type';

interface BackendResponse<T> {
  message: string;
  data: T;
}

/** Query params sin los vacíos: `createUrl` serializaría `undefined`. */
function toQueryParameters(params: object): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)])
  );
}

/**
 * Cuerpo multipart para crear/editar. Claves en snake_case, como las espera
 * el backend (el parser camelCase las dejaría igual).
 */
function toFormData(
  payload: Partial<CreateExpensePayload> | UpdateExpensePayload
): FormData {
  const formData = new FormData();
  const fields: [string, unknown][] = [
    ['branch', (payload as Partial<CreateExpensePayload>).branch],
    ['concept', payload.concept],
    ['beneficiary', payload.beneficiary],
    ['currency', payload.currency],
    ['rate', payload.rate],
    ['rate_type', payload.rateType],
    ['payment_method', payload.paymentMethod],
    ['reference', payload.reference],
    ['phone_number', payload.phoneNumber],
    ['origin_bank', payload.originBank],
    ['target_bank', payload.targetBank],
    ['origin_account', payload.originAccount],
    ['target_account', payload.targetAccount],
    ['expense_date', payload.expenseDate],
    ['notes', payload.notes],
    ['invoice_number', payload.invoiceNumber],
    ['control_number', payload.controlNumber],
    ['iva_rate', payload.ivaRate],
    ['retention_iva_rate', payload.retentionIvaRate],
    ['retention_islr_rate', payload.retentionIslrRate],
  ];
  fields.forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });
  // Las líneas viajan como JSON en un solo campo; las claves internas van en
  // snake_case porque el parser camelCase solo convierte las de primer nivel.
  if (payload.lines) {
    formData.append(
      'lines',
      JSON.stringify(
        payload.lines.map((line) => ({
          category: line.category,
          concept: line.concept ?? '',
          line_type: line.lineType,
          amount: line.amount,
          iva_exempt: line.ivaExempt ?? false,
        }))
      )
    );
  }
  if (payload.excludedFromCash !== undefined) {
    formData.append(
      'excluded_from_cash',
      payload.excludedFromCash ? 'true' : 'false'
    );
  }
  if ((payload as Partial<CreateExpensePayload>).asRequest) {
    formData.append('as_request', 'true');
  }
  // `null` quita el proveedor o el usuario: en multipart viaja como cadena vacía.
  if (payload.supplier !== undefined) {
    formData.append(
      'supplier',
      payload.supplier === null ? '' : String(payload.supplier)
    );
  }
  if (payload.beneficiaryUser !== undefined) {
    formData.append(
      'beneficiary_user',
      payload.beneficiaryUser === null ? '' : String(payload.beneficiaryUser)
    );
  }
  // Varios archivos con la misma clave; el backend los lee como lista.
  payload.receipts?.forEach((file) =>
    formData.append('receipts', file, file.name)
  );
  (payload as UpdateExpensePayload).removeReceipts?.forEach((id) =>
    formData.append('remove_receipts', String(id))
  );
  return formData;
}

const MULTIPART = { 'Content-Type': 'multipart/form-data' };

/** "Módulo de Gastos" (`/api/expenses/`). */
export class ExpensesService {
  private service: MotoCandelaHttpService;

  constructor() {
    this.service = new MotoCandelaHttpService();
  }

  public async getAllExpenses(
    token: string | undefined,
    branchId: string,
    queryParameters: GetAllExpensesQueryParams = {}
  ): Promise<ExpensesPage> {
    const response = await this.service.get<BackendResponse<ExpensesPage>>({
      endpoint: createUrl({
        url: `/expenses/all/${branchId}`,
        parameters: toQueryParameters({
          page: '1',
          pageSize: '10',
          ...queryParameters,
        }),
      }),
      token,
    });
    return response.data;
  }

  public async getExpense(
    token: string | undefined,
    id: number
  ): Promise<Expense> {
    const response = await this.service.get<BackendResponse<Expense>>({
      endpoint: `/expenses/${id}`,
      token,
    });
    return response.data;
  }

  public async createExpense(
    token: string | undefined,
    payload: CreateExpensePayload
  ): Promise<Expense> {
    const response = await this.service.post<BackendResponse<Expense>>({
      endpoint: '/expenses/',
      data: toFormData(payload),
      token,
      customHeaders: MULTIPART,
    });
    return response.data;
  }

  public async updateExpense(
    token: string | undefined,
    id: number,
    payload: UpdateExpensePayload
  ): Promise<Expense> {
    const response = await this.service.patch<BackendResponse<Expense>>({
      endpoint: `/expenses/${id}`,
      data: toFormData(payload),
      token,
      customHeaders: MULTIPART,
    });
    return response.data;
  }

  public async cancelExpense(
    token: string | undefined,
    id: number,
    reason: string
  ): Promise<Expense> {
    const response = await this.service.post<BackendResponse<Expense>>({
      endpoint: `/expenses/${id}/cancel`,
      data: { reason },
      token,
    });
    return response.data;
  }

  /** Admin: pendiente → registrado. Desde ahí cuenta en caja y reportes. */
  public async approveExpense(
    token: string | undefined,
    id: number
  ): Promise<Expense> {
    const response = await this.service.post<BackendResponse<Expense>>({
      endpoint: `/expenses/${id}/approve`,
      token,
    });
    return response.data;
  }

  /** Admin: pendiente → rechazado, con motivo. Definitivo. */
  public async rejectExpense(
    token: string | undefined,
    id: number,
    reason: string
  ): Promise<Expense> {
    const response = await this.service.post<BackendResponse<Expense>>({
      endpoint: `/expenses/${id}/reject`,
      data: { reason },
      token,
    });
    return response.data;
  }

  /** Quien lo registró retira su pendiente (queda anulado). */
  public async withdrawExpense(
    token: string | undefined,
    id: number
  ): Promise<Expense> {
    const response = await this.service.post<BackendResponse<Expense>>({
      endpoint: `/expenses/${id}/withdraw`,
      token,
    });
    return response.data;
  }

  /** Hasta 20 usuarios activos de Moto Candela (no clientes) que coinciden. */
  public async getBeneficiaries(
    token: string | undefined,
    search: string
  ): Promise<ExpenseBeneficiary[]> {
    const response = await this.service.get<
      BackendResponse<ExpenseBeneficiary[]>
    >({
      endpoint: createUrl({
        url: '/expenses/beneficiaries',
        parameters: { search },
      }),
      token,
    });
    return response.data;
  }

  /**
   * Hasta 20 beneficiarios guardados (nombres escritos en gastos anteriores)
   * que coinciden, sin importar mayúsculas ni tildes.
   */
  public async getSavedBeneficiaries(
    token: string | undefined,
    search: string
  ): Promise<SavedBeneficiary[]> {
    const response = await this.service.get<
      BackendResponse<SavedBeneficiary[]>
    >({
      endpoint: createUrl({
        url: '/expenses/beneficiaries/saved',
        parameters: { search },
      }),
      token,
    });
    return response.data;
  }

  /**
   * Todos los gastos que cumplen los filtros, sin paginar, para exportar:
   * pide una página para conocer el total y luego ese total de una vez.
   */
  public async getAllExpensesForExport(
    token: string | undefined,
    branchId: string,
    filters: Omit<GetAllExpensesQueryParams, 'page' | 'pageSize'>
  ): Promise<Expense[]> {
    const first = await this.getAllExpenses(token, branchId, {
      ...filters,
      page: '1',
      pageSize: '1',
    });
    if (!first.totalElements) return [];
    const all = await this.getAllExpenses(token, branchId, {
      ...filters,
      page: '1',
      pageSize: String(first.totalElements),
    });
    return all.results;
  }

  public async getCategories(
    token: string | undefined,
    includeInactive = false
  ): Promise<ExpenseCategory[]> {
    const response = await this.service.get<BackendResponse<ExpenseCategory[]>>(
      {
        endpoint: includeInactive
          ? '/expenses/categories?all=true'
          : '/expenses/categories',
        token,
      }
    );
    return response.data;
  }

  public async createCategory(
    token: string | undefined,
    payload: ExpenseCategoryPayload
  ): Promise<ExpenseCategory> {
    const response = await this.service.post<BackendResponse<ExpenseCategory>>({
      endpoint: '/expenses/categories',
      data: payload,
      token,
    });
    return response.data;
  }

  public async updateCategory(
    token: string | undefined,
    id: number,
    payload: ExpenseCategoryPayload
  ): Promise<ExpenseCategory> {
    const response = await this.service.patch<BackendResponse<ExpenseCategory>>(
      { endpoint: `/expenses/categories/${id}`, data: payload, token }
    );
    return response.data;
  }

  /** Retenciones (IVA e ISLR) de los gastos aprobados de una sucursal. */
  public async getRetentions(
    token: string | undefined,
    branchId: string,
    queryParameters: GetRetentionsQueryParams = {}
  ): Promise<RetentionsPage> {
    const response = await this.service.get<BackendResponse<RetentionsPage>>({
      endpoint: createUrl({
        url: `/expenses/retentions/${branchId}`,
        parameters: toQueryParameters({
          page: '1',
          pageSize: '10',
          ...queryParameters,
        }),
      }),
      token,
    });
    return response.data;
  }

  /** Todas las retenciones que cumplen los filtros, sin paginar, para exportar. */
  public async getRetentionsForExport(
    token: string | undefined,
    branchId: string,
    filters: Omit<GetRetentionsQueryParams, 'page' | 'pageSize'>
  ): Promise<RetentionLine[]> {
    const first = await this.getRetentions(token, branchId, {
      ...filters,
      pageSize: '1',
    });
    if (!first.totalElements) return [];
    const all = await this.getRetentions(token, branchId, {
      ...filters,
      pageSize: String(first.totalElements),
    });
    return all.results;
  }

  /** Tasas de IVA y de retención de IVA que ofrece el formulario. */
  public async getTaxOptions(
    token: string | undefined
  ): Promise<ExpenseTaxOptions> {
    const response = await this.service.get<BackendResponse<ExpenseTaxOptions>>(
      { endpoint: '/expenses/tax-options', token }
    );
    return response.data;
  }

  public async getSummary(
    token: string | undefined,
    branchId: string,
    queryParameters: Omit<GetAllExpensesQueryParams, 'page' | 'pageSize'> = {}
  ): Promise<ExpenseSummary> {
    const response = await this.service.get<BackendResponse<ExpenseSummary>>({
      endpoint: createUrl({
        url: `/expenses/summary/${branchId}`,
        parameters: toQueryParameters(queryParameters),
      }),
      token,
    });
    return response.data;
  }
}
