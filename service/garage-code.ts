import type { GarageType } from '@/types';

const GARAGE_PREFIX_BY_TYPE: Record<GarageType, string> = {
  BICYCLE: 'S',
  CAR: 'C',
  EV: 'E',
};

/**
 * Maximum sequential bay number allowed per garage category (`001` through `999`).
 */
export const MAX_GARAGE_SEQUENCE_NUMBER = 999;

/**
 * Generates sequential zero-padded garage bay codes (`S###`, `C###`, `E###`).
 */
export class GarageCodeGenerator {
  public static getPrefix(type: GarageType): string {
    return GARAGE_PREFIX_BY_TYPE[type];
  }

  public static getMaxSequenceNumber(type: GarageType, existingCodes: string[]): number {
    const prefix = GarageCodeGenerator.getPrefix(type);
    const pattern = new RegExp(`^${prefix}(\\d{3})$`);
    let maxNumber = 0;

    for (const code of existingCodes) {
      const match = pattern.exec(code);
      if (match) {
        const parsed = Number(match[1]);
        if (parsed > maxNumber) {
          maxNumber = parsed;
        }
      }
    }

    return maxNumber;
  }

  public static formatCode(type: GarageType, sequenceNumber: number): string {
    const prefix = GarageCodeGenerator.getPrefix(type);
    return `${prefix}${String(sequenceNumber).padStart(3, '0')}`;
  }

  /**
   * Generates `quantity` sequential codes starting after the highest existing code.
   */
  public static generateNextCodes(
    type: GarageType,
    existingCodes: string[],
    quantity: number,
  ): string[] {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error('Quantity must be an integer of at least 1.');
    }

    const currentMax = GarageCodeGenerator.getMaxSequenceNumber(type, existingCodes);
    const remainingCapacity = MAX_GARAGE_SEQUENCE_NUMBER - currentMax;

    if (quantity > remainingCapacity) {
      throw new Error(
        remainingCapacity <= 0
          ? `Maximum limit of ${MAX_GARAGE_SEQUENCE_NUMBER} bays reached for ${type}.`
          : `Only ${remainingCapacity} remaining slots available for ${type} bays (max ${MAX_GARAGE_SEQUENCE_NUMBER}).`,
      );
    }

    const codes: string[] = [];
    for (let offset = 1; offset <= quantity; offset += 1) {
      codes.push(GarageCodeGenerator.formatCode(type, currentMax + offset));
    }

    return codes;
  }
}
