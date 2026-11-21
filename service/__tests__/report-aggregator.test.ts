import { describe, expect, it } from 'vitest';
import {
  aggregateByGarageType,
  aggregateByTenant,
  aggregateDailyReport,
  aggregateMonthlyReport,
  computeAdminOverview,
} from '@/service/report-aggregator';
import type { RentalDetail } from '@/types';
import { DateCalculator } from '@/utils/date';

describe('service/report-aggregator', () => {
  const sampleRentals: RentalDetail[] = [
    {
      rentalId: 1,
      garageCode: 'E001',
      garageType: 'EV',
      garageDailyRate: 100_000,
      garageKwhRate: 2_000,
      garageStatus: 'USED',
      vehicleId: 1,
      vehicleType: 'EV',
      licensePlate: 'L 1 EV',
      brandModel: 'Ioniq 5',
      batteryKwh: 50,
      tenantId: 10,
      tenantName: 'Alice Tenant',
      tenantEmail: 'alice@example.com',
      tenantNationalId: '3578012345678910',
      tenantPhone: '0811111111',
      rentalType: 'DAILY',
      daysCount: 5,
      startDate: DateCalculator.parseIsoDate('2026-03-10'),
      endDate: DateCalculator.parseIsoDate('2026-03-20'),
      totalCost: 600_000,
      extensionRevenueTotal: 600_000,
      grandTotalCost: 1_200_000,
      paymentProofUrl: '/api/uploads/a.png',
      status: 'ACTIVE',
      extensions: [
        {
          extensionId: 1,
          rentalId: 1,
          adminId: 1,
          previousEndDate: DateCalculator.parseIsoDate('2026-03-15'),
          newEndDate: DateCalculator.parseIsoDate('2026-03-20'),
          remainingCost: 600_000,
          paymentProofUrl: '/api/uploads/b.png',
          createdAt: DateCalculator.parseIsoDate('2026-03-14'),
        },
      ],
    },
    {
      rentalId: 2,
      garageCode: 'S001',
      garageType: 'BIKE',
      garageDailyRate: 10_000,
      garageKwhRate: null,
      garageStatus: 'AVAILABLE',
      vehicleId: 2,
      vehicleType: 'BICYCLE',
      licensePlate: null,
      brandModel: 'Brompton',
      batteryKwh: null,
      tenantId: 10,
      tenantName: 'Alice Tenant',
      tenantEmail: 'alice@example.com',
      tenantNationalId: '3578012345678910',
      tenantPhone: '0811111111',
      rentalType: 'DAILY',
      daysCount: 2,
      startDate: DateCalculator.parseIsoDate('2026-03-14'),
      endDate: DateCalculator.parseIsoDate('2026-03-16'),
      totalCost: 20_000,
      extensionRevenueTotal: 0,
      grandTotalCost: 20_000,
      paymentProofUrl: '/api/uploads/c.png',
      status: 'COMPLETED',
      extensions: [],
    },
  ];

  it('aggregates monthly, daily, by-type, by-tenant, and overview reports accurately', () => {
    const monthly = aggregateMonthlyReport(sampleRentals, 2026);
    expect(monthly).toHaveLength(12);
    expect(monthly[2]).toMatchObject({
      month: 3,
      monthLabel: 'Mar',
      rentalCount: 2,
      extensionCount: 1,
      initialRevenue: 620_000,
      extensionRevenue: 600_000,
      totalRevenue: 1_220_000,
    });

    const daily = aggregateDailyReport(sampleRentals, 2026, 3);
    expect(daily).toHaveLength(31);
    expect(daily[9]).toMatchObject({ day: 10, rentalCount: 1, totalRevenue: 600_000 });
    expect(daily[13]).toMatchObject({
      day: 14,
      rentalCount: 1,
      extensionCount: 1,
      totalRevenue: 620_000,
    });

    const byType = aggregateByGarageType(sampleRentals);
    expect(byType.find((r) => r.garageType === 'EV')?.totalRevenue).toBe(1_200_000);
    expect(byType.find((r) => r.garageType === 'BIKE')?.totalRevenue).toBe(20_000);
    expect(byType.find((r) => r.garageType === 'CAR')?.totalRentals).toBe(0);

    const byTenant = aggregateByTenant(sampleRentals);
    expect(byTenant).toHaveLength(1);
    expect(byTenant[0]).toMatchObject({
      tenantId: 10,
      totalRentals: 2,
      activeRentals: 1,
      extensionCount: 1,
      totalSpend: 1_220_000,
    });

    const overview = computeAdminOverview({
      garages: [{ status: 'USED' }, { status: 'AVAILABLE' }],
      activeRentalsCount: 1,
      allRentals: sampleRentals,
      pendingVerifications: 2,
      now: new Date(2026, 2, 15, 10, 0, 0),
    });
    expect(overview).toEqual({
      totalGarages: 2,
      availableGarages: 1,
      usedGarages: 1,
      occupancyRate: 50,
      pendingVerifications: 2,
      activeRentalsToday: 1,
      currentMonthRevenue: 1_220_000,
    });
  });
});
