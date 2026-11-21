import type { GarageStatus, GarageType } from './garage';

export type VehicleType = 'BICYCLE' | 'MOTORCYCLE' | 'CAR' | 'EV';
export type RentalType = 'DAILY' | 'MONTHLY';
export type RentalStatus = 'ACTIVE' | 'COMPLETED';

export interface VehicleItem {
  vehicleId: number;
  tenantId: number;
  type: VehicleType;
  licensePlate: string | null;
  brandModel: string;
  batteryKwh: number | null;
  createdAt: Date;
}

export interface RentalExtensionItem {
  extensionId: number;
  rentalId: number;
  adminId: number;
  previousEndDate: Date;
  newEndDate: Date;
  remainingCost: number;
  paymentProofUrl: string;
  createdAt: Date;
}

export interface RentalDetail {
  rentalId: number;
  garageCode: string;
  garageType: GarageType;
  garageDailyRate: number;
  garageKwhRate: number | null;
  garageStatus: GarageStatus;
  vehicleId: number;
  vehicleType: VehicleType;
  licensePlate: string | null;
  brandModel: string;
  batteryKwh: number | null;
  tenantId: number;
  tenantName: string;
  tenantEmail: string;
  tenantNationalId: string;
  tenantPhone: string;
  rentalType: RentalType;
  daysCount: number | null;
  startDate: Date;
  endDate: Date;
  totalCost: number;
  extensionRevenueTotal: number;
  grandTotalCost: number;
  paymentProofUrl: string;
  status: RentalStatus;
  extensions: RentalExtensionItem[];
}

export interface PricingBreakdown {
  baseCost: number;
  chargingCost: number;
  totalCost: number;
  fullMonths: number;
  remainingDays: number;
  totalDays: number;
  endDate: Date;
}

export interface ExtensionPricingBreakdown {
  baseCost: number;
  chargingCost: number;
  remainingCost: number;
  fullMonths: number;
  remainingDays: number;
  totalDays: number;
  previousEndDate: Date;
  newEndDate: Date;
}

export type VehicleInputMode = 'existing' | 'new';

export interface BookingCalculatorInput {
  vehicleMode: VehicleInputMode;
  existingVehicleType: VehicleType | null;
  existingVehicleBatteryKwh: number | null;
  newVehicleType: VehicleType;
  newVehicleBatteryKwh: string;
  selectedGarageType: GarageType;
  selectedGarageDailyRate: number | null;
  selectedGarageKwhRate: number | null;
  rentalType: RentalType;
  daysCount: number;
}

export interface BookingCalculatorResult {
  compatibleGarageTypes: GarageType[];
  effectiveVehicleType: VehicleType | null;
  effectiveBatteryKwh: number | null;
  endDateIso: string | null;
  baseCost: number;
  chargingCost: number;
  totalCost: number;
  errorMessage: string | null;
}
