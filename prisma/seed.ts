import bcrypt from 'bcryptjs';
import { db } from './db';

function daysFromToday(offsetDays: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offsetDays));
}

async function ensureUser(params: {
  nationalId: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'TENANT';
  verificationStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}) {
  const existing = await db.orm.public.User.where({ email: params.email }).first();
  if (existing) return existing;

  const passwordHash = await bcrypt.hash(params.password, 10);
  return db.orm.public.User.create({
    national_id: params.nationalId,
    full_name: params.fullName,
    phone_number: params.phoneNumber,
    email: params.email,
    password: passwordHash,
    role: params.role,
    verification_status: params.verificationStatus,
  });
}

async function ensureGarage(params: {
  garageCode: string;
  type: 'BIKE' | 'CAR' | 'EV';
  dailyRate: number;
  kwhRate: number | null;
  status: 'AVAILABLE' | 'USED';
}) {
  const existing = await db.orm.public.Garage.where({ garage_code: params.garageCode }).first();
  if (existing) return existing;

  return db.orm.public.Garage.create({
    garage_code: params.garageCode,
    type: params.type,
    daily_rate: params.dailyRate,
    kwh_rate: params.kwhRate,
    status: params.status,
  });
}

async function ensureVehicle(params: {
  tenantId: number;
  type: 'BICYCLE' | 'MOTORCYCLE' | 'CAR' | 'EV';
  licensePlate: string | null;
  brandModel: string;
  batteryKwh: number | null;
}) {
  const existing = params.licensePlate
    ? await db.orm.public.Vehicle.where({ license_plate: params.licensePlate }).first()
    : await db.orm.public.Vehicle.where({
        tenant_id: params.tenantId,
        brand_model: params.brandModel,
      }).first();
  if (existing) return existing;

  return db.orm.public.Vehicle.create({
    tenant_id: params.tenantId,
    type: params.type,
    license_plate: params.licensePlate,
    brand_model: params.brandModel,
    battery_kwh: params.batteryKwh,
  });
}

/**
 * Idempotently seeds the entire Bay-Rent database (Admin, Tenants, Garages, Vehicles, Rentals, Extensions).
 */
