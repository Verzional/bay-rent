import type { GarageType } from './garage';

export interface MonthlyReportRow {
  month: number;
  monthLabel: string;
  rentalCount: number;
  extensionCount: number;
  initialRevenue: number;
  extensionRevenue: number;
  totalRevenue: number;
}

export interface DailyReportRow {
  day: number;
  dateLabel: string;
  rentalCount: number;
  extensionCount: number;
  initialRevenue: number;
  extensionRevenue: number;
  totalRevenue: number;
}

export interface GarageTypeReportRow {
  garageType: GarageType;
  totalRentals: number;
  activeRentals: number;
  completedRentals: number;
  extensionCount: number;
  totalRevenue: number;
}

export interface TenantReportRow {
  tenantId: number;
  nationalId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  totalRentals: number;
  activeRentals: number;
  extensionCount: number;
  totalSpend: number;
}

export interface AdminOverview {
  totalGarages: number;
  availableGarages: number;
  usedGarages: number;
  occupancyRate: number;
  pendingVerifications: number;
  activeRentalsToday: number;
  currentMonthRevenue: number;
}

export type ReportTabKey = 'monthly' | 'daily' | 'by-type' | 'by-tenant';
