import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/prisma/db';
import {
  countPendingVerifications,
  listTenantsForVerification,
  loginAction,
  logoutAction,
  registerAction,
  verifyTenantAction,
} from '../auth';
import type { MockDb } from './helpers/db-mock';

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  signSession: vi.fn(),
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
  revalidatePath: vi.fn(),
  hash: vi.fn(),
  compare: vi.fn(),
}));

vi.mock('@/lib/session', () => ({
  requireAdmin: mocks.requireAdmin,
  signSession: mocks.signSession,
  setSessionCookie: mocks.setSessionCookie,
  clearSessionCookie: mocks.clearSessionCookie,
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));
vi.mock('bcryptjs', () => ({
  default: { hash: mocks.hash, compare: mocks.compare },
}));
vi.mock('@/prisma/db', async () => {
  const { createDbMock } = await import('./helpers/db-mock');
  return { db: createDbMock() };
});

const mockDb = db as unknown as MockDb;
const { User } = mockDb.models;

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const validRegistration = {
  nationalId: '3578012345678901',
  fullName: 'Budi Santoso',
  phoneNumber: '081234567890',
  email: 'Budi@Example.com',
  password: 'secret123',
};

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    user_id: 7,
    national_id: '3578012345678901',
    full_name: 'Budi Santoso',
    phone_number: '081234567890',
    email: 'budi@example.com',
    password: 'hashed-password',
    role: 'TENANT',
    verification_status: 'PENDING',
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-02T00:00:00Z'),
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  mockDb.reset();
  mocks.signSession.mockResolvedValue('signed-token');
  mocks.hash.mockResolvedValue('hashed-password');
});

describe('registerAction', () => {
  it('rejects invalid input without touching the database', async () => {
    const result = await registerAction(
      { success: false, message: '' },
      form({
        ...validRegistration,
        nationalId: '123',
        email: 'not-an-email',
        password: '123',
      }),
    );

    expect(result.success).toBe(false);
    expect(result.fieldErrors).toBeDefined();
    expect(User.first).not.toHaveBeenCalled();
    expect(User.create).not.toHaveBeenCalled();
  });

  it('rejects a duplicate email', async () => {
    User.first.mockResolvedValueOnce(userRow());

    const result = await registerAction(
      { success: false, message: '' },
      form(validRegistration),
    );

    expect(result).toMatchObject({
      success: false,
      message: 'An account with this email already exists.',
      fieldErrors: { email: ['This email is already registered.'] },
    });
    expect(User.create).not.toHaveBeenCalled();
  });

  it('rejects a duplicate National ID', async () => {
    User.first.mockResolvedValueOnce(null).mockResolvedValueOnce(userRow());

    const result = await registerAction(
      { success: false, message: '' },
      form(validRegistration),
    );

    expect(result).toMatchObject({
      success: false,
      message: 'An account with this National ID (NIK) already exists.',
      fieldErrors: { nationalId: ['This National ID (NIK) is already registered.'] },
    });
    expect(User.create).not.toHaveBeenCalled();
  });

  it('creates a PENDING tenant, sets the session cookie, and redirects to /tenant', async () => {
    User.first.mockResolvedValue(null);
    User.create.mockResolvedValueOnce(userRow());

    await expect(
      registerAction({ success: false, message: '' }, form(validRegistration)),
    ).rejects.toThrow('NEXT_REDIRECT:/tenant');

    expect(mocks.hash).toHaveBeenCalledWith('secret123', 10);
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'budi@example.com',
        password: 'hashed-password',
        role: 'TENANT',
        verification_status: 'PENDING',
      }),
    );
    expect(mocks.signSession).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 7, role: 'TENANT' }),
    );
    expect(mocks.setSessionCookie).toHaveBeenCalledWith('signed-token');
  });
});

