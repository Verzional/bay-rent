import 'server-only';
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/prisma/db';
import type { SessionUser } from '@/types';

export const SESSION_COOKIE_NAME = 'bayrent_session';
const SESSION_DURATION = '7d';

function getSecretKey(): Uint8Array {
  const secret = process.env['SESSION_SECRET'] ?? '';
  const resolved =
    secret.length >= 16
      ? secret
      : 'bay-rent-dev-fallback-secret-change-in-production';
  return new TextEncoder().encode(resolved);
}

/**
 * Signs a `SessionUser` payload into an HS256 JWT token string.
 */
export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({
    userId: user.userId,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    verificationStatus: user.verificationStatus,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecretKey());
}

/**
 * Verifies a JWT session token and returns the decoded `SessionUser`, or `null`.
 */
export async function verifySession(token: string): Promise<SessionUser | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload['userId'] !== 'number' ||
      typeof payload['email'] !== 'string' ||
      typeof payload['fullName'] !== 'string' ||
      (payload['role'] !== 'ADMIN' && payload['role'] !== 'TENANT') ||
      (payload['verificationStatus'] !== 'PENDING' &&
        payload['verificationStatus'] !== 'ACCEPTED' &&
        payload['verificationStatus'] !== 'REJECTED')
    ) {
      return null;
    }

    return {
      userId: payload['userId'],
      email: payload['email'],
      fullName: payload['fullName'],
      role: payload['role'],
      verificationStatus: payload['verificationStatus'],
    };
  } catch {
    return null;
  }
}

/**
 * Sets the signed HTTP-only session cookie.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

/**
 * Clears the session cookie on logout.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Reads the session cookie and resolves live user data from PostgreSQL.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const claims = await verifySession(token);
  if (!claims) return null;

  const user = await db.orm.public.User.where({ user_id: claims.userId }).first();
  if (!user) return null;

  return {
    userId: user.user_id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    verificationStatus: user.verification_status,
  };
}

/**
 * Requires an authenticated user, redirecting to `/login` otherwise.
 */
export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

/**
 * Requires an authenticated `ADMIN` user.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireSessionUser();
  if (user.role !== 'ADMIN') {
    redirect('/tenant');
  }
  return user;
}

/**
 * Requires an authenticated `TENANT` user.
 */
export async function requireTenant(): Promise<SessionUser> {
  const user = await requireSessionUser();
  if (user.role !== 'TENANT') {
    redirect('/admin');
  }
  return user;
}
