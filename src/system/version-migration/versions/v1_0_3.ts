import { defaultStarterSpecies } from "#app/constants";
import { speciesDataRegistry } from "#app/global-species-data-registry";
import { AbilityAttr } from "#enums/ability-attr";
import { DexAttr } from "#enums/dex-attr";
import type { SystemSaveData } from "#types/save-data";
import type { SystemSaveMigrator } from "#types/save-migrators";

const createStarterData: SystemSaveMigrator = {
  name: "createStarterData",
  version: "1.0.3",
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: it's simpler this way
  migrate: (data: SystemSaveData): void => {
    if (data.starterData != null) {
      return;
    }

    const allStarterIds = speciesDataRegistry.getAllStarters();

    data.starterData = {};
    for (const speciesId of allStarterIds) {
      data.starterData[speciesId] = {
        moveset: null,
        eggMoves: 0,
        candyCount: 0,
        friendship: 0,
        abilityAttr: defaultStarterSpecies.includes(speciesId) ? AbilityAttr.ABILITY_1 : 0,
        passiveAttr: 0,
        valueReduction: 0,
        classicWinCount: 0,
      };
    }

    if (data["starterMoveData"]) {
      const starterMoveData = data["starterMoveData"];
      for (const s of Object.keys(starterMoveData)) {
        if (data.starterData[s]) {
          data.starterData[s].moveset = starterMoveData[s];
        }
      }
      data["starterMoveData"] = undefined;
    }

    if (data["starterEggMoveData"]) {
      const starterEggMoveData = data["starterEggMoveData"];
      for (const s of Object.keys(starterEggMoveData)) {
        if (data.starterData[s]) {
          data.starterData[s].eggMoves = starterEggMoveData[s];
        }
      }
      data["starterEggMoveData"] = undefined;
    }

    for (const starter of allStarterIds) {
      if (data.dexData[starter] == null) {
        continue;
      }
      const caughtAttr = data.dexData[starter].caughtAttr;

      data.starterData[starter].abilityAttr =
        (caughtAttr & DexAttr.DEFAULT_VARIANT ? AbilityAttr.ABILITY_1 : 0)
        | (caughtAttr & DexAttr.VARIANT_2 ? AbilityAttr.ABILITY_2 : 0)
        | (caughtAttr & DexAttr.VARIANT_3 ? AbilityAttr.ABILITY_HIDDEN : 0);

      if (caughtAttr) {
        if (!(caughtAttr & DexAttr.DEFAULT_VARIANT)) {
          data.dexData[starter].caughtAttr ^= DexAttr.DEFAULT_VARIANT;
        }
        if (caughtAttr & DexAttr.VARIANT_2) {
          data.dexData[starter].caughtAttr ^= DexAttr.VARIANT_2;
        }
        if (caughtAttr & DexAttr.VARIANT_3) {
          data.dexData[starter].caughtAttr ^= DexAttr.VARIANT_3;
        }
      }

      data.starterData[starter].candyCount += data.dexData[starter].caughtCount;
      data.starterData[starter].candyCount += data.dexData[starter].hatchedCount * 2;
      if (data.dexData[starter].caughtAttr & DexAttr.SHINY) {
        data.starterData[starter].candyCount += 4;
      }
    }
  },
};

export const systemMigrators: readonly SystemSaveMigrator[] = [createStarterData] as const;
