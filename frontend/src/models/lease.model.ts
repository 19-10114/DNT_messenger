//Lease Model
import { ProductModel } from './product.model';
import { UserModel } from './user.model';
export interface LeaseModel {
  collectionStatus: string;
  id: number;
  status: string;
  createdAt: string;
  user: string;
  userScore: number;
  product: number;
  fullProductPrice: number;
  initialFee: number;
  monthlyFee: number;
  feesNumber: number;
  address: string;
  rider: unknown;
  loanGrantor: number;
  leaseReason: string;
  payments: unknown[];
  nextPaymentDate: string;
  type: string;
  country_user_id: string;
  deliveredDate: string;
  collectionDate: string;
  paymentType: string;
  contractId: string;
  location: string;
  observations: null | string;
  engineOn: boolean;
  engineSerial: null | string;
  licensePlate: null | string;
  gpsModel: null | string;
  gpsNumber: null | string;
  imei: null | string;
  contractDate: Date | string;
}

export interface Company {
  name: string;
  web_page: string;
  instagram: string;
  facebook: string;
  address: string;
}

export interface LoanGrantor {
  first_name: string;
  last_name: string;
  relationship: string;
  phone_number: string;
  email: string;
  address_room: string;
  land_line_number: string;
}

export interface Lease {
  user: any;
  country_user_id: string;
  type: string;
  state: string;
  user_score: string;
  product: ProductModel;
  full_product_price: string;
  payment_type: string;
  initial_fee: string;
  monthly_fee: string;
  fees_number: string;
  address: Address;
  lease_reason: string;
}

export interface LeaseFormSubmit {
  country_user_id: string;
  type: string;
  state: string;
  user_score: string;
  product: string;
  full_product_price: string;
  payment_type: string;
  initial_fee: string;
  monthly_fee: string;
  fees_number: string;
  address: string;
  lease_reason: string;
  location: string;
  contract_id: string;
}

export interface Address {
  id: number;
  name: string;
  description: string;
  latitude: string;
  longitude: string;
  createdAt: Date;
  isDeleted: boolean;
  user: number;
}

export interface PaymentType {
  name: string;
  id: number;
}
export interface LeaseCreateData {
  lease: LeaseFormSubmit;
  company: Company;
  loanGrantor: LoanGrantor;
}

export interface Payment {
  id: number;
  amount: number;
  createdAt: Date;
  date: string;
  type: string;
  status: string;
  currency: string;
  exchangeRate: number;
  initial: boolean;
  lease: Lease;
  user: UserModel;
  contract_id: string;
  location: string;
  concept: string;
  amountCharged: number;
  bank: string;
  bankReference: string;
}

export interface PaymentList {
  paymentBanks: string[];
  zelleBanks: string[];
  paymentLocation: string[];
  paymentMethods: string[];
  paymentCurrency: string[];
  payment: string[];
  leasesStatus: string[];
  collectionStatus: string[];
}

export interface ModifyLeasePayment {
  fees_number: number;
  monthly_fee: number;
  payment_type: string;
  initial_fee: number;
  contract_id: string;
  product_id: number;
  full_product_price: number;
}