async function seed(): Promise<void> {
  const adminEmail = process.env['ADMIN_SEED_EMAIL'] ?? 'admin@bayrent.com';
  const adminPassword = process.env['ADMIN_SEED_PASSWORD'] ?? 'Admin123!';

  const admin = await ensureUser({
    nationalId: '0000000000000001',
    fullName: 'System Administrator',
    phoneNumber: '080000000000',
    email: adminEmail,
    password: adminPassword,
    role: 'ADMIN',
    verificationStatus: 'ACCEPTED',
  });

  const budi = await ensureUser({
    nationalId: '3578012345678901',
    fullName: 'Budi Santoso',
    phoneNumber: '081234567890',
    email: 'budi@example.com',
    password: 'Tenant123!',
    role: 'TENANT',
    verificationStatus: 'ACCEPTED',
  });

  const siti = await ensureUser({
    nationalId: '3578012345678902',
    fullName: 'Siti Rahmawati',
    phoneNumber: '081234567891',
    email: 'siti@example.com',
    password: 'Tenant123!',
    role: 'TENANT',
    verificationStatus: 'ACCEPTED',
  });

  await ensureUser({
    nationalId: '3578012345678903',
    fullName: 'Andi Wijaya',
    phoneNumber: '081234567892',
    email: 'andi@example.com',
    password: 'Tenant123!',
    role: 'TENANT',
    verificationStatus: 'PENDING',
  });

  await ensureUser({
    nationalId: '3578012345678904',
    fullName: 'Rina Kusuma',
    phoneNumber: '081234567893',
    email: 'rina@example.com',
    password: 'Tenant123!',
    role: 'TENANT',
    verificationStatus: 'REJECTED',
  });

  for (let i = 1; i <= 5; i++) {
    await ensureGarage({
      garageCode: `S${String(i).padStart(3, '0')}`,
      type: 'BIKE',
      dailyRate: 15_000,
      kwhRate: null,
      status: i === 1 ? 'USED' : 'AVAILABLE',
    });
  }

  for (let i = 1; i <= 5; i++) {
    await ensureGarage({
      garageCode: `C${String(i).padStart(3, '0')}`,
      type: 'CAR',
      dailyRate: 50_000,
      kwhRate: null,
      status: i === 1 ? 'USED' : 'AVAILABLE',
    });
  }

  for (let i = 1; i <= 4; i++) {
    await ensureGarage({
      garageCode: `E${String(i).padStart(3, '0')}`,
      type: 'EV',
      dailyRate: 75_000,
      kwhRate: 2_500,
      status: i === 1 ? 'USED' : 'AVAILABLE',
    });
  }

  const civic = await ensureVehicle({
    tenantId: budi.user_id,
    type: 'CAR',
    licensePlate: 'L 1367 DR',
    brandModel: 'Honda Civic RS',
    batteryKwh: null,
  });

  const polygon = await ensureVehicle({
    tenantId: budi.user_id,
    type: 'BICYCLE',
    licensePlate: null,
    brandModel: 'Polygon Xtrada 7',
    batteryKwh: null,
  });

  const ioniq = await ensureVehicle({
    tenantId: siti.user_id,
    type: 'EV',
    licensePlate: 'B 2026 EV',
    brandModel: 'Hyundai Ioniq 5',
    batteryKwh: 72.6,
  });

  const vespa = await ensureVehicle({
    tenantId: siti.user_id,
    type: 'MOTORCYCLE',
    licensePlate: 'L 4512 AB',
    brandModel: 'Vespa Primavera 150',
    batteryKwh: null,
  });

  const existingRentals = await db.orm.public.Rental.all();
  if (existingRentals.length === 0) {
    // 1. Active monthly CAR rental (Budi)
    await db.orm.public.Rental.create({
      garage_code: 'C001',
      vehicle_id: civic.vehicle_id,
      rental_type: 'MONTHLY',
      days_count: null,
      start_date: daysFromToday(-5),
      end_date: daysFromToday(25),
      total_cost: 1_250_000,
      payment_proof_url: '/api/uploads/seed-car-proof.png',
      status: 'ACTIVE',
    });

    // 2. Active daily EV rental (Siti)
    await db.orm.public.Rental.create({
      garage_code: 'E001',
      vehicle_id: ioniq.vehicle_id,
      rental_type: 'DAILY',
      days_count: 7,
      start_date: daysFromToday(-2),
      end_date: daysFromToday(5),
      total_cost: 706_500,
      payment_proof_url: '/api/uploads/seed-ev-proof.png',
      status: 'ACTIVE',
    });

    // 3. Active daily BIKE rental with 1 extension (Siti's Vespa)
    const vespaRental = await db.orm.public.Rental.create({
      garage_code: 'S001',
      vehicle_id: vespa.vehicle_id,
      rental_type: 'DAILY',
      days_count: 3,
      start_date: daysFromToday(-3),
      end_date: daysFromToday(4),
      total_cost: 45_000,
      payment_proof_url: '/api/uploads/seed-bike-proof.png',
      status: 'ACTIVE',
    });

    await db.orm.public.RentalExtension.create({
      rental_id: vespaRental.rental_id,
      admin_id: admin.user_id,
      previous_end_date: daysFromToday(0),
      new_end_date: daysFromToday(4),
      remaining_cost: 60_000,
      payment_proof_url: '/api/uploads/seed-bike-ext-proof.png',
    });

    // 4. Completed historical BIKE rental (Budi's Polygon)
    await db.orm.public.Rental.create({
      garage_code: 'S002',
      vehicle_id: polygon.vehicle_id,
      rental_type: 'DAILY',
      days_count: 5,
      start_date: daysFromToday(-20),
      end_date: daysFromToday(-15),
      total_cost: 75_000,
      payment_proof_url: '/api/uploads/seed-history-proof.png',
      status: 'COMPLETED',
    });
  }

  console.log('Database seeded successfully (Admin, Tenants, Garages, Vehicles, Rentals, Extensions).');
}

seed()
  .catch((error) => {
    console.error('Database seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
