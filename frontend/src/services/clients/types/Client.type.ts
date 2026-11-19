export interface ClientData {
  id: number;
  firstName: string;
  lastName: string;
  countryId: string;
  phoneNumber: string;
  email: string;
  address: string;
  city: string;
  inFavor?: number;
  createdAt: string;
  residenceType?: string;
  street?: string;
  residence?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  localPhoneNumber?: string;
  origin?: string;
  type?: 'regular' | 'aliado';
  source?: string;
  /** Rol del User con la misma cédula (document_id), si existe uno */
  role?: string | null;
  /** Total gastado en órdenes completadas (billed, no canceladas, sin sucursal Prueba) */
  totalSpent?: number;
}

export interface GetClientBackendResponse {
  message: string;
  data: ClientData[];
}

export interface CreateClientPayload {
  first_name: string;
  last_name: string;
  country_id: string;
  phone_number: string;
  email: string;
  address: string;
  city: string;
  residence_type?: string;
  street?: string;
  residence?: string;
  district?: string;
  state?: string;
  postal_code?: string;
  local_phone_number?: string;
}

export interface CreateClientBackendResponse {
  message: string;
  data: {
    id: number;
  };
}
