import bcrypt from 'bcryptjs';
import { db } from './db';

/**
 * Seeds the default Administrator account if one does not already exist.
 */
async function seed(): Promise<void> {
  const adminEmail = process.env['ADMIN_SEED_EMAIL'] ?? 'admin@bayrent.com';
  const adminPassword = process.env['ADMIN_SEED_PASSWORD'] ?? 'Admin123!';

  const existing = await db.orm.public.User.where({ email: adminEmail }).first();
  if (existing) {
    console.log(`Admin account already exists: ${existing.email} (id=${existing.user_id})`);
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const admin = await db.orm.public.User.create({
    national_id: '0000000000000001',
    full_name: 'System Administrator',
    phone_number: '080000000000',
    email: adminEmail,
    password: passwordHash,
    role: 'ADMIN',
    verification_status: 'ACCEPTED',
  });

  console.log(`Seeded default admin account: ${admin.email} (id=${admin.user_id})`);
}

seed()
  .catch((error) => {
    console.error('Database seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
