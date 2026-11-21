export type UserRole = 'ADMIN' | 'TENANT';
export type VerificationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface SessionUser {
  userId: number;
  email: string;
  fullName: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
}

export interface TenantProfile {
  userId: number;
  nationalId: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;
}
