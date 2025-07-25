import { DexAttr } from "#enums/dex-attr";
import { SpeciesId } from "#enums/species-id";
import type { SystemSaveData } from "#system/game-data";
import type { SystemSaveMigrator } from "#types/system-save-migrator";
import { getPokemonSpecies } from "#utils/pokemon-utils";

/**
 * If a starter is caught, but the only forms registered as caught are not starterSelectable,
 * unlock the default form.
 * @param data - {@linkcode SystemSaveData}
 */
const migratePichuForms: SystemSaveMigrator = {
  version: "1.8.3",
  migrate: (data: SystemSaveData): void => {
    if (data.starterData && data.dexData) {
      // This is Pichu's Pokédex number
      const sd = 172;
      const caughtAttr = data.dexData[sd]?.caughtAttr;
      const species = getPokemonSpecies(sd);
      // An extra check because you never know
      if (species.speciesId === SpeciesId.PICHU && caughtAttr) {
        // Ensuring that only existing forms are unlocked
        data.dexData[sd].caughtAttr &= species.getFullUnlocksData();
        // If no forms are unlocked now, since Pichu is caught, we unlock form 0
        data.dexData[sd].caughtAttr |= DexAttr.DEFAULT_FORM;
      }
    }
  },
};

export const systemMigrators: readonly SystemSaveMigrator[] = [migratePichuForms] as const;
