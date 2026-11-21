'use client';

import { useMemo } from 'react';
import { GarageCodeGenerator, MAX_GARAGE_SEQUENCE_NUMBER } from '@/service/garage-code';
import type { GarageType } from '@/types';

export interface BatchGaragePreview {
  firstCode: string | null;
  lastCode: string | null;
  remainingCapacity: number;
  exceedsCapacity: boolean;
}

/**
 * Computes live sequential bay code range previews (`S001 -> S010`) and remaining capacity.
 */
export function useBatchGaragePreview(
  type: GarageType,
  quantity: number,
  maxSequenceByType: Record<GarageType, number>,
): BatchGaragePreview {
  return useMemo(() => {
    const currentMax = maxSequenceByType[type] ?? 0;
    const remainingCapacity = Math.max(0, MAX_GARAGE_SEQUENCE_NUMBER - currentMax);

    if (!Number.isInteger(quantity) || quantity < 1) {
      return {
        firstCode: null,
        lastCode: null,
        remainingCapacity,
        exceedsCapacity: false,
      };
    }

    if (quantity > remainingCapacity) {
      return {
        firstCode: null,
        lastCode: null,
        remainingCapacity,
        exceedsCapacity: true,
      };
    }

    return {
      firstCode: GarageCodeGenerator.formatCode(type, currentMax + 1),
      lastCode: GarageCodeGenerator.formatCode(type, currentMax + quantity),
      remainingCapacity,
      exceedsCapacity: false,
    };
  }, [maxSequenceByType, quantity, type]);
}
