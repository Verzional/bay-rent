'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  clearSessionCookie,
  requireAdmin,
  setSessionCookie,
  signSession,
} from '@/lib/session';
import { db } from '@/prisma/db';
import {
  type ActionState,
  loginSchema,
  parseSchema,
  registerTenantSchema,
  type TenantProfile,
  type VerificationStatus,
  verifyTenantSchema,
} from '@/types';

/**
 * Registers a new tenant account (`PENDING` verification), sets session cookie, and redirects.
 */
export async function registerAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseSchema(registerTenantSchema, {
    nationalId: String(formData.get('nationalId') ?? ''),
    fullName: String(formData.get('fullName') ?? ''),
    phoneNumber: String(formData.get('phoneNumber') ?? ''),
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  });

  if (!parsed.ok) {
    return {
      success: false,
      message: parsed.message,
      fieldErrors: parsed.fieldErrors,
    };
  }

  const existingByEmail = await db.orm.public.User.where({
    email: parsed.data.email,
  }).first();
  if (existingByEmail) {
    return {
      success: false,
      message: 'An account with this email already exists.',
      fieldErrors: { email: ['This email is already registered.'] },
    };
  }

  const existingByNik = await db.orm.public.User.where({
    national_id: parsed.data.nationalId,
  }).first();
  if (existingByNik) {
    return {
      success: false,
      message: 'An account with this National ID (NIK) already exists.',
      fieldErrors: { nationalId: ['This National ID (NIK) is already registered.'] },
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const created = await db.orm.public.User.create({
    national_id: parsed.data.nationalId,
    full_name: parsed.data.fullName,
    phone_number: parsed.data.phoneNumber,
    email: parsed.data.email,
    password: passwordHash,
    role: 'TENANT',
    verification_status: 'PENDING',
  });

  const token = await signSession({
    userId: created.user_id,
    email: created.email,
    fullName: created.full_name,
    role: created.role,
    verificationStatus: created.verification_status,
  });
  await setSessionCookie(token);

  redirect('/tenant');
}

/**
 * Authenticates an Admin or Tenant user, sets session cookie, and redirects by role.
 */
export async function loginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseSchema(loginSchema, {
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  });

  if (!parsed.ok) {
    return {
      success: false,
      message: parsed.message,
      fieldErrors: parsed.fieldErrors,
    };
  }

  const user = await db.orm.public.User.where({ email: parsed.data.email }).first();
  if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
    return {
      success: false,
      message: 'Invalid email or password.',
    };
  }

  const token = await signSession({
    userId: user.user_id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    verificationStatus: user.verification_status,
  });
  await setSessionCookie(token);

  redirect(user.role === 'ADMIN' ? '/admin' : '/tenant');
}

/**
 * Signs out the current user and redirects to `/login`.
 */
export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect('/login');
}

/**
 * Lists tenant accounts for Admin KTP/NIK verification, optionally filtered by status.
 */
export async function listTenantsForVerification(
  status?: VerificationStatus,
): Promise<TenantProfile[]> {
  await requireAdmin();

  const users = status
    ? await db.orm.public.User.where({ role: 'TENANT', verification_status: status })
        .orderBy((u) => u.created_at.desc())
        .all()
    : await db.orm.public.User.where({ role: 'TENANT' })
        .orderBy((u) => u.created_at.desc())
        .all();

  return users.map((u) => ({
    userId: u.user_id,
    nationalId: u.national_id,
    fullName: u.full_name,
    phoneNumber: u.phone_number,
    email: u.email,
    role: u.role,
    verificationStatus: u.verification_status,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
  }));
}

/**
 * Accepts or rejects a pending tenant registration after Admin KTP review.
 */
export async function verifyTenantAction(
  tenantId: number,
  decision: 'ACCEPTED' | 'REJECTED',
): Promise<ActionState> {
  await requireAdmin();

  const parsed = parseSchema(verifyTenantSchema, { tenantId, decision });
  if (!parsed.ok) {
    return { success: false, message: parsed.message };
  }

  const existing = await db.orm.public.User.where({
    user_id: parsed.data.tenantId,
  }).first();
  if (!existing || existing.role !== 'TENANT') {
    return { success: false, message: 'Tenant account not found.' };
  }

  await db.orm.public.User.where({ user_id: parsed.data.tenantId }).update({
    verification_status: parsed.data.decision,
  });

  revalidatePath('/admin');
  revalidatePath('/admin/verifications');
  revalidatePath('/tenant');

  return {
    success: true,
    message:
      decision === 'ACCEPTED'
        ? 'Tenant account verified and approved.'
        : 'Tenant verification rejected.',
  };
}

/**
 * Counts tenant accounts awaiting Admin verification.
 */
export async function countPendingVerifications(): Promise<number> {
  await requireAdmin();

  const result = await db.orm.public.User.where({
    role: 'TENANT',
    verification_status: 'PENDING',
  }).aggregate((agg) => ({
    total: agg.count(),
  }));

  return result.total;
}
