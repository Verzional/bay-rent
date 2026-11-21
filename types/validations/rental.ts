import { z } from 'zod';

/**
 * Zod schema validating inline new vehicle creation during rental booking.
 */
export const newVehicleSchema = z
  .object({
    type: z.enum(['BICYCLE', 'MOTORCYCLE', 'CAR', 'EV']),
    licensePlate: z
      .string()
      .trim()
      .transform((val) => (val === '' ? null : val.toUpperCase()))
      .nullable()
      .optional(),
    brandModel: z
      .string()
      .trim()
      .min(2, 'Vehicle brand and model is required.')
      .max(100, 'Brand and model must be under 100 characters.'),
    batteryKwh: z
      .number()
      .positive('Battery capacity (kWh) must be greater than zero.')
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type !== 'BICYCLE' && !data.licensePlate) {
      ctx.addIssue({
        code: 'custom',
        path: ['licensePlate'],
        message: 'License plate is required for motorcycles, cars, and EVs.',
      });
    }
    if (data.type === 'EV' && (data.batteryKwh === undefined || data.batteryKwh === null)) {
      ctx.addIssue({
        code: 'custom',
        path: ['batteryKwh'],
        message: 'Battery capacity (kWh) is required for electric vehicles.',
      });
    }
  });

/**
 * Zod schema validating rental creation inputs.
 */
export const createRentalSchema = z
  .object({
    existingVehicleId: z.number().int().positive().optional(),
    newVehicle: newVehicleSchema.optional(),
    garageCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[SCE]\d{3}$/, 'Select a valid garage bay code.'),
    rentalType: z.enum(['DAILY', 'MONTHLY']),
    daysCount: z.number().int().min(1).max(30).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.existingVehicleId && !data.newVehicle) {
      ctx.addIssue({
        code: 'custom',
        path: ['existingVehicleId'],
        message: 'Select a saved vehicle or enter new vehicle details.',
      });
    }
    if (data.existingVehicleId && data.newVehicle) {
      ctx.addIssue({
        code: 'custom',
        path: ['existingVehicleId'],
        message: 'Provide either an existing vehicle or new vehicle details, not both.',
      });
    }
    if (
      data.rentalType === 'DAILY' &&
      (data.daysCount === undefined ||
        data.daysCount === null ||
        data.daysCount < 1 ||
        data.daysCount > 30)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['daysCount'],
        message: 'Daily rentals require between 1 and 30 days.',
      });
    }
  });

/**
 * Zod schema validating rental extension inputs.
 */
export const extendRentalSchema = z.object({
  rentalId: z.number().int().positive('Invalid rental ID.'),
  newEndDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a valid end date (YYYY-MM-DD).'),
});