describe('loginAction', () => {
  it('rejects malformed email and empty password', async () => {
    const result = await loginAction(
      { success: false, message: '' },
      form({ email: 'nope', password: '' }),
    );

    expect(result.success).toBe(false);
    expect(result.fieldErrors).toBeDefined();
    expect(User.first).not.toHaveBeenCalled();
  });

  it('rejects an unknown email with a generic message', async () => {
    User.first.mockResolvedValueOnce(null);

    const result = await loginAction(
      { success: false, message: '' },
      form({ email: 'ghost@example.com', password: 'secret123' }),
    );

    expect(result).toEqual({ success: false, message: 'Invalid email or password.' });
    expect(mocks.compare).not.toHaveBeenCalled();
    expect(mocks.setSessionCookie).not.toHaveBeenCalled();
  });

  it('rejects a wrong password with the same generic message', async () => {
    User.first.mockResolvedValueOnce(userRow());
    mocks.compare.mockResolvedValueOnce(false);

    const result = await loginAction(
      { success: false, message: '' },
      form({ email: 'budi@example.com', password: 'wrong-password' }),
    );

    expect(result).toEqual({ success: false, message: 'Invalid email or password.' });
    expect(mocks.compare).toHaveBeenCalledWith('wrong-password', 'hashed-password');
    expect(mocks.setSessionCookie).not.toHaveBeenCalled();
  });

  it('normalizes email casing before lookup', async () => {
    User.first.mockResolvedValueOnce(null);

    await loginAction(
      { success: false, message: '' },
      form({ email: '  Budi@Example.COM ', password: 'secret123' }),
    );

    expect(User.where).toHaveBeenCalledWith({ email: 'budi@example.com' });
  });

  it('logs in an admin and redirects to /admin', async () => {
    User.first.mockResolvedValueOnce(
      userRow({ user_id: 1, role: 'ADMIN', verification_status: 'ACCEPTED' }),
    );
    mocks.compare.mockResolvedValueOnce(true);

    await expect(
      loginAction(
        { success: false, message: '' },
        form({ email: 'admin@bayrent.com', password: 'secret123' }),
      ),
    ).rejects.toThrow('NEXT_REDIRECT:/admin');

    expect(mocks.setSessionCookie).toHaveBeenCalledWith('signed-token');
  });

  it('logs in a tenant and redirects to /tenant', async () => {
    User.first.mockResolvedValueOnce(userRow());
    mocks.compare.mockResolvedValueOnce(true);

    await expect(
      loginAction(
        { success: false, message: '' },
        form({ email: 'budi@example.com', password: 'secret123' }),
      ),
    ).rejects.toThrow('NEXT_REDIRECT:/tenant');

    expect(mocks.setSessionCookie).toHaveBeenCalledWith('signed-token');
  });
});

describe('logoutAction', () => {
  it('clears the session cookie and redirects to /login', async () => {
    await expect(logoutAction()).rejects.toThrow('NEXT_REDIRECT:/login');
    expect(mocks.clearSessionCookie).toHaveBeenCalledTimes(1);
  });
});

describe('listTenantsForVerification', () => {
  it('requires admin and maps unfiltered tenants', async () => {
    User.all.mockResolvedValueOnce([userRow()]);

    const result = await listTenantsForVerification();

    expect(mocks.requireAdmin).toHaveBeenCalledTimes(1);
    expect(User.where).toHaveBeenCalledWith({ role: 'TENANT' });
    expect(result).toEqual([
      {
        userId: 7,
        nationalId: '3578012345678901',
        fullName: 'Budi Santoso',
        phoneNumber: '081234567890',
        email: 'budi@example.com',
        role: 'TENANT',
        verificationStatus: 'PENDING',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-02T00:00:00Z'),
      },
    ]);
  });

  it('filters by verification status', async () => {
    User.all.mockResolvedValueOnce([]);

    await listTenantsForVerification('ACCEPTED');

    expect(User.where).toHaveBeenCalledWith({
      role: 'TENANT',
      verification_status: 'ACCEPTED',
    });
  });
});

describe('verifyTenantAction', () => {
  it('rejects invalid tenant ids', async () => {
    const result = await verifyTenantAction(0, 'ACCEPTED');

    expect(mocks.requireAdmin).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
    expect(User.update).not.toHaveBeenCalled();
  });

  it('rejects a missing user', async () => {
    User.first.mockResolvedValueOnce(null);

    const result = await verifyTenantAction(99, 'ACCEPTED');

    expect(result).toEqual({ success: false, message: 'Tenant account not found.' });
  });

  it('rejects non-tenant accounts', async () => {
    User.first.mockResolvedValueOnce(userRow({ role: 'ADMIN' }));

    const result = await verifyTenantAction(1, 'REJECTED');

    expect(result).toEqual({ success: false, message: 'Tenant account not found.' });
    expect(User.update).not.toHaveBeenCalled();
  });

  it('approves a tenant and revalidates affected paths', async () => {
    User.first.mockResolvedValueOnce(userRow());

    const result = await verifyTenantAction(7, 'ACCEPTED');

    expect(User.update).toHaveBeenCalledWith({ verification_status: 'ACCEPTED' });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/admin');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/admin/verifications');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/tenant');
    expect(result).toEqual({
      success: true,
      message: 'Tenant account verified and approved.',
    });
  });

  it('rejects a tenant verification', async () => {
    User.first.mockResolvedValueOnce(userRow());

    const result = await verifyTenantAction(7, 'REJECTED');

    expect(User.update).toHaveBeenCalledWith({ verification_status: 'REJECTED' });
    expect(result).toEqual({ success: true, message: 'Tenant verification rejected.' });
  });
});

describe('countPendingVerifications', () => {
  it('requires admin and returns the aggregate total', async () => {
    User.aggregate.mockResolvedValueOnce({ total: 4 });

    await expect(countPendingVerifications()).resolves.toBe(4);

    expect(mocks.requireAdmin).toHaveBeenCalledTimes(1);
    expect(User.where).toHaveBeenCalledWith({
      role: 'TENANT',
      verification_status: 'PENDING',
    });
  });
});
