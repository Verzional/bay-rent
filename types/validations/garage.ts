import { z } from 'zod';

/**
 * Zod schema validating batch garage bay creation.
 */
export const batchCreateGarageSchema = z
  .object({
    type: z.enum(['BIKE', 'CAR', 'EV']),
    quantity: z
      .number()
      .int('Quantity must be a whole number.')
      .min(1, 'Quantity must be at least 1.')
      .max(999, 'Quantity cannot exceed 999 bays.'),
    dailyRate: z.number().positive('Daily rate must be greater than zero.'),
    kwhRate: z.number().positive('kWh rate must be greater than zero.').nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'EV' && (data.kwhRate === undefined || data.kwhRate === null)) {
      ctx.addIssue({
        code: 'custom',
        path: ['kwhRate'],
        message: 'EV garages require a positive electricity rate per kWh.',
      });
    }
  });
