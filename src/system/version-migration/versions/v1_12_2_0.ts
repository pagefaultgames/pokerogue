import { speciesDataRegistry } from "#app/global-species-data-registry";
import { DexAttr } from "#enums/dex-attr";
import type { SystemSaveMigrator } from "#types/save-migrators";

const eggCostReductionThresholds = {
  1: [20, 40, 80],
  2: [20, 40, 80],
  3: [20, 40, 80],
  4: [15, 30, 60],
  5: [15, 30, 60],
  6: [15, 30, 60],
  7: [10, 20, 40],
  8: [10, 20, 40],
  9: [10, 20, 40],
  10: [8, 16, 32],
} as const;

const addPityTracker: SystemSaveMigrator = {
  name: "addPityTracker",
  version: "1.12.2.0",
  migrate: (data): void => {
    for (const speciesId of speciesDataRegistry.getAllStarters()) {
      if (data.starterData[speciesId].pity == null) {
        data.starterData[speciesId].pity = [0, 0];
      }
      const caughtAttr = data.dexData[speciesId].caughtAttr;
      const missingVariants = [DexAttr.VARIANT_2, DexAttr.VARIANT_3].filter(v => !(caughtAttr & v));
      if (missingVariants.length === 0) {
        continue;
      }
      // compensate for removing existing egg cost reductions
      const startercost = speciesDataRegistry.getStarterCost(speciesId);
      const hatchedEggs = data.dexData[speciesId].hatchedCount;
      const thresholds = eggCostReductionThresholds[startercost] ?? [];
      let thresholdReached = 0;
      for (const threshold of thresholds) {
        if (hatchedEggs >= threshold) {
          thresholdReached++;
        }
      }
      data.starterData[speciesId].pity[1] = 3 * thresholdReached;
    }
  },
};

export const systemMigrators: readonly SystemSaveMigrator[] = [addPityTracker] as const;
