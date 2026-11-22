import { type Mock, vi } from 'vitest';

export interface ModelMock {
  where: Mock;
  include: Mock;
  select: Mock;
  orderBy: Mock;
  forUpdate: Mock;
  first: Mock;
  all: Mock;
  create: Mock;
  update: Mock;
  updateAll: Mock;
  aggregate: Mock;
}

export interface MockDb {
  orm: { public: Record<ModelName, ModelMock> };
  models: Record<ModelName, ModelMock>;
  transaction: Mock;
  reset: () => void;
}

type ModelName = 'User' | 'Garage' | 'Rental' | 'Vehicle' | 'RentalExtension';

const CHAIN_METHODS = ['where', 'include', 'select', 'orderBy', 'forUpdate'] as const;
const TERMINAL_METHODS = [
  'first',
  'all',
  'create',
  'update',
  'updateAll',
  'aggregate',
] as const;

function createModel(): ModelMock {
  const model = {} as ModelMock;
  for (const key of CHAIN_METHODS) model[key] = vi.fn();
  for (const key of TERMINAL_METHODS) model[key] = vi.fn();
  return model;
}

/**
 * Builds a chainable fake of the Prisma 8 `db` client (`db.orm.public.<Model>` + `db.transaction`).
 * Chain methods (`where`, `include`, ...) return the model itself; terminal methods are plain mocks.
 */
export function createDbMock(): MockDb {
  const models: Record<ModelName, ModelMock> = {
    User: createModel(),
    Garage: createModel(),
    Rental: createModel(),
    Vehicle: createModel(),
    RentalExtension: createModel(),
  };

  const db: MockDb = {
    orm: { public: models },
    models,
    transaction: vi.fn(),
    reset: () => {
      for (const model of Object.values(models)) {
        for (const key of TERMINAL_METHODS) model[key].mockReset();
        for (const key of CHAIN_METHODS) {
          model[key].mockReset();
          model[key].mockImplementation(() => model);
        }
      }
      db.transaction.mockReset();
      db.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
        callback({ orm: { public: models } }),
      );
    },
  };

  db.reset();
  return db;
}
