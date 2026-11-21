export type GarageType = 'BIKE' | 'CAR' | 'EV';
export type GarageStatus = 'AVAILABLE' | 'USED';

export interface GarageItem {
  garageCode: string;
  type: GarageType;
  dailyRate: number;
  kwhRate: number | null;
  status: GarageStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface GarageSummaryByType {
  type: GarageType;
  totalCount: number;
  availableCount: number;
  usedCount: number;
  minDailyRate: number | null;
  minMonthlyRate: number | null;
  minKwhRate: number | null;
}

export interface BatchCreateGarageResult {
  createdCount: number;
  firstCode: string;
  lastCode: string;
}
