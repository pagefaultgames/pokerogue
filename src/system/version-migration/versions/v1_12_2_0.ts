import { speciesDataRegistry } from "#app/global-species-data-registry";
import { DexAttr } from "#enums/dex-attr";
import type { SystemSaveMigrator } from "#types/save-migrators";

const eggCostReductionThresholds = {
  1: [20, 40, 80], // 1 Cost
  2: [20, 40, 80], // 2 Cost
  3: [20, 40, 80], // 3 Cost
  4: [15, 30, 60], // 4 Cost
  5: [15, 30, 60], // 5 Cost
  6: [15, 30, 60], // 6 Cost
  7: [10, 20, 40], // 7 Cost
  8: [10, 20, 40], // 8 Cost
  9: [10, 20, 40], // 9 Cost
  10: [8, 16, 32], // 10 Cost
};

const addPityTracker: SystemSaveMigrator = {
  name: "addPityTracker",
  version: "1.12.2.0",
  migrate: (data): void => {
    for (const { speciesId } of speciesDataRegistry.getAllSpecies()) {
      if (data.dexData[speciesId].pity == null) {
        data.dexData[speciesId].pity = [0, 0];
      }
      const caughtAttr = data.dexData[speciesId]?.caughtAttr ?? 0n;
      const missingVariants = [DexAttr.VARIANT_2, DexAttr.VARIANT_3].filter(v => !(caughtAttr & v));
      if (speciesDataRegistry.hasPrevolution(speciesId) || missingVariants.length === 0) {
        // need to do it this way because of Pikachu :(
        continue;
      }
      // compensate for removing existing egg cost reductions
      const startercost = speciesDataRegistry.getStarterCost(speciesId);
      const hatchedEggs = data.dexData[speciesId].hatchedCount ?? 0;
      const thresholds = eggCostReductionThresholds[startercost] ?? [];
      let thresholdReached = 0;
      for (const threshold of thresholds) {
        if (hatchedEggs >= threshold) {
          thresholdReached++;
        }
      }
      data.dexData[speciesId].pity[1] = 3 * thresholdReached;
    }
  },
};

export const systemMigrators: readonly SystemSaveMigrator[] = [addPityTracker] as const;
