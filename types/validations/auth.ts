import { z } from 'zod';

/**
 * Zod schema validating new tenant registration requests.
 */
export const registerTenantSchema = z.object({
  nationalId: z
    .string()
    .trim()
    .regex(/^\d{16}$/, 'National ID (NIK) must be exactly 16 numeric digits.'),
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters.')
    .max(120, 'Full name must be under 120 characters.'),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s-]{7,18}$/, 'Enter a valid phone number (8-19 characters).'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters.')
    .max(100, 'Password must be at most 100 characters.'),
});

/**
 * Zod schema validating login credentials.
 */
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

/**
 * Zod schema validating admin tenant verification decisions.
 */
export const verifyTenantSchema = z.object({
  tenantId: z.number().int().positive(),
  decision: z.enum(['ACCEPTED', 'REJECTED']),
});
