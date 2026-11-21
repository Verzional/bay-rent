import type {
  GarageStatus,
  GarageType,
  RentalStatus,
  RentalType,
  VehicleType,
  VerificationStatus,
} from '@/types';

const idrFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Formats numeric amounts as Indonesian Rupiah (e.g., `Rp 50.000`).
 */
export function formatIdr(amount: number): string {
  return idrFormatter.format(Math.round(amount));
}

/**
 * Formats a UTC-normalized Date as `DD MMM YYYY`.
 */
export function formatDate(date: Date | string): string {
  const parsed = typeof date === 'string' ? new Date(date) : date;
  return dateFormatter.format(parsed);
}

/**
 * Formats a Date as `DD MMM YYYY, HH:mm`.
 */
export function formatDateTime(date: Date | string): string {
  const parsed = typeof date === 'string' ? new Date(date) : date;
  return dateTimeFormatter.format(parsed);
}

/**
 * Formats a Date into `YYYY-MM-DD` for HTML date inputs.
 */
export function toIsoDateInput(date: Date | string): string {
  const parsed = typeof date === 'string' ? new Date(date) : date;
  const y = parsed.getUTCFullYear();
  const m = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const d = String(parsed.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const GARAGE_TYPE_LABELS: Record<GarageType, string> = {
  BIKE: 'Bicycle & Motorcycle Bay',
  CAR: 'Standard Car Bay',
  EV: 'EV Charging Bay',
};

export const GARAGE_TYPE_SHORT_LABELS: Record<GarageType, string> = {
  BIKE: 'Bike Bay',
  CAR: 'Car Bay',
  EV: 'EV Bay',
};

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  BICYCLE: 'Bicycle',
  MOTORCYCLE: 'Motorcycle',
  CAR: 'Gasoline / Hybrid Car',
  EV: 'Electric Vehicle (EV)',
};

export const RENTAL_TYPE_LABELS: Record<RentalType, string> = {
  DAILY: 'Daily',
  MONTHLY: 'Monthly',
};

export const STATUS_LABELS: Record<
  GarageStatus | RentalStatus | VerificationStatus,
  string
> = {
  AVAILABLE: 'Available',
  USED: 'Used',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  PENDING: 'Pending Review',
  ACCEPTED: 'Verified',
  REJECTED: 'Rejected',
};
