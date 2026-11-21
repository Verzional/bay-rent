import { z } from 'zod';

/**
 * Zod schema validating year/month report query filters.
 */
export const reportYearMonthSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12).optional(),
});
