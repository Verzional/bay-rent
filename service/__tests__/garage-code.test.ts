import { describe, expect, it } from 'vitest';
import { GarageCodeGenerator } from '@/service/garage-code';

describe('GarageCodeGenerator', () => {
  it('generates S###, C###, E### starting at 001 when empty', () => {
    expect(GarageCodeGenerator.generateNextCodes('BIKE', [], 3)).toEqual([
      'S001',
      'S002',
      'S003',
    ]);
    expect(GarageCodeGenerator.generateNextCodes('CAR', [], 2)).toEqual(['C001', 'C002']);
    expect(GarageCodeGenerator.generateNextCodes('EV', [], 1)).toEqual(['E001']);
  });

  it('continues incrementally from highest existing code per type', () => {
    expect(GarageCodeGenerator.generateNextCodes('CAR', ['C001', 'C009', 'C005'], 2)).toEqual([
      'C010',
      'C011',
    ]);
  });

  it('allows generating up to code 999 and rejects exceeding 999', () => {
    expect(GarageCodeGenerator.generateNextCodes('EV', ['E997'], 2)).toEqual([
      'E998',
      'E999',
    ]);
    expect(() => GarageCodeGenerator.generateNextCodes('EV', ['E997'], 3)).toThrow();
    expect(() => GarageCodeGenerator.generateNextCodes('BIKE', ['S999'], 1)).toThrow();
  });
});
