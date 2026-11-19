export interface UserModel {
  id: number;
  email: string;
  documentId: string;
  username: string;
  isSuperuser: boolean;
  firstName: string;
  lastName: string;
  isStaff: boolean;
  password: string;
  lastLogin?: Date;
  type: string;
  branch: Branch;
  token: string;
  isActive: boolean;
  dateJoined: string;
  document: string;
  rif?: string;
  countryUserId: string;
  phoneNumber?: string;
  passport?: string;
  nationality?: string;
  birthdate?: Date;
  birthplace?: string;
  localPhone?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  position?: string;
  monthlyIncome?: number;
  haveHealthInsurance?: boolean;
  haveISLRDeclaration?: boolean;
  haveConsigment?: boolean;
  role: string;
  score: number;
  forgotPasswordToken?: string;
  billing?: boolean;
}

export interface Branch {
  id: number;
  name: string;
  type: string;
}
