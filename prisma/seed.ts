import fs from 'node:fs/promises';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { db } from './db';

// Minimal valid 1x1 PNG (transparent) for seeded payment proof previews
const SEED_PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

const SEED_PROOF_SOURCES: Record<string, string> = {
  '00000000-0000-4000-8000-000000000001.png': 'Majima.png',
  '00000000-0000-4000-8000-000000000002.png': 'Ichiban.png',
  '00000000-0000-4000-8000-000000000003.png': 'Nishiki.png',
  '00000000-0000-4000-8000-000000000004.png': 'Saejima.png',
  '00000000-0000-4000-8000-000000000005.png': 'Ryuji.png',
};

async function ensureSeedProofFiles(): Promise<void> {
  const uploadDir = path.join(process.cwd(), 'uploads');
  const picturesDir = path.join(process.cwd(), 'docs', 'pictures');
  await fs.mkdir(uploadDir, { recursive: true });
  for (const [filename, sourceName] of Object.entries(SEED_PROOF_SOURCES)) {
    const target = path.join(uploadDir, filename);
    const source = path.join(picturesDir, sourceName);
    try {
      await fs.copyFile(source, target);
    } catch {
      await fs.writeFile(target, SEED_PNG_BYTES);
    }
  }
}

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
  await ensureSeedProofFiles();

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

  const dewi = await ensureUser({
    nationalId: '3578012345678905',
    fullName: 'Dewi Lestari',
    phoneNumber: '081234567894',
    email: 'dewi@example.com',
    password: 'Tenant123!',
    role: 'TENANT',
    verificationStatus: 'ACCEPTED',
  });

  const fajar = await ensureUser({
    nationalId: '3578012345678906',
    fullName: 'Fajar Pratama',
    phoneNumber: '081234567895',
    email: 'fajar@example.com',
    password: 'Tenant123!',
    role: 'TENANT',
    verificationStatus: 'ACCEPTED',
  });

  const gita = await ensureUser({
    nationalId: '3578012345678907',
    fullName: 'Gita Permata',
    phoneNumber: '081234567896',
    email: 'gita@example.com',
    password: 'Tenant123!',
    role: 'TENANT',
    verificationStatus: 'ACCEPTED',
  });

  await ensureUser({
    nationalId: '3578012345678908',
    fullName: 'Hendra Gunawan',
    phoneNumber: '081234567897',
    email: 'hendra@example.com',
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

  for (let i = 1; i <= 8; i++) {
    await ensureGarage({
      garageCode: `S${String(i).padStart(3, '0')}`,
      type: 'BIKE',
      dailyRate: 15_000,
      kwhRate: null,
      status: i <= 2 ? 'USED' : 'AVAILABLE',
    });
  }

  for (let i = 1; i <= 9; i++) {
    await ensureGarage({
      garageCode: `C${String(i).padStart(3, '0')}`,
      type: 'CAR',
      dailyRate: 50_000,
      kwhRate: null,
      status: i <= 2 ? 'USED' : 'AVAILABLE',
    });
  }

  for (let i = 1; i <= 8; i++) {
    await ensureGarage({
      garageCode: `E${String(i).padStart(3, '0')}`,
      type: 'EV',
      dailyRate: 75_000,
      kwhRate: 2_500,
      status: i <= 2 ? 'USED' : 'AVAILABLE',
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

  const innova = await ensureVehicle({
    tenantId: dewi.user_id,
    type: 'CAR',
    licensePlate: 'B 8821 KLM',
    brandModel: 'Toyota Innova Zenix',
    batteryKwh: null,
  });

  const byd = await ensureVehicle({
    tenantId: dewi.user_id,
    type: 'EV',
    licensePlate: 'B 1902 EV',
    brandModel: 'BYD Seal Performance',
    batteryKwh: 82.5,
  });

  const brompton = await ensureVehicle({
    tenantId: fajar.user_id,
    type: 'BICYCLE',
    licensePlate: null,
    brandModel: 'Brompton C Line',
    batteryKwh: null,
  });

  const pcx = await ensureVehicle({
    tenantId: fajar.user_id,
    type: 'MOTORCYCLE',
    licensePlate: 'L 7741 XY',
    brandModel: 'Honda PCX 160',
    batteryKwh: null,
  });

  const wuling = await ensureVehicle({
    tenantId: gita.user_id,
    type: 'EV',
    licensePlate: 'L 3001 EV',
    brandModel: 'Wuling Air EV',
    batteryKwh: 26.7,
  });

  const mazda = await ensureVehicle({
    tenantId: gita.user_id,
    type: 'CAR',
    licensePlate: 'L 9912 MZ',
    brandModel: 'Mazda CX-5',
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
      payment_proof_url: '/api/uploads/00000000-0000-4000-8000-000000000001.png',
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
      payment_proof_url: '/api/uploads/00000000-0000-4000-8000-000000000002.png',
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
      payment_proof_url: '/api/uploads/00000000-0000-4000-8000-000000000003.png',
      status: 'ACTIVE',
    });

    await db.orm.public.RentalExtension.create({
      rental_id: vespaRental.rental_id,
      admin_id: admin.user_id,
      previous_end_date: daysFromToday(0),
      new_end_date: daysFromToday(4),
      remaining_cost: 60_000,
      payment_proof_url: '/api/uploads/00000000-0000-4000-8000-000000000004.png',
    });

    // 4. Active monthly CAR rental (Dewi)
    await db.orm.public.Rental.create({
      garage_code: 'C002',
      vehicle_id: innova.vehicle_id,
      rental_type: 'MONTHLY',
      days_count: null,
      start_date: daysFromToday(-10),
      end_date: daysFromToday(20),
      total_cost: 1_250_000,
      payment_proof_url: '/api/uploads/00000000-0000-4000-8000-000000000001.png',
      status: 'ACTIVE',
    });

    // 5. Active daily EV rental (Gita)
    const wulingRental = await db.orm.public.Rental.create({
      garage_code: 'E002',
      vehicle_id: wuling.vehicle_id,
      rental_type: 'DAILY',
      days_count: 5,
      start_date: daysFromToday(-4),
      end_date: daysFromToday(3),
      total_cost: 441_750,
      payment_proof_url: '/api/uploads/00000000-0000-4000-8000-000000000002.png',
      status: 'ACTIVE',
    });

    await db.orm.public.RentalExtension.create({
      rental_id: wulingRental.rental_id,
      admin_id: admin.user_id,
      previous_end_date: daysFromToday(1),
      new_end_date: daysFromToday(3),
      remaining_cost: 150_000,
      payment_proof_url: '/api/uploads/00000000-0000-4000-8000-000000000004.png',
    });

    // 6. Active daily BIKE rental (Fajar's Brompton)
    await db.orm.public.Rental.create({
      garage_code: 'S002',
      vehicle_id: brompton.vehicle_id,
      rental_type: 'DAILY',
      days_count: 10,
      start_date: daysFromToday(-1),
      end_date: daysFromToday(9),
      total_cost: 150_000,
      payment_proof_url: '/api/uploads/00000000-0000-4000-8000-000000000003.png',
      status: 'ACTIVE',
    });

    // 7-12. Completed historical rentals across recent months for analytics
    const historySpecs = [
      { garage: 'S003', vehicleId: polygon.vehicle_id, days: 5, offset: -20, cost: 75_000 },
      { garage: 'C003', vehicleId: mazda.vehicle_id, days: 4, offset: -28, cost: 200_000 },
      { garage: 'E003', vehicleId: byd.vehicle_id, days: 6, offset: -35, cost: 656_250 },
      { garage: 'S004', vehicleId: pcx.vehicle_id, days: 7, offset: -42, cost: 105_000 },
      { garage: 'C004', vehicleId: innova.vehicle_id, days: 3, offset: -55, cost: 150_000 },
      { garage: 'E004', vehicleId: ioniq.vehicle_id, days: 5, offset: -64, cost: 556_500 },
    ];

    for (const h of historySpecs) {
      await db.orm.public.Rental.create({
        garage_code: h.garage,
        vehicle_id: h.vehicleId,
        rental_type: 'DAILY',
        days_count: h.days,
        start_date: daysFromToday(h.offset),
        end_date: daysFromToday(h.offset + h.days),
        total_cost: h.cost,
        payment_proof_url: '/api/uploads/00000000-0000-4000-8000-000000000005.png',
        status: 'COMPLETED',
      });
    }
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
