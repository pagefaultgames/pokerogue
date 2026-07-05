import { defaultStarterSpecies } from "#app/constants";
import { speciesDataRegistry } from "#app/global-species-data-registry";
import { DexAttr } from "#enums/dex-attr";
import { SpeciesId } from "#enums/species-id";
import type { SystemSaveMigrator } from "#types/save-migrators";
import { getEnumValues } from "#utils/enums";

const fixDexData: SystemSaveMigrator = {
  version: "1.12.0.1",
  migrate: (data): void => {
    const defaultStarterAttr =
      DexAttr.NON_SHINY | DexAttr.MALE | DexAttr.FEMALE | DexAttr.DEFAULT_VARIANT | DexAttr.DEFAULT_FORM;

    for (const speciesId of getEnumValues(SpeciesId)) {
      if (!speciesDataRegistry.isStarter(speciesId) || defaultStarterSpecies.includes(speciesId)) {
        continue;
      }

      const starterEntry = data.starterData[speciesId];
      const dexEntry = data.dexData[speciesId];

      const species = SpeciesId[speciesId];

      if (starterEntry == null) {
        console.warn("Missing starter data for %s (%d)!", species, speciesId);
      }
      if (dexEntry == null) {
        console.warn("Missing dex data for %s (%d)!", species, speciesId);
      }

      const hasStarterData =
        starterEntry.abilityAttr > 1
        || starterEntry.eggMoves > 0
        || starterEntry.moveset != null
        || starterEntry.passiveAttr > 0
        || starterEntry.valueReduction > 0;

      const noDexData = dexEntry.caughtCount === 0 && dexEntry.hatchedCount === 0 && dexEntry.caughtAttr === 0n;

      if (hasStarterData && noDexData) {
        console.warn("Missing dex data for %s (%d), creating backup data.", species, speciesId);

        data.dexData[speciesId] = {
          ...data.dexData[speciesId],
          caughtCount: 1,
          caughtAttr: defaultStarterAttr,
          natureAttr: 1,
          ivs: [15, 15, 15, 15, 15, 15],
        };
      }
    }
  },
};

export const systemMigrators: readonly SystemSaveMigrator[] = [fixDexData] as const;
